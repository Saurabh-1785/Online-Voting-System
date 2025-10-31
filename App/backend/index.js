
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// Middleware
// ============================================
app.use(cors());
app.use(express.json({ limit: '10mb' })); // For base64 images

// ============================================
// MongoDB Connection
// ============================================
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/voting_system', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// ============================================
// Database Models
// ============================================

// User/Voter Model
const UserSchema = new mongoose.Schema({
  epicNumber: { type: String, required: true, unique: true, index: true },
  aadhaarHash: { type: String, required: true }, // Never store plain Aadhaar
  category: { type: String, enum: ['nri', 'armed-forces'], required: true },
  mobileEpic: { type: String, required: true },
  mobileAadhaar: { type: String, required: true },
  
  // Biometric data (encrypted)
  biometricBaseline: {
    embeddingHash: String, // Hash of face embedding
    capturedAt: Date,
    deviceInfo: String,
  },
  
  // Registration metadata
  registeredAt: { type: Date, default: Date.now },
  registeredIp: String,
  registeredLocation: {
    latitude: Number,
    longitude: Number,
    country: String,
  },
  
  // Security
  isBlocked: { type: Boolean, default: false },
  blockReason: String,
  failedAttempts: { type: Number, default: 0 },
  lastLoginAt: Date,
  
  // Status
  hasVoted: { type: Boolean, default: false },
  lastVoteAt: Date,
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);

// Anomaly Report Model
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

const AnomalyReport = mongoose.model('AnomalyReport', AnomalyReportSchema);

// Vote Record Model
const VoteSchema = new mongoose.Schema({
  encryptedVote: { type: String, required: true }, // Encrypted ballot
  trackingCode: { type: String, required: true, unique: true, index: true },
  voterHash: { type: String, required: true }, // Hash to prevent double voting
  constituency: String,
  electionId: String,
  castAt: { type: Date, default: Date.now },
  ipAddress: String,
  verified: { type: Boolean, default: false },
}, { timestamps: true });

const Vote = mongoose.model('Vote', VoteSchema);

// Session Model (for tracking liveness attempts)
const SessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sessionType: { type: String, enum: ['registration', 'voting'], required: true },
  attempts: { type: Number, default: 0 },
  lastAttemptAt: Date,
  lockedUntil: Date,
  ipAddress: String,
}, { timestamps: true });

const Session = mongoose.model('Session', SessionSchema);

// ============================================
// Middleware: Authentication
// ============================================
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// ============================================
// API Routes: Registration
// ============================================

// Step 1: Check eligibility
app.post('/api/auth/check-eligibility', async (req, res) => {
  try {
    const { epicNumber, category } = req.body;

    // Check if already registered
    const existingUser = await User.findOne({ epicNumber });
    if (existingUser) {
      return res.status(400).json({ 
        error: 'User already registered',
        code: 'ALREADY_REGISTERED' 
      });
    }

    // Check if blocked
    const anomaly = await AnomalyReport.findOne({ 
      epicNumber, 
      autoBlocked: true 
    });
    
    if (anomaly) {
      return res.status(403).json({ 
        error: 'Registration blocked due to security concerns',
        code: 'BLOCKED' 
      });
    }

    res.json({ 
      eligible: true,
      message: 'User eligible for registration' 
    });

  } catch (error) {
    console.error('Eligibility check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Step 2: Complete registration
app.post('/api/auth/register', async (req, res) => {
  try {
    const { 
      epicNumber, 
      aadhaar, 
      category, 
      mobileEpic, 
      mobileAadhaar,
      biometricData,
      ipAddress,
      location,
    } = req.body;

    // Hash sensitive data
    const aadhaarHash = await bcrypt.hash(aadhaar, 10);

    // Create user
    const user = new User({
      epicNumber,
      aadhaarHash,
      category,
      mobileEpic,
      mobileAadhaar,
      biometricBaseline: {
        embeddingHash: biometricData?.embeddingHash,
        capturedAt: new Date(),
        deviceInfo: req.headers['user-agent'],
      },
      registeredIp: ipAddress,
      registeredLocation: location,
    });

    await user.save();

    // Generate token
    const token = jwt.sign(
      { userId: user._id, epicNumber: user.epicNumber },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      registrationId: user._id,
      token,
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// ============================================
// API Routes: Login & Liveness
// ============================================

// Login Step 1: Send OTP
app.post('/api/auth/login', async (req, res) => {
  try {
    const { epicNumber } = req.body;

    const user = await User.findOne({ epicNumber });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ 
        error: 'Account blocked',
        reason: user.blockReason 
      });
    }

    // Generate OTPs (in production, send via SMS)
    const otp1 = Math.floor(100000 + Math.random() * 900000).toString();
    const otp2 = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTPs in session (use Redis in production)
    // For now, send back (DEMO ONLY - never do this in production!)
    res.json({
      success: true,
      message: 'OTPs sent',
      // DEMO ONLY:
      otp1Demo: otp1,
      otp2Demo: otp2,
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Verify baseline comparison
app.post('/api/auth/verify-liveness', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const { embeddingHash, similarity } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check session attempts
    let session = await Session.findOne({ 
      userId, 
      sessionType: 'voting' 
    });

    if (!session) {
      session = new Session({ userId, sessionType: 'voting' });
    }

    // Check if locked out
    if (session.lockedUntil && session.lockedUntil > new Date()) {
      return res.status(429).json({ 
        error: 'Too many attempts',
        lockedUntil: session.lockedUntil,
      });
    }

    // Verify similarity threshold
    if (similarity < 0.85) {
      session.attempts += 1;
      session.lastAttemptAt = new Date();

      // Lock after 3 attempts
      if (session.attempts >= 3) {
        session.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 min
      }

      await session.save();

      return res.status(401).json({ 
        error: 'Liveness verification failed',
        attemptsRemaining: Math.max(0, 3 - session.attempts),
      });
    }

    // Success - reset attempts
    session.attempts = 0;
    session.lastAttemptAt = new Date();
    await session.save();

    user.lastLoginAt = new Date();
    await user.save();

    res.json({ 
      success: true,
      message: 'Liveness verified',
    });

  } catch (error) {
    console.error('Liveness verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// ============================================
// API Routes: Security & Anomalies
// ============================================

// Report anomaly
app.post('/api/security/anomaly', async (req, res) => {
  try {
    const { 
      epicNumber,
      anomalyType,
      riskLevel,
      riskScore,
      indicators,
      recommendedAction,
      autoBlocked,
      ipAddress,
    } = req.body;

    // Find user
    const user = await User.findOne({ epicNumber });

    // Create anomaly report
    const report = new AnomalyReport({
      userId: user?._id,
      epicNumber,
      anomalyType,
      riskLevel,
      riskScore,
      indicators,
      recommendedAction,
      autoBlocked,
      ipAddress,
      userAgent: req.headers['user-agent'],
    });

    await report.save();

    // Auto-block if critical
    if (autoBlocked && user) {
      user.isBlocked = true;
      user.blockReason = `Automatic block: ${riskLevel} risk detected`;
      await user.save();
    }

    res.json({ 
      success: true,
      reportId: report._id,
      message: 'Anomaly reported',
    });

  } catch (error) {
    console.error('Anomaly report error:', error);
    res.status(500).json({ error: 'Failed to report anomaly' });
  }
});

// Check if user is blocked
app.get('/api/security/check-blocked/:epicNumber', async (req, res) => {
  try {
    const { epicNumber } = req.params;

    const user = await User.findOne({ epicNumber });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ 
      isBlocked: user.isBlocked,
      reason: user.blockReason,
    });

  } catch (error) {
    console.error('Block check error:', error);
    res.status(500).json({ error: 'Check failed' });
  }
});

// Get anomaly statistics
app.get('/api/security/stats', authenticateToken, async (req, res) => {
  try {
    const stats = await AnomalyReport.aggregate([
      {
        $group: {
          _id: '$riskLevel',
          count: { $sum: 1 },
        },
      },
    ]);

    const totalUsers = await User.countDocuments();
    const blockedUsers = await User.countDocuments({ isBlocked: true });
    const totalAnomalies = await AnomalyReport.countDocuments();

    res.json({
      totalUsers,
      blockedUsers,
      totalAnomalies,
      byRiskLevel: stats,
    });

  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// ============================================
// API Routes: Voting
// ============================================

// Cast vote
app.post('/api/vote/cast', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const { encryptedVote, constituency, electionId } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if already voted (last vote counts rule)
    const existingVote = await Vote.findOne({ 
      voterHash: await bcrypt.hash(userId.toString(), 10),
      electionId,
    });

    // Generate tracking code
    const trackingCode = generateTrackingCode();
    
    const vote = new Vote({
      encryptedVote,
      trackingCode,
      voterHash: await bcrypt.hash(userId.toString(), 10),
      constituency,
      electionId,
      ipAddress: req.ip,
    });

    await vote.save();

    // Update user
    user.hasVoted = true;
    user.lastVoteAt = new Date();
    await user.save();

    res.json({
      success: true,
      trackingCode,
      message: 'Vote cast successfully',
    });

  } catch (error) {
    console.error('Vote casting error:', error);
    res.status(500).json({ error: 'Failed to cast vote' });
  }
});

// Verify vote
app.get('/api/vote/verify/:trackingCode', async (req, res) => {
  try {
    const { trackingCode } = req.params;

    const vote = await Vote.findOne({ trackingCode });
    
    if (!vote) {
      return res.status(404).json({ 
        found: false,
        message: 'Vote not found' 
      });
    }

    res.json({
      found: true,
      castAt: vote.castAt,
      verified: vote.verified,
      constituency: vote.constituency,
    });

  } catch (error) {
    console.error('Vote verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// ============================================
// Utility Functions
// ============================================

function generateTrackingCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    if (i < 2) code += '-';
  }
  return code;
}

// ============================================
// Start Server
// ============================================

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}/api`);
});

module.exports = app;