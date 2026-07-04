const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  companyName: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
  },
  role: {
    type: String,
    required: [true, 'Role/position is required'],
    trim: true,
  },
  platform: {
    type: String,
    default: 'Direct/Other',
    trim: true,
  },
  appliedDate: {
    type: String, // Stored as YYYY-MM-DD
    required: [true, 'Applied date is required'],
  },
  interviewDate: {
    type: String, // Stored as YYYY-MM-DD (optional)
    default: null,
  },
  status: {
    type: String,
    required: true,
    enum: ['Applied', 'Shortlisted', 'Assessment', 'Interview Attended', 'Selected', 'Rejected'],
    default: 'Applied',
  },
  notes: {
    type: String,
    default: '',
  },
  notificationId: {
    type: String,
    default: null,
  },
  workMode: {
    type: String,
    enum: ['Work From Home', 'In-Office', 'Hybrid'],
    default: null,
  },
  stipendAmount: {
    type: Number,
    default: null,
  },
  workLocation: {
    type: String,
    default: '',
    trim: true,
  },
  duration: {
    type: String,
    default: '',
    trim: true,
  },
}, {
  timestamps: true, // Automates createdAt and updatedAt field management
});

module.exports = mongoose.model('Application', applicationSchema);

