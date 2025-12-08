import mongoose from 'mongoose'

const InspectionSchema = new mongoose.Schema({
  unitId: { type: String, required: true, trim: true },
  userId: {type:mongoose.Schema.Types.ObjectId, ref:'User', required: true},
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
  equipmentNumber: { type: String },
  vin: { type: String },
  licensePlateId: { type: String },
  licensePlateCountry: { type: String },
  licensePlateExpiration: { type: String },
  licensePlateState: { type: String },
  possessionOrigin: { type: String },
  manufacturer: { type: String },
  modelYear: { type: String },

  absSensor: { type: String },
  airTankMonitor: { type: String },
  rtbIndicator: { type: String },
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

  amenikis: { type: String },
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

  frontLeftSideUrl: { type: String },
  frontRightSideUrl: { type: String },
  rearLeftSideUrl: { type: String },
  rearRightSideUrl: { type: String },
  insideTrailerImageUrl: { type: String },
  doorDetailsImageUrl: { type: String },
  dotFormImageUrl: { type: String },
  dotFormPdfUrl: { type: String },
  additionalAttachment1: { type: String },
  additionalAttachment2: { type: String },
  additionalAttachment3: { type: String },
}, {
  timestamps: true,
})

InspectionSchema.index(
  { unitId: 1, departmentId: 1, userId: 1 },
  { unique: true }
);


export default mongoose.models.Inspection || mongoose.model('Inspection', InspectionSchema)