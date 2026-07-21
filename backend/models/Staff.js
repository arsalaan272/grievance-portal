// models/Staff.js
import mongoose from 'mongoose';

const staffSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true, // no two staff can share an email
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
    enum: ['HOD', 'Lecturer', 'Warden'], // extend later if you add more roles
  },
  // The grievance category this staff member handles.
  // Not required for HOD, since HOD sees everything regardless of category.
  category: {
    type: String,
    enum: ['Academic', 'Hostel', 'Administration', 'Faculty', 'Infrastructure', 'Other'],
    required: function () {
      return this.role !== 'HOD';
    },
  },
  department: {
    type: String, // useful if you want to scope lecturers to a specific department later
  },
  resetPasswordToken: {
    type: String,
  },
  resetPasswordExpires: {
    type: Date,
  },
}, { timestamps: true });

export default mongoose.model('Staff', staffSchema);