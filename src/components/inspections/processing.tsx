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
  leftFrontOuter: 'Left Front Outer',
  leftFrontInner: 'Left Front Inner',
  leftRearOuter: 'Left Rear Outer',
  leftRearInner: 'Left Rear Inner',
  rightFrontOuter: 'Right Front Outer',
  rightFrontInner: 'Right Front Inner',
  rightRearOuter: 'Right Rear Outer',
  rightRearInner: 'Right Rear Inner',
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
  cargoCamera: 'Cargo Camera',
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
  assetId: 'Asset ID or Error Message',
  estimatedDateOfAvailability: 'Estimated Date of Availability',
  purchaseDate: 'Purchase Date',
  conspicuityTapeInstallDate: 'Conspicuity Tape Install Date',
  cargoLockInstalledDate: 'Cargo Lock Installed Date',
  pulsatingLampInstallationDate: 'Pulsating Lamp Installation Date',
  pulsatingLampModel: 'Pulsating Lamp Model',  // ← add this
  treadDepthLeftFrontOuter: 'Tread Depth Left Front Outer',
  treadDepthLeftFrontInner: 'Tread Depth Left Front Inner',
  treadDepthLeftRearOuter: 'Tread Depth Left Rear Outer',
  treadDepthLeftRearInner: 'Tread Depth Left Rear Inner',
  treadDepthRightFrontOuter: 'Tread Depth Right Front Outer',
  treadDepthRightFrontInner: 'Tread Depth Right Front Inner',
  treadDepthRightRearOuter: 'Tread Depth Right Rear Outer',
  treadDepthRightRearInner: 'Tread Depth Right Rear Inner',
  manufacturer: 'Manufacturer',
  modelYear: 'Model Year',
  atisRegulator: 'ATIS Regulator',
  licensePlateStateOrProvince: 'License Plate State/Province',
  possessionOriginLocation: 'Possession Origin Location',
  equipmentId: 'Equipment ID/Trailer Number',
};

const get = (obj: any, key: string) => {
  const value = String(obj?.[key] || '').trim();
  if (value === 'dd/mm/yyyy' || value === 'mm/dd/yyyy' || value === 'yyyy-mm-dd' || value === 'DATE' || value === 'date') {
    return '';
  }
  return value;
};
const label = (k: string) => labelMap[k] || k;

export const evaluateInspectionData = (formData: any): ProcessResult => {
  const missing: string[] = [];
  const missingKeys: string[] = [];
  const isCanadaTrailers = ((Cookies.get('selectedDepartment') || '').toLowerCase() === 'canada trailers');
  const require = (key: string) => { if (!get(formData, key)) { missing.push(label(key)); missingKeys.push(key); } };

  // Check both old and new field names for backward compatibility
  const hasEquipmentId = get(formData, 'equipmentId') || get(formData, 'equipmentNumber') || get(formData, 'equipmentId');
  if (!hasEquipmentId) { missing.push('Equipment ID/Trailer Number'); missingKeys.push('equipmentId'); }

  const hasLicenseState = get(formData, 'licensePlateStateOrProvince') || get(formData, 'licensePlateState');
  if (!hasLicenseState) { missing.push('License Plate State/Province'); missingKeys.push('licensePlateStateOrProvince'); }

  ['poNumber', 'vin', 'licensePlateId', 'licensePlateCountry', 'licensePlateExpiration'].forEach(require);
  if (isCanadaTrailers) ['possessionOriginLocation'].forEach(require);

  const featureFields = ['manufacturer', 'modelYear', 'length', 'height', 'grossAxleWeightRating', 'axleType', 'brakeType', 'suspensionType', 'tireModel', 'tireBrand', 'treadDepthLeftFrontOuter', 'treadDepthLeftFrontInner', 'treadDepthLeftRearOuter', 'treadDepthLeftRearInner', 'treadDepthRightFrontOuter', 'treadDepthRightFrontInner', 'treadDepthRightRearOuter', 'treadDepthRightRearInner', 'aerokits', 'doorBranding', 'doorColor', 'doorSensor', 'doorType', 'lashSystem', 'mudFlapType', 'panelBranding', 'skirted', 'skirtColor', 'cargoCamera', 'cartbars', 'tpms', 'trailerHeightDecal', 'absSensor', 'airTankMonitor', 'atisRegulator', 'lightOutSensor', 'sensorError', 'ultrasonicCargoSensor','conspicuityTape'];
  // Only include noseBranding and captiveBeam for Canada trailers
  if (isCanadaTrailers) {
    featureFields.push('noseBranding', 'captiveBeam');
  }
  featureFields.forEach(require);

  if (isCanadaTrailers) ['owner', 'conspicuityTape'].forEach(require);
  else {
    // US trailer specific fields
    ['assetId', 'conspicuityTapeInstallDate', 'cargoLockInstalledDate', 'estimatedDateOfAvailability', 'purchaseDate', 'pulsatingLampInstallationDate', 'pulsatingLampWiring', 'pulsatingLampModel', 'pulsatingLampManufacturer', 'purchaseType', 'purchaseCondition','tireSize', 'cargoLockFitted', 'cargoLockType'].forEach(require);
  }

  const status: 'pass' | 'fail' = missing.length ? 'fail' : 'pass';
  return { status, missing, missingKeys };
};

export const openDetailedResults = (formData: any): void => {
  const win = window.open('', '_blank');
  if (!win) return;

  const isCanadaTrailers = ((Cookies.get('selectedDepartment') || '').toLowerCase() === 'canada trailers');

  // Check both old and new field names for identification
  const identificationKeys = ['equipmentId', 'poNumber', 'vin', 'licensePlateId', 'licensePlateCountry', 'licensePlateExpiration', 'licensePlateStateOrProvince'];
  if (isCanadaTrailers) {
    identificationKeys.push('possessionOriginLocation', 'owner');
  } else {
    identificationKeys.push('assetId', 'estimatedDateOfAvailability', 'purchaseDate');
  }
  const featureKeys = ['aerokits', 'doorBranding', 'doorColor', 'doorSensor', 'doorType', 'lashSystem', 'mudFlapType', 'panelBranding', 'skirted', 'skirtColor', 'cargoCamera', 'cartbars', 'tpms', 'trailerHeightDecal'];
  if (isCanadaTrailers) {
    featureKeys.push('noseBranding', 'captiveBeam', 'conspicuityTape');
  } else {
    featureKeys.push('conspicuityTapeInstallDate', 'cargoLockInstalledDate');
  }

  const sections: Array<{ name: string; keys: string[]; customCheck?: (key: string) => boolean }> = [
    {
      name: 'Identification & Registration', keys: identificationKeys, customCheck: (key) => {
        if (key === 'equipmentId' || key === 'equipmentNumber') return !!(get(formData, 'equipmentId') || get(formData, 'equipmentNumber'));
        if (key === 'licensePlateStateOrProvince' || key === 'licensePlateState') return !!(get(formData, 'licensePlateStateOrProvince') || get(formData, 'licensePlateState'));
        return !!get(formData, key);
      }
    },
    { name: 'Physical Dimensions & Components', keys: ['length', 'height', 'grossAxleWeightRating', 'axleType', 'brakeType', 'suspensionType', 'tireModel', 'tireBrand'] },
    { name: 'Tire Location', keys: ['treadDepthLeftFrontOuter', 'treadDepthLeftFrontInner', 'treadDepthLeftRearOuter', 'treadDepthLeftRearInner', 'treadDepthRightFrontOuter', 'treadDepthRightFrontInner', 'treadDepthRightRearOuter', 'treadDepthRightRearInner'] },
    { name: 'Features & Appearance', keys: featureKeys },
    {
      name: 'Sensors & Electrical',
      keys: isCanadaTrailers
        ? ['absSensor', 'airTankMonitor', 'atisRegulator', 'lightOutSensor', 'sensorError', 'ultrasonicCargoSensor']
        : ['absSensor', 'airTankMonitor', 'atisRegulator', 'lightOutSensor', 'sensorError', 'ultrasonicCargoSensor', 'pulsatingLampInstallationDate', 'pulsatingLampManufacturer', 'pulsatingLampModel', 'pulsatingLampWiring']
    },
  ];

  const sectionResults = sections.map(s => {
    const missing = s.keys.filter(k => {
      if (s.customCheck) return !s.customCheck(k);
      return !get(formData, k);
    }).map(label);
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
