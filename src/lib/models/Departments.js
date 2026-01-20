import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { type } from 'os'

const DepartmentSchema = new mongoose.Schema({
  name: {
    type: String,
    unique: true,
    required: true
  },
  status: {
    type: String,
    default: "active",
    enum: ["active", "inactive"]
  }
}, {
  timestamps: true
})


export default mongoose.models.Department || mongoose.model('Department', DepartmentSchema)