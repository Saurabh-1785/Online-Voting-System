
const mongoose = require('mongoose');

const AnomalyReportSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  epicNumber: String,
  anomalyType: { 
    type: String, 
    enum: ['registration', 'voting', 'behavioral'],
    required: true 
  },
  riskLevel: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'critical'],
    required: true 
  },
  riskScore: { type: Number, required: true },
  indicators: [{
    type: String,
    confidence: Number,
    evidence: String,
  }],
  recommendedAction: {
    type: String,
    enum: ['allow', 'flag', 'block', 'manual_review'],
    required: true,
  },
  autoBlocked: { type: Boolean, default: false },
  reviewStatus: {
    type: String,
    enum: ['pending', 'reviewed', 'resolved'],
    default: 'pending',
  },
  reviewedBy: String,
  reviewedAt: Date,
  ipAddress: String,
  userAgent: String,
  metadata: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

module.exports = mongoose.model('AnomalyReport', AnomalyReportSchema);