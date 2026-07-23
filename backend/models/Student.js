// 
import mongoose from 'mongoose'

const SECURITY_QUESTIONS = [
  "What is your favorite teacher's name?",
  "What is your favorite book?",
  "What is the name of your best friend in school?",
  "What is your favorite subject?",
  "What is your pet's name?",
];

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
  dateOfBirth: {
    type: Date,
    required: true,
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
  securityQuestion: {
    type: String,
    required: true,
    enum: SECURITY_QUESTIONS,
  },
  securityAnswerHash: {
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


export { SECURITY_QUESTIONS };
export default mongoose.model('Student', studentSchema);