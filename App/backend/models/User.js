// ========================================
// App/backend/models/User.js
// ========================================
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  epicNumber: { type: String, required: true, unique: true, index: true },
  aadhaarHash: { type: String, required: true },
  category: { type: String, enum: ['nri', 'armed-forces'], required: true },
  mobileEpic: { type: String, required: true },
  mobileAadhaar: { type: String, required: true },
  documentUrl: { type: String },
  
  biometricBaseline: {
    embeddingHash: String,
    capturedAt: Date,
    deviceInfo: String,
  },
  
  registeredAt: { type: Date, default: Date.now },
  registeredIp: String,
  registeredLocation: {
    latitude: Number,
    longitude: Number,
    country: String,
  },
  
  isBlocked: { type: Boolean, default: false },
  blockReason: String,
  failedAttempts: { type: Number, default: 0 },
  lastLoginAt: Date,
  
  hasVoted: { type: Boolean, default: false },
  lastVoteAt: Date,
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);