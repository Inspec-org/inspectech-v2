import mongoose from 'mongoose';

const VendorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  departmentAccess: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
    }
  ],
  status: {
    type: String,
    default: 'active',
    enum: ['active', 'inactive'],
  },
}, {
  timestamps: true,
});

export default mongoose.models.Vendor || mongoose.model('Vendor', VendorSchema);