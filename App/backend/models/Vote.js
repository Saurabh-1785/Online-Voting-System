// ========================================
// App/backend/models/Vote.js
// ========================================
const mongoose = require('mongoose');

const VoteSchema = new mongoose.Schema({
  encryptedVote: { type: String, required: true },
  trackingCode: { type: String, required: true, unique: true, index: true },
  voterHash: { type: String, required: true, index: true },
  constituency: String,
  electionId: String,
  castAt: { type: Date, default: Date.now },
  ipAddress: String,
  verified: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Vote', VoteSchema);

// ========================================
// App/backend/models/Session.js
// ========================================
const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sessionType: { type: String, enum: ['registration', 'voting'], required: true },
  attempts: { type: Number, default: 0 },
  lastAttemptAt: Date,
  lockedUntil: Date,
  ipAddress: String,
}, { timestamps: true });

module.exports = mongoose.model('Session', SessionSchema);