// models/Grievance.js
import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  author: {
    type: String, // storing the student's email, matching what the frontend expects
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
}, { timestamps: true });

const grievanceSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
    enum: ['Academic', 'Hostel', 'Administration', 'Faculty', 'Infrastructure', 'Other'],
  },
  priority: {
    type: String,
    required: true,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium',
  },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Resolved'],
    default: 'Pending',
  },
   escalated: {
    type: Boolean,
    default: false,
  },
  escalatedAt: {
    type: Date,
  },
   publishToCommunity: {
    type: Boolean,
    default: false,
  },
   comments: [commentSchema],
}, { timestamps: true });

export default mongoose.model('Grievance', grievanceSchema);