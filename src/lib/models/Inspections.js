import mongoose from 'mongoose'

const InspectionSchema = new mongoose.Schema({
  unitId: { type: String, required: true, trim: true },
  // userId: {type:mongoose.Schema.Types.ObjectId, ref:'User', required: true},
  vendorId: {type:mongoose.Schema.Types.ObjectId, ref:'Vendor', required: true},
  departmentId: {type:mongoose.Schema.Types.ObjectId, ref:'Department', required: true},
  inspectionStatus: { type: String, default: 'incomplete' },
  reviewReason: { type: String, default: null },
  type: { type: String },
  inspector: { type: String },
  location: { type: String },
  delivered: { type: String, enum: ['yes', 'no'], default: 'no' },
  durationMin: { type: String },
  durationSec: { type: String },
  dateDay: { type: String },
  dateMonth: { type: String },
  dateYear: { type: String },
  notes: { type: String },

  poNumber: { type: String },
  owner: { type: String },
  assetTagId: { type: String },
  equipmentNumber: { type: String },
  vin: { type: String },
  licensePlateId: { type: String },
  licensePlateCountry: { type: String },
  licensePlateExpiration: { type: String },
  licensePlateState: { type: String },
  possessionOrigin: { type: String },
  possessionStart: { type: String },
  possessionEnd: { type: String },
  manufacturer: { type: String },
  modelYear: { type: String },
  manufacturerAssetId: { type: String },
  operator: { type: String },
  program: { type: String },

  cargoLockFitted: { type: String },
  cargoLockInstalledDate: { type: String },
  cargoLockType: { type: String },
  conspicuityTapeInstallDate: { type: String },
  estimatedDateOfAvailability: { type: String },
  healthScore: { type: String },
  invoiceNumber: { type: String },
  lifecycleState: { type: String },
  lifecycleStateReason: { type: String },
  pulsatingLampManufacturer: { type: String },
  pulsatingLampModel: { type: String },
  pulsatingLampWiring: { type: String },
  purchaseCondition: { type: String },
  purchaseDate: { type: String },
  purchaseType: { type: String },
  tireSize: { type: String },
  warrantyBatchId: { type: String },

  absSensor: { type: String },
  airTankMonitor: { type: String },
  atisregulator: { type: String },
  lightOutSensor: { type: String },
  sensorError: { type: String },
  ultrasonicCargoSensor: { type: String },

  length: { type: String },
  height: { type: String },
  grossAxleWeightRating: { type: String },
  axleType: { type: String },
  brakeType: { type: String },
  suspensionType: { type: String },
  tireModel: { type: String },
  tireBrand: { type: String },
  leftFrontOuter: { type: String },
  leftFrontInner: { type: String },
  leftRearOuter: { type: String },
  leftRearInner: { type: String },
  rightFrontOuter: { type: String },
  rightFrontInner: { type: String },
  rightRearOuter: { type: String },
  rightRearInner: { type: String },

  aerokits: { type: String },
  doorBranding: { type: String },
  doorColor: { type: String },
  doorSensor: { type: String },
  doorType: { type: String },
  lashSystem: { type: String },
  mudFlapType: { type: String },
  panelBranding: { type: String },
  noseBranding: { type: String },
  skirted: { type: String },
  skirtColor: { type: String },
  captiveBeam: { type: String },
  cargoCameras: { type: String },
  cartbars: { type: String },
  tpms: { type: String },
  trailerHeightDecal: { type: String },
  conspicuityTape: { type: String },

  frontLeftSideUrl: { type: String },
  frontRightSideUrl: { type: String },
  rearLeftSideUrl: { type: String },
  rearRightSideUrl: { type: String },
  insideTrailerImageUrl: { type: String },
  doorDetailsImageUrl: { type: String },
  dotFormImageUrl: { type: String },
  dotFormPdfUrl: { type: String },
  dotFormPdfFileName: { type: String },
  additionalAttachment1: { type: String },
  additionalAttachment2: { type: String },
  additionalAttachment3: { type: String },
}, {
  timestamps: true,
})

InspectionSchema.index({ unitId: 1 }, { unique: true });

InspectionSchema.index(
  { vendorId: 1, equipmentNumber: 1 },
  { unique: true, partialFilterExpression: { equipmentNumber: { $exists: true, $type: 'string', $nin: ['N/A', ''] } } }
);

InspectionSchema.index(
  { vendorId: 1, vin: 1 },
  { unique: true, partialFilterExpression: { vin: { $exists: true, $type: 'string', $nin: ['N/A', ''] } } }
);

InspectionSchema.index({ departmentId: 1, vendorId: 1, createdAt: -1 });
InspectionSchema.index({ departmentId: 1, vendorId: 1 });
InspectionSchema.index({ inspectionStatus: 1 });
InspectionSchema.index({ inspector: 1 });
InspectionSchema.index({ type: 1 });
InspectionSchema.index({ location: 1 });
InspectionSchema.index({ delivered: 1 });
InspectionSchema.index({ dateYear: 1, dateMonth: 1, dateDay: 1 });

export default mongoose.models.Inspection || mongoose.model('Inspection', InspectionSchema)
