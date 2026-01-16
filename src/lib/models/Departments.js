import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { type } from 'os'

const DepartmentSchema = new mongoose.Schema({
  name: {
    type: String,
    unique: true,
    required: true
  },
}, {
  timestamps: true
})


export default mongoose.models.Department || mongoose.model('Department', DepartmentSchema)