import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/db";
import Inspection from "@/lib/models/Inspections";
import { getUserFromToken } from "@/lib/getUserFromToken";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.split(" ")[1];
    const user = await getUserFromToken(token);
    if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const page = parseInt(body.page ?? 1, 10);
    const limit = parseInt(body.limit ?? 10, 10);
    const idsOnly: boolean = Boolean(body.idsOnly);
    const department = body.department ?? undefined;
    const vendorId = body.vendorId ?? undefined;

    const filter = body.filter ?? {};
    const unitId = filter.unitId ?? undefined;
    const unitIds: string[] | undefined = Array.isArray(filter.unitIds) ? filter.unitIds : undefined;
    const inspectionStatus = filter.inspectionStatus ?? undefined;
    const inspectionStatuses: string[] | undefined = Array.isArray(filter.inspectionStatuses) ? filter.inspectionStatuses : undefined;
    const type = filter.type ?? undefined;
    const types: string[] | undefined = Array.isArray(filter.types) ? filter.types : undefined;
    const inspector = filter.inspector ?? undefined;
    const inspectors: string[] | undefined = Array.isArray(filter.inspectors) ? filter.inspectors : undefined;
    const vendor = filter.vendor ?? undefined;
    const vendors: string[] | undefined = Array.isArray(filter.vendors) ? filter.vendors : undefined;
    const location = filter.location ?? undefined;
    const locations: string[] | undefined = Array.isArray(filter.locations) ? filter.locations : undefined;
    const delivered = filter.delivered ?? undefined;
    const deliveredStatuses: string[] | undefined = Array.isArray(filter.deliveredStatuses) ? filter.deliveredStatuses : undefined;
    const search = filter.search ?? undefined;
    const duration = filter.duration ?? undefined;
   
    await connectDB();

    const query: any = {};
    if (unitIds && unitIds.length) query.unitId = { $in: unitIds };
    else if (unitId) query.unitId = unitId;

    if (inspectionStatuses && inspectionStatuses.length) query.inspectionStatus = { $in: inspectionStatuses };
    else if (inspectionStatus) query.inspectionStatus = inspectionStatus;

    if (types && types.length) query.type = { $in: types };
    else if (type) query.type = type;

    if (inspectors && inspectors.length) query.inspector = { $in: inspectors };
    else if (inspector) query.inspector = inspector;

    if (vendors && vendors.length) query.vendor = { $in: vendors };
    else if (vendor) query.vendor = vendor;

    if (locations && locations.length) query.location = { $in: locations };
    else if (location) query.location = location;

    if (deliveredStatuses && deliveredStatuses.length) query.delivered = { $in: deliveredStatuses };
    else if (delivered) query.delivered = delivered;

    if (Array.isArray(duration) && duration.length) {
      const conds = duration.map((d: string) => {
        const m = /^([0-9]+)m\s*([0-9]+)s$/.exec(d);
        return m ? { durationMin: m[1], durationSec: m[2] } : null;
      }).filter(Boolean) as any[];
      if (conds.length) {
        if (query.$or) {
          const prevOr = query.$or;
          delete query.$or;
          query.$and = [{ $or: prevOr }, { $or: conds }];
        } else {
          query.$or = conds;
        }
      }
    } else if (typeof duration === 'string') {
      const m = /^([0-9]+)m\s*([0-9]+)s$/.exec(duration);
      if (m) {
        query.durationMin = m[1];
        query.durationSec = m[2];
      }
    }

    if (search) {
      query.$or = [
        { unitId: new RegExp(search, "i") },
        { inspector: new RegExp(search, "i") },
        { vendor: new RegExp(search, "i") },
        { location: new RegExp(search, "i") },
        { type: new RegExp(search, "i") },
      ];
    }
    if (department) query.departmentId = department;

    if (vendorId) query.userId = vendorId;



    const total = await Inspection.countDocuments(query);
    if (idsOnly) {
      const all = await Inspection.find(query).select('unitId').lean();
      const allUnitIds = all.map((d: any) => d.unitId);
      return NextResponse.json({ success: true, allUnitIds, total });
    }
    console.log(query);

    const inspections = await Inspection.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return NextResponse.json({ success: true, inspections, total, page, limit });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}