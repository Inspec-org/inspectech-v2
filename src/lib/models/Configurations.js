import mongoose from 'mongoose';

const SendTimeSchema = new mongoose.Schema({
  hour: { type: String, required: true },
  minute: { type: String, required: true },
  period: { type: String, enum: ['AM', 'PM'], required: true },
}, { _id: false });

const ConfigurationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  isAutoEnabled: { type: Boolean, default: false },
  frequency: { type: String, enum: ['Daily', 'Weekly', 'Monthly'], default: 'Daily' },
  timesPerDay: { type: String, enum: ['Once per day', 'Twice per day'], default: 'Twice per day' },
  times: { type: [SendTimeSchema], default: [] },
  recipients: { type: [String], default: [] },
  vendors: { type: [String], default: [] },
  statuses: { type: [String], default: [] },
}, { timestamps: true });

ConfigurationSchema.index({ userId: 1, name: 1 }, { unique: true });

export default mongoose.models.Configuration || mongoose.model('Configuration', ConfigurationSchema);