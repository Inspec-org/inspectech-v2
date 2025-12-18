import mongoose from 'mongoose';

const ReviewSchema = new mongoose.Schema({
  unitId: { type: String, required: true, trim: true },
  inspectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Inspection' },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  reviewRequestedAt: { type: Date, required: true, default: () => new Date() },
  missingData: { type: String, enum: ['none', 'incomplete image file', 'incomplete checklist', 'incomplete dot form'], default: 'none' },
  reviewCompletedAt: { type: Date, default: null },
  emailNotification: { type: String, enum: ['yes', 'no', 'manually sent'], default: 'no' },
}, {
  timestamps: true,
});

ReviewSchema.index({ unitId: 1, vendorId: 1, departmentId: 1 }, { unique: true });

export default mongoose.models.Review || mongoose.model('Review', ReviewSchema);