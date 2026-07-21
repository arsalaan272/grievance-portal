// 
import mongoose from 'mongoose'

const studentSchema = new mongoose.Schema({
  nameAadhar: {
    type: String,
    required: true,
  },
  rollNo: {
    type: String,
    required: true,
    unique: true, // no two students can have the same roll number
  },
  email: {
    type: String,
    required: true,
    unique: true, // no two students can share an email
  },
  college: {
    type: String,
    required: true,
  },
  department: {
    type: String,
    required: true,
  },
  course: {
    type: String,
    required: true,
  },
  yearOfStudy: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  resetPasswordToken: {
    type: String,
  },
  resetPasswordExpires: {
    type: Date,
  },
}, { timestamps: true }); // adds createdAt and updatedAt automatically



export default mongoose.model('Student', studentSchema);