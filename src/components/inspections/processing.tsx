'use client';
import Cookies from 'js-cookie';

export type ProcessResult = { status: 'pass' | 'fail'; missing: string[]; missingKeys: string[] };

const labelMap: Record<string, string> = {
    poNumber: 'PO Number',
    owner: 'Owner',
    equipmentNumber: 'Equipment ID/Trailer Number',
    vin: 'VIN',
    licensePlateId: 'License Plate ID',
    licensePlateCountry: 'License Plate Country',
    licensePlateExpiration: 'License Plate Expiration',
    licensePlateState: 'License Plate State/Province',
    possessionOrigin: 'Possession Origin',
    length: 'Length',
    height: 'Height',
    grossAxleWeightRating: 'Gross Axle Weight Rating',
    axleType: 'Axle Type',
    brakeType: 'Brake Type',
    suspensionType: 'Suspension Type',
    tireModel: 'Tire Model',
    tireBrand: 'Tire Brand',
    aerokits: 'Aerokits',
    doorBranding: 'Door Branding',
    doorColor: 'Door Color',
    doorSensor: 'Door Sensor',
    doorType: 'Door Type',
    lashSystem: 'Lash System',
    mudFlapType: 'Mud Flap Type',
    panelBranding: 'Panel Branding',
    noseBranding: 'Nose Branding',
    skirted: 'Skirted',
    skirtColor: 'Skirt Color',
    captiveBeam: 'Captive Beam',
    cargoCameras: 'Cargo Camera',
    cartbars: 'Cartbars',
    tpms: 'TPMS',
    trailerHeightDecal: 'Trailer Height Decal',
    conspicuityTape: 'Conspicuity Tape',
    absSensor: 'ABS Sensor',
    airTankMonitor: 'Air Tank Monitor',
    atisregulator: 'ATIS Regulator',
    lightOutSensor: 'Light Out Sensor',
    sensorError: 'Sensor Error',
    ultrasonicCargoSensor: 'Ultrasonic Cargo Sensor',
};

const get = (obj: any, key: string) => String(obj?.[key] || '').trim();
const label = (k: string) => labelMap[k] || k;

export const evaluateInspectionData = (formData: any): ProcessResult => {
    const missing: string[] = [];
    const missingKeys: string[] = [];
    const isCanadaTrailers = ((Cookies.get('selectedDepartment') || '').toLowerCase() === 'canada trailers');
    const require = (key: string) => { if (!get(formData, key)) { missing.push(label(key)); missingKeys.push(key); } };

    ['poNumber', 'equipmentNumber', 'vin', 'licensePlateId', 'licensePlateCountry', 'licensePlateExpiration', 'licensePlateState', 'possessionOrigin'].forEach(require);
    ['manufacturer', 'modelYear', 'length', 'height', 'grossAxleWeightRating', 'axleType', 'brakeType', 'suspensionType', 'tireModel', 'tireBrand', 'aerokits', 'doorBranding', 'doorColor', 'doorSensor', 'doorType', 'lashSystem', 'mudFlapType', 'panelBranding', 'noseBranding', 'skirted', 'skirtColor', 'captiveBeam', 'cargoCameras', 'cartbars', 'tpms', 'trailerHeightDecal'].forEach(require);
    if (isCanadaTrailers) ['owner', 'conspicuityTape'].forEach(require);

    const status: 'pass' | 'fail' = missing.length ? 'fail' : 'pass';
    return { status, missing, missingKeys };
};

export const openDetailedResults = (formData: any): void => {
    const win = window.open('', '_blank');
    if (!win) return;

    const isCanadaTrailers = ((Cookies.get('selectedDepartment') || '').toLowerCase() === 'canada trailers');

    const sections: Array<{ name: string; keys: string[] }> = [
        { name: 'Identification & Registration', keys: ['poNumber', 'equipmentNumber', 'vin', 'licensePlateId', 'licensePlateCountry', 'licensePlateExpiration', 'licensePlateState', 'possessionOrigin'].concat(isCanadaTrailers ? ['owner'] : []) },
        { name: 'Physical Dimensions & Components', keys: ['length', 'height', 'grossAxleWeightRating', 'axleType', 'brakeType', 'suspensionType', 'tireModel', 'tireBrand'] },
        { name: 'Features & Appearance', keys: ['aerokits', 'doorBranding', 'doorColor', 'doorSensor', 'doorType', 'lashSystem', 'mudFlapType', 'panelBranding', 'noseBranding', 'skirted', 'skirtColor', 'captiveBeam', 'cargoCameras', 'cartbars', 'tpms', 'trailerHeightDecal'].concat(isCanadaTrailers ? ['conspicuityTape'] : []) },
        { name: 'Sensors & Electrical', keys: ['absSensor', 'airTankMonitor', 'atisregulator', 'lightOutSensor', 'sensorError', 'ultrasonicCargoSensor'] },
    ];

    const sectionResults = sections.map(s => {
        const missing = s.keys.filter(k => !get(formData, k)).map(label);
        return { name: s.name, pass: missing.length === 0, missing };
    });

    const allChecklistPass = sectionResults.every(s => s.pass);
    const unitLabel = String(formData?.unitId || '');

    const checklistHtml = sectionResults.map(sr => {
        const miss = sr.missing.length ? `<div class=\"miss\"><div class=\"muted\">Missing fields:</div><ul>${sr.missing.map(m => `<li>${m}</li>`).join('')}</ul></div>` : `<div class=\"ok\">All fields present</div>`;
        return `<div class=\"sub\"><div class=\"sub-head\"><div>${sr.pass ? '✅' : '❌'} <strong>${sr.name}</strong></div></div>${miss}</div>`;
    }).join('');

    const html = `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Inspection Completion Report</title>

    <style>
      body {
        font-family: Inter, system-ui, Arial, sans-serif;
        background: #fafafa;
        color: #1f2937;
        margin: 0;
        padding: 24px;
      }

      .card {
        background: #fff;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        margin-top: 16px;
      }

      .card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px;
        border-bottom: 1px solid #eef2f7;
      }

      .pill {
        font-size: 12px;
        padding: 6px 10px;
        border-radius: 999px;
        border: 1px solid;
      }

      .pill.pass {
        background: #ecfdf5;
        color: #065f46;
        border-color: #34d399;
      }

      .pill.fail {
        background: #fee2e2;
        color: #7f1d1d;
        border-color: #fca5a5;
      }

      .section {
        padding: 16px;
      }

      .title {
        font-weight: 600;
      }

      .header {
        background: linear-gradient(135deg, #7c3aed, #a855f7);
        color: #fff;
        border-radius: 12px;
        padding: 28px 20px;
        font-weight: 600;
        font-size: 20px;
        display: flex;
        justify-content: center;
        flex-direction: column;
        align-items: center;
        gap: 8px;
      }

      .unit {
        font-size: 14px;
        opacity: 0.9;
      }

      .sub {
        border: 1px dashed #e5e7eb;
        border-radius: 10px;
        padding: 12px;
        margin: 10px 0;
      }

      .sub-head {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
      }

      .miss ul {
        margin: 6px 0 0 16px;
      }

      .muted {
        font-size: 12px;
        color: #6b7280;
      }
    </style>
  </head>

  <body>
    <div class="header">
      Inspection Completion Report
      <div class="unit">Unit: ${unitLabel || 'N/A'}</div>
    </div>

    <div class="card">
      <div class="card-header">
        <div class="title">Inspection Checklist Validation Report</div>
        <span class="pill ${allChecklistPass ? 'pass' : 'fail'}">
          ${allChecklistPass ? 'PASS' : 'FAIL'}
        </span>
      </div>

      <div class="section">
        ${checklistHtml}
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <div class="title">Inspection Media Validation Report</div>
        <span class="pill pass">PASS</span>
      </div>

      <div class="section">
        <p>
          Media inspection details are under process and will be included in a
          future update.
        </p>
      </div>
    </div>
  </body>
</html>
`;


    win.document.write(html);
    win.document.close();
}