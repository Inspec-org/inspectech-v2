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

export type MediaImageResult = {
  label: string;
  status: 'pass' | 'fail' | 'error';
  message: string;
  issues: string[];
  details: string[]; // All component-level lines from CV (pass + fail)
};

export type MediaReport = {
  mediaStatus: 'pass' | 'fail';
  missingImages: string[];
  imageResults: MediaImageResult[];
};

/**
 * Calls the checklist-only processInspection API.
 * Media inspection is handled separately via processMediaInspection().
 */
export const processInspection = async (unitId: string): Promise<ProcessResult> => {
  const res = await apiRequest(
    `/mobile-api/inspections/processInspection?unitId=${encodeURIComponent(unitId)}`
  );
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Failed to process inspection');
  }
  const { status, missing, missingKeys } = json.data;
  return { status, missing, missingKeys };
};

/**
 * Calls the processMedia API for CV + missing-image validation.
 */
export const processMediaInspection = async (unitId: string): Promise<MediaReport> => {
  const res = await apiRequest(
    `/mobile-api/inspections/processMedia?unitId=${encodeURIComponent(unitId)}`
  );
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Failed to process media inspection');
  }
  return json.data as MediaReport;
};

/**
 * Runs checklist + media inspection in parallel for a given unitId.
 * Returns both results independently so a failure in one doesn't block the other.
 */
export const processInspectionFull = async (
  unitId: string
): Promise<{
  checklistResult: ProcessResult;
  sections: ProcessSections;
  mediaReport: MediaReport | null;
}> => {
  const [checklistRes, mediaRes] = await Promise.allSettled([
    apiRequest(`/mobile-api/inspections/processInspection?unitId=${encodeURIComponent(unitId)}`).then(
      (r) => r.json()
    ),
    apiRequest(`/mobile-api/inspections/processMedia?unitId=${encodeURIComponent(unitId)}`).then(
      (r) => r.json()
    ),
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

  return {
    checklistResult: { status, missing, missingKeys },
    sections,
    mediaReport,
  };
};

/**
 * Opens a new tab with a detailed HTML report showing both
 * checklist validation and media inspection results.
 */
export const openDetailedResults = (
  unitId: string,
  sections: ProcessSections,
  mediaReport?: MediaReport | null
): void => {
  const win = window.open('', '_blank');
  if (!win) return;

  const sectionDefs = [
    { name: 'Identification & Registration', data: sections.identification },
    { name: 'Physical Dimensions & Components', data: sections.physicalDimension },
    { name: 'Tire Location', data: sections.tireLocation },
    { name: 'Features & Appearance', data: sections.features },
    { name: 'Sensors & Electrical', data: sections.sensors },
  ];

  const allPass = sectionDefs.every((s) => s.data.missing.length === 0);

  const checklistHtml = sectionDefs
    .map((s) => {
      const pass = s.data.missing.length === 0;
      const missHtml = pass
        ? `<div class="ok">All fields present</div>`
        : `<div class="miss"><div class="muted">Missing fields:</div><ul>${s.data.missing
            .map((m) => `<li>${m}</li>`)
            .join('')}</ul></div>`;
      return `<div class="sub"><div class="sub-head"><div>${pass ? '✅' : '❌'} <strong>${s.name}</strong></div></div>${missHtml}</div>`;
    })
    .join('');

  // --- Media section HTML ---
  let mediaHtml = '';
  let mediaPillClass = 'pending';
  let mediaPillText = 'PENDING';

  if (!mediaReport) {
    mediaHtml = `<div class="sub"><p style="color:#6b7280;font-size:13px;">Media inspection result unavailable.</p></div>`;
  } else {
    mediaPillClass = mediaReport.mediaStatus === 'pass' ? 'pass' : 'fail';
    mediaPillText = mediaReport.mediaStatus.toUpperCase();

    mediaHtml = mediaReport.imageResults
      .map((img) => {
        const icon = img.status === 'pass' ? '✅' : img.status === 'error' ? '⚠️' : '❌';
        const statusColor =
          img.status === 'pass' ? '#059669' : img.status === 'error' ? '#b45309' : '#dc2626';

        // Show all component detail lines; highlight ones that are also issues
        const issueSet = new Set(img.issues ?? []);
        const detailLines = (img.details && img.details.length > 0) ? img.details : img.issues ?? [];

        const detailsHtml = detailLines.length > 0
          ? `<ul class="detail-list">${detailLines
              .map((d) => {
                const isIssue = issueSet.has(d);
                return `<li class="${isIssue ? 'issue-item' : 'ok-item'}">${d}</li>`;
              })
              .join('')}</ul>`
          : '';

        return `
          <div class="sub">
            <div class="sub-head">
              <div>${icon} <strong>${img.label}</strong></div>
              <span style="font-size:12px;color:${statusColor};font-weight:600;">${img.status.toUpperCase()}</span>
            </div>
            <div class="muted" style="margin-bottom:6px;">${img.message}</div>
            ${detailsHtml}
          </div>`;
      })
      .join('');
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
      .pill.pass { background: #ecfdf5; color: #065f46; border-color: #34d399; }
      .pill.fail { background: #fee2e2; color: #7f1d1d; border-color: #fca5a5; }
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
      .ok-item { color: #059669; }
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
};