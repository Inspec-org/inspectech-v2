import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { type } from 'os'

const UserSchema = new mongoose.Schema({
  // username: {
  //   type: String,
  //   required: [true, 'Please provide a username'],
  //   unique: true,
  //   trim: true,
  // },
  firstName: {
    type: String,
    trim: true,
  },
  lastName: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    minlength: [6, 'Password must be at least 6 characters'],
    select: false, // Don't include password in queries by default
  },
  resetPasswordOTP: {
    type: String,
    select: false // Don't include OTP in queries by default
  },
  resetPasswordExpires: {
    type: Date,
    select: false
  },
  resetPasswordToken: {
    type: String,
    select: false
  },
  resetPasswordTokenExpires: {
    type: Date,
    select: false
  },
  // Email verification OTP
  verificationOTP: {
    type: String,
    select: false
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'superadmin'],
    default: 'user',
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
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
  verificationOTPExpires: {
    type: Date,
    select: false
  },
  avatar: {
    type: String,

  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  deletedAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
})

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()

  try {
    const salt = await bcrypt.genSalt(12)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

// Compare password method
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password)
}

UserSchema.pre('save', function (next) {
  if (this.role === 'user' && !this.vendorId) {
    return next(new Error('vendorId is required for user role'));
  }
  if (this.departmentAccess && this.departmentAccess.length > 0 && this.role !== 'admin') {
    return next(new Error('departmentAccess is allowed for admin role only'));
  }
  next();
})

export default mongoose.models.User || mongoose.model('User', UserSchema)