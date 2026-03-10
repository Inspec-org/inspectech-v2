import mongoose from 'mongoose';

const InvitationSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  token: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
  },
  vendorAccess: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
    }
  ],
  departmentAccess: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
    }
  ],
  status: {
    type: String,
    default: "pending",
  },
  vendorName: {
    type: String,
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  expiresAt: {
    type: Date,
    default: () => Date.now() + 48 * 60 * 60 * 1000, // 48 hours
  },
}, {
  timestamps: true,
});

export default mongoose.models.Invitation || mongoose.model('Invitation', InvitationSchema);