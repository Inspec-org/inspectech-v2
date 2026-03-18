import requests
import getpass
import datetime
import csv
import os
import pandas as pd
from ipywidgets import Text, Password, Dropdown, Button, HBox, VBox, Label, SelectMultiple, Output
from IPython.display import display, clear_output
try:
    from ipydatagrid import DataGrid
    HAS_GRID = True
except Exception:
    HAS_GRID = False

BASE_URL = "https://inspec-tech.vercel.app"

def login(base_url, email, password):
    r = requests.post(f"{base_url}/api/auth/login", json={"email": email, "password": password})
    j = r.json()
    if not r.ok or not j.get("success"):
        msg = j.get("message") or "Login failed"
        raise RuntimeError(msg)
    return j["token"], j["user"]

def get_vendors(base_url, token):
    r = requests.get(f"{base_url}/api/vendors/get-vendors", headers={"Authorization": f"Bearer {token}"})
    j = r.json()
    vendors = j.get("vendors") or j.get("data") or []
    if not r.ok:
        msg = j.get("error") or j.get("message") or "Failed to fetch vendors"
        raise RuntimeError(msg)
    return [{"_id": v.get("_id"), "name": v.get("name")} for v in vendors if v.get("_id") and v.get("name")]

def get_departments_for_vendor(base_url, token, vendor_id):
    r = requests.get(f"{base_url}/api/departments/get-departments?vendorId={vendor_id}", headers={"Authorization": f"Bearer {token}"})
    j = r.json()
    if not r.ok or not j.get("departments"):
        msg = j.get("error") or j.get("message") or "Failed to fetch departments"
        raise RuntimeError(msg)
    return [{"_id": d.get("_id"), "name": d.get("name")} for d in j["departments"] if d.get("_id") and d.get("name")]

def fetch_inspections(base_url, token, department_id, vendor_id, page_size=1000):
    all_items = []
    page = 1
    total = None
    while True:
        body = {"page": page, "limit": page_size, "department": department_id, "vendorId": vendor_id}
        r = requests.post(f"{base_url}/api/inspections/get-inspections", headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"}, json=body)
        j = r.json()
        if not r.ok or not j.get("success"):
            msg = j.get("message") or "Failed to fetch inspections"
            raise RuntimeError(msg)
        items = j.get("inspections") or []
        if total is None:
            total = j.get("total") or 0
        all_items.extend(items)
        if len(all_items) >= total or not items:
            break
        page += 1
    return all_items

def to_csv(items, path):
    fields = ["unitId","inspectionStatus","type","inspector","vendor","location","duration","date","delivered"]
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        for it in items:
            dm = str(it.get("durationMin") or "").strip()
            ds = str(it.get("durationSec") or "").strip()
            dur = (f"{dm}m {ds}s").strip() if dm or ds else ""
            mm = str(it.get("dateMonth") or "").zfill(2)
            dd = str(it.get("dateDay") or "").zfill(2)
            yy = str(it.get("dateYear") or "")
            date = f"{mm}/{dd}/{yy}" if yy else ""
            deliv = it.get("delivered")
            if isinstance(deliv, str):
                dl = deliv.lower()
                delivered = "Yes" if dl == "yes" else "No" if dl == "no" else ""
            else:
                delivered = ""
            w.writerow({
                "unitId": it.get("unitId") or "",
                "inspectionStatus": it.get("inspectionStatus") or "",
                "type": it.get("type") or "",
                "inspector": it.get("inspector") or "",
                "vendor": it.get("vendor") or "",
                "location": it.get("location") or "",
                "duration": dur,
                "date": date,
                "delivered": delivered,
            })

def get_desktop_dir():
    home = os.path.expanduser("~")
    candidates = []
    one_drive = os.environ.get("OneDrive") or os.environ.get("OneDriveCommercial") or os.environ.get("OneDriveConsumer")
    if one_drive:
        candidates.append(os.path.join(one_drive, "Desktop"))
    candidates.append(os.path.join(home, "Desktop"))
    for p in candidates:
        if os.path.isdir(p):
            return p
    try:
        os.makedirs(candidates[-1], exist_ok=True)
        return candidates[-1]
    except Exception:
        return home

status = Label(value="")
email_w = Text(placeholder="Email")
password_w = Password(placeholder="Password")
login_btn = Button(description="Sign In")
vendor_dd = Dropdown(options=[], description="Vendor")
dept_dd = Dropdown(options=[], description="Department")
units_ms = SelectMultiple(options=[], description="Select Units", rows=10)
table_out = Output()
grid_out = Output()
download_btn = Button(description="Download CSV", disabled=True)

token_holder = {"token": None, "user": None, "vendors": [], "depts": [], "inspections": [], "df": None, "selected": []}

def on_login(btn):
    status.value = "Signing in..."
    try:
        token, user = login(BASE_URL, email_w.value.strip(), password_w.value.strip())
        token_holder["token"] = token
        token_holder["user"] = user
        status.value = "Loading vendors..."
        vendors = get_vendors(BASE_URL, token)
        token_holder["vendors"] = vendors
        vendor_dd.options = [(v["name"], v["_id"]) for v in vendors]
        status.value = "Signed in"
        download_btn.disabled = True
    except Exception as e:
        status.value = str(e)

def on_vendor_change(change):
    if change["name"] == "value" and change["new"]:
        status.value = "Loading departments..."
        try:
            deps = get_departments_for_vendor(BASE_URL, token_holder["token"], change["new"])
            token_holder["depts"] = deps
            dept_dd.options = [(d["name"], d["_id"]) for d in deps]
            # reset selection/table
            units_ms.options = []
            units_ms.value = tuple()
            with table_out:
                clear_output()
            with grid_out:
                clear_output()
            status.value = "Select department"
            download_btn.disabled = True
        except Exception as e:
            status.value = str(e)

def on_dept_change(change):
    if change["name"] == "value" and change["new"]:
        status.value = "Loading inspections..."
        try:
            items = fetch_inspections(BASE_URL, token_holder["token"], change["new"], vendor_dd.value)
            token_holder["inspections"] = items
            rows = []
            for it in items:
                mm = str(it.get("dateMonth") or "").zfill(2)
                dd = str(it.get("dateDay") or "").zfill(2)
                yy = str(it.get("dateYear") or "")
                date = f"{mm}/{dd}/{yy}" if yy else ""
                deliv = it.get("delivered")
                delivered = ""
                if isinstance(deliv, str):
                    dl = deliv.lower()
                    delivered = "Yes" if dl == "yes" else "No" if dl == "no" else ""
                dur = ""
                dm = str(it.get("durationMin") or "").strip()
                ds = str(it.get("durationSec") or "").strip()
                if dm or ds:
                    dur = f"{dm}m {ds}s".strip()
                rows.append({
                    "unitId": it.get("unitId") or "",
                    "status": it.get("inspectionStatus") or "",
                    "type": it.get("type") or "",
                    "inspector": it.get("inspector") or "",
                    "vendor": it.get("vendor") or "",
                    "location": it.get("location") or "",
                    "duration": dur,
                    "date": date,
                    "delivered": delivered,
                })
            df = pd.DataFrame(rows, columns=["unitId","status","type","inspector","vendor","location","duration","date","delivered"])
            token_holder["df"] = df
            token_holder["selected"] = []
            units_ms.options = []
            units_ms.value = tuple()
            download_btn.disabled = True
            with table_out:
                clear_output()
            with grid_out:
                clear_output()
            if HAS_GRID:
                g = DataGrid(df)
                def sel_cb(change):
                    sel_units = set()
                    try:
                        sels = g.selections or []
                        for s in sels:
                            r1 = int(s.get("r1", 0))
                            r2 = int(s.get("r2", r1))
                            for r in range(r1, r2 + 1):
                                if 0 <= r < len(df):
                                    sel_units.add(str(df.iloc[r]["unitId"]))
                    except Exception:
                        pass
                    token_holder["selected"] = sorted(sel_units)
                    download_btn.disabled = (len(token_holder["selected"]) == 0)
                g.observe(sel_cb, names="selections")
                with grid_out:
                    display(g)
                status.value = f"Loaded {len(items)} inspections. Select rows in the table."
            else:
                opts = []
                for it in items:
                    unit = it.get("unitId") or ""
                    st = it.get("inspectionStatus") or ""
                    mm = str(it.get("dateMonth") or "").zfill(2)
                    dd = str(it.get("dateDay") or "").zfill(2)
                    yy = str(it.get("dateYear") or "")
                    date = f"{mm}/{dd}/{yy}" if yy else ""
                    label = f"{unit} | {st} | {date}"
                    opts.append((label, unit))
                units_ms.options = opts
                with table_out:
                    display(df)
                status.value = f"Loaded {len(items)} inspections. Select rows to download."
        except Exception as e:
            status.value = str(e)

def on_download(btn):
    sel = list(token_holder.get("selected") or [])
    if not sel and len(units_ms.options) > 0:
        sel = list(units_ms.value)
    if not sel:
        status.value = "Please select at least one inspection"
        return
    status.value = "Preparing CSV..."
    try:
        items = [it for it in (token_holder.get("inspections") or []) if (it.get("unitId") in sel)]
        if not items:
            status.value = "No matching inspections for selected Unit IDs"
            return
        dest_dir = get_desktop_dir()
        ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        vname = next((v["name"] for v in token_holder["vendors"] if v["_id"] == vendor_dd.value), "vendor")
        dname = next((d["name"] for d in token_holder["depts"] if d["_id"] == dept_dd.value), "department")
        fname = os.path.join(dest_dir, f"inspections_{dname.replace(' ','_')}_{vname.replace(' ','_')}_{ts}.csv")
        to_csv(items, fname)
        status.value = f"Saved {len(items)} inspections to {fname}"
    except Exception as e:
        status.value = str(e)

def on_units_change(change):
    if change.get("name") == "value":
        download_btn.disabled = (len(change.get("new") or []) == 0)

login_btn.on_click(on_login)
vendor_dd.observe(on_vendor_change)
dept_dd.observe(on_dept_change)
units_ms.observe(on_units_change)
download_btn.on_click(on_download)

ui_children = [
    HBox([email_w, password_w, login_btn]),
    HBox([vendor_dd, dept_dd, download_btn]),
]
if HAS_GRID:
    ui_children += [grid_out]
else:
    ui_children += [units_ms, table_out]
ui_children += [status]
ui = VBox(ui_children)
display(ui)
