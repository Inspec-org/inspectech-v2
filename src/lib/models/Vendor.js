import mongoose from 'mongoose';

const VendorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
}, {
  timestamps: true,
});

export default mongoose.models.Vendor || mongoose.model('Vendor', VendorSchema);