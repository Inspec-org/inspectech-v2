'use client';
import { apiRequest } from '@/utils/apiWrapper';

export type ProcessResult = { status: 'pass' | 'fail'; missing: string[]; missingKeys: string[] };

export type ProcessSections = {
  identification: { missingKeys: string[]; missing: string[] };
  physicalDimension: { missingKeys: string[]; missing: string[] };
  tireLocation: { missingKeys: string[]; missing: string[] };
  features: { missingKeys: string[]; missing: string[] };
  sensors: { missingKeys: string[]; missing: string[] };
};

export type CvComponent = Record<string, string | { status: string; count?: string; [key: string]: any }>;

export type CvGroup = {
  label: string;
  images_provided: string[];
  components: CvComponent;
  notes: string[];
};

export type CvReport = {
  status: 'success' | 'fail';
  images_received: string[];
  labels_missing: string[];
  report: Record<string, CvGroup>; // keyed by cvGroup: "front" | "rear" | "inside" | "door"
};

export type MediaReport = {
  mediaStatus: 'pass' | 'fail';
  missingImages: string[];
  cvReport: CvReport | null;
};

export const processInspection = async (unitId: string): Promise<ProcessResult> => {
  const res = await apiRequest(
    `/mobile-api/inspections/processInspection?unitId=${encodeURIComponent(unitId)}`
  );
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || 'Failed to process inspection');
  const { status, missing, missingKeys } = json.data;
  return { status, missing, missingKeys };
};

export const processMediaInspection = async (unitId: string): Promise<MediaReport> => {
  const res = await apiRequest(
    `/mobile-api/inspections/processMedia?unitId=${encodeURIComponent(unitId)}`
  );
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || 'Failed to process media inspection');
  return json.data as MediaReport;
};

export const processInspectionFull = async (
  unitId: string
): Promise<{
  checklistResult: ProcessResult;
  sections: ProcessSections;
  mediaReport: MediaReport | null;
}> => {
  const [checklistRes, mediaRes] = await Promise.allSettled([
    apiRequest(`/mobile-api/inspections/processInspection?unitId=${encodeURIComponent(unitId)}`).then((r) => r.json()),
    apiRequest(`/mobile-api/inspections/processMedia?unitId=${encodeURIComponent(unitId)}`).then((r) => r.json()),
  ]);

  if (checklistRes.status === 'rejected' || !checklistRes.value?.success) {
    throw new Error(
      checklistRes.status === 'rejected'
        ? checklistRes.reason?.message
        : checklistRes.value?.message || 'Failed to process inspection'
    );
  }

  const { status, missing, missingKeys, sections } = checklistRes.value.data;

  let mediaReport: MediaReport | null = null;
  if (mediaRes.status === 'fulfilled' && mediaRes.value?.success) {
    mediaReport = mediaRes.value.data as MediaReport;
  }

  return { checklistResult: { status, missing, missingKeys }, sections, mediaReport };
};

export const openDetailedResults = (
  unitId: string,
  sections: ProcessSections,
  mediaReport?: MediaReport | null
): void => {
  const win = window.open('', '_blank');
  if (!win) return;

  try {
    const sectionDefs = [
      { name: 'Identification & Registration',    data: sections.identification    },
      { name: 'Physical Dimensions & Components', data: sections.physicalDimension },
      { name: 'Tire Location',                    data: sections.tireLocation      },
      { name: 'Features & Appearance',            data: sections.features          },
      { name: 'Sensors & Electrical',             data: sections.sensors           },
    ];

    const allPass = sectionDefs.every((s) => s.data.missing.length === 0);

    const checklistHtml = sectionDefs
      .map((s) => {
        const pass = s.data.missing.length === 0;
        const missHtml = pass
          ? `<div class="ok">All fields present</div>`
          : `<div class="miss"><div class="muted">Missing fields:</div><ul>${s.data.missing.map((m) => `<li>${m}</li>`).join('')}</ul></div>`;
        return `<div class="sub"><div class="sub-head"><div>${pass ? '✅' : '❌'} <strong>${s.name}</strong></div></div>${missHtml}</div>`;
      })
      .join('');

    // ── helpers ──────────────────────────────────────────────────
    const getStatusStr = (val: any): string => {
      if (typeof val === 'string') return val.toLowerCase();
      if (val && typeof val === 'object') return String(val.status ?? '').toLowerCase();
      return String(val ?? '').toLowerCase();
    };

    const getDisplayVal = (val: any): string => {
      if (typeof val === 'string') return val;
      if (val && typeof val === 'object') {
        const v = val as any;
        return v.count ? `${v.status} (${v.count})` : String(v.status ?? '');
      }
      return String(val ?? '');
    };

    const isIssueVal = (val: any): boolean => {
      const s = getStatusStr(val);
      return s === 'missing' || s.startsWith('partially');
    };

    // ── Media section ─────────────────────────────────────────────
    let mediaHtml = '';
    let mediaPillClass = 'pending';
    let mediaPillText = 'PENDING';

    if (!mediaReport) {
      mediaHtml = `
        <div class="sub" style="display:flex;align-items:center;gap:10px;color:#92400e;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="#d97706" stroke-width="3" stroke-dasharray="40 20">
              <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
            </circle>
          </svg>
          <span style="font-size:13px;">Media analysis is still in progress. Re-open this report after it completes.</span>
        </div>`;
    } else {
      mediaPillClass = mediaReport.mediaStatus === 'pass' ? 'pass' : 'fail';
      mediaPillText  = mediaReport.mediaStatus.toUpperCase();

      const cv = mediaReport.cvReport;

      // Missing images
      if (mediaReport.missingImages.length > 0) {
        mediaHtml += `
          <div class="sub">
            <div class="sub-head"><div>⚠️ <strong>Images Not Uploaded</strong></div></div>
            <ul class="detail-list">${mediaReport.missingImages.map((m) => `<li class="issue-item">${m}</li>`).join('')}</ul>
          </div>`;
      }

      // CV report groups
      if (cv && cv.report) {
        for (const [, group] of Object.entries(cv.report) as [string, CvGroup][]) {
          const components = group.components ?? {};
          const notes      = group.notes ?? [];

          const componentRows = Object.entries(components)
            .map(([name, val]) => {
              const isIssue = isIssueVal(val);
              return `<li class="${isIssue ? 'issue-item' : 'ok-item'}">${name}: ${getDisplayVal(val)}</li>`;
            })
            .join('');

          const noteRows = notes
            .map((n) => `<li class="issue-item">${n}</li>`)
            .join('');

          // Safe groupHasIssues — no .toLowerCase() on unknown shapes
          const groupHasIssues =
            Object.values(components).some((v) => isIssueVal(v)) || notes.length > 0;

          mediaHtml += `
            <div class="sub">
              <div class="sub-head">
                <div>${groupHasIssues ? '❌' : '✅'} <strong>${group.label}</strong></div>
                <span class="muted">Provided: ${group.images_provided.join(', ')}</span>
              </div>
              ${componentRows || noteRows
                ? `<ul class="detail-list">${componentRows}${noteRows}</ul>`
                : '<div class="ok">All checks passed</div>'
              }
            </div>`;
        }
      }

      // Labels CV couldn't process
      if (cv && cv.labels_missing.length > 0) {
        mediaHtml += `
          <div class="sub">
            <div class="sub-head"><div>⚠️ <strong>Labels Not Processed by CV</strong></div></div>
            <ul class="detail-list">${cv.labels_missing.map((l) => `<li class="issue-item">${l}</li>`).join('')}</ul>
          </div>`;
      }

      if (!cv) {
        mediaHtml += `<div class="sub muted">CV analysis unavailable.</div>`;
      }
    }

    const html = `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Inspection Completion Report</title>
    <style>
      body { font-family: Inter, system-ui, Arial, sans-serif; background: #fafafa; color: #1f2937; margin: 0; padding: 24px; }
      .card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; margin-top: 16px; }
      .card-header { display: flex; align-items: center; justify-content: space-between; padding: 16px; border-bottom: 1px solid #eef2f7; }
      .pill { font-size: 12px; padding: 6px 10px; border-radius: 999px; border: 1px solid; }
      .pill.pass    { background: #ecfdf5; color: #065f46; border-color: #34d399; }
      .pill.fail    { background: #fee2e2; color: #7f1d1d; border-color: #fca5a5; }
      .pill.pending { background: #fefce8; color: #713f12; border-color: #fde047; }
      .section { padding: 16px; }
      .title { font-weight: 600; }
      .header { background: linear-gradient(135deg, #7c3aed, #a855f7); color: #fff; border-radius: 12px; padding: 28px 20px; font-weight: 600; font-size: 20px; display: flex; justify-content: center; flex-direction: column; align-items: center; gap: 8px; }
      .unit { font-size: 14px; opacity: 0.9; }
      .sub { border: 1px dashed #e5e7eb; border-radius: 10px; padding: 12px; margin: 10px 0; }
      .sub-head { display: flex; justify-content: space-between; margin-bottom: 8px; }
      .miss ul, .detail-list { margin: 6px 0 0 16px; }
      .muted { font-size: 12px; color: #6b7280; }
      .ok { font-size: 13px; color: #059669; }
      .detail-list { font-size: 13px; list-style: disc; }
      .ok-item    { color: #059669; }
      .issue-item { color: #b91c1c; font-weight: 500; }
    </style>
  </head>
  <body>
    <div class="header">
      Inspection Completion Report
      <div class="unit">Unit: ${unitId || 'N/A'}</div>
    </div>
    <div class="card">
      <div class="card-header">
        <div class="title">Inspection Checklist Validation Report</div>
        <span class="pill ${allPass ? 'pass' : 'fail'}">${allPass ? 'PASS' : 'FAIL'}</span>
      </div>
      <div class="section">${checklistHtml}</div>
    </div>
    <div class="card">
      <div class="card-header">
        <div class="title">Inspection Media Validation Report</div>
        <span class="pill ${mediaPillClass}">${mediaPillText}</span>
      </div>
      <div class="section">${mediaHtml}</div>
    </div>
  </body>
</html>`;

    win.document.write(html);
    win.document.close();

  } catch (err) {
    // Write the error into the tab so you can see exactly what went wrong
    win.document.write(`<pre style="color:red;padding:24px;">${String(err)}\n\n${(err as any)?.stack ?? ''}</pre>`);
    win.document.close();
  }
};