// App/backend/routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

const User = require('../models/User');
const Session = require('../models/Session');
const otpService = require('../services/otpService');
const aadhaarService = require('../services/aadhaarService');
const uploadService = require('../services/uploadService');
const emailService = require('../services/emailService');
const logger = require('../utils/logger');
const { authenticateToken } = require('../middleware/auth');

// ============================================
// Step 1: Check Eligibility
// ============================================
router.post('/check-eligibility', [
  body('epicNumber').isLength({ min: 10, max: 10 }).withMessage('Invalid EPIC number'),
  body('category').isIn(['nri', 'armed-forces']).withMessage('Invalid category')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { epicNumber, category } = req.body;

    // Check if already registered
    const existingUser = await User.findOne({ epicNumber });
    if (existingUser) {
      logger.warn(`Registration attempt for existing user: ${epicNumber}`);
      return res.status(400).json({ 
        error: 'User already registered',
        code: 'ALREADY_REGISTERED' 
      });
    }

    // Check if blocked
    if (existingUser && existingUser.isBlocked) {
      return res.status(403).json({ 
        error: 'Registration blocked',
        reason: existingUser.blockReason,
        code: 'BLOCKED' 
      });
    }

    logger.info(`Eligibility check passed for EPIC: ${epicNumber}`);
    res.json({ 
      eligible: true,
      message: 'User eligible for registration' 
    });

  } catch (error) {
    logger.error('Eligibility check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// Step 2: Request OTP
// ============================================
router.post('/request-otp', [
  body('epicNumber').isLength({ min: 10, max: 10 }),
  body('aadhaar').isLength({ min: 12, max: 12 }),
  body('mobileEpic').matches(/^\+91[0-9]{10}$/),
  body('mobileAadhaar').matches(/^\+91[0-9]{10}$/)
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { epicNumber, aadhaar, mobileEpic, mobileAadhaar } = req.body;

    // Verify Aadhaar (mock or real UIDAI API)
    const aadhaarValid = await aadhaarService.verifyAadhaar(aadhaar, mobileAadhaar);
    if (!aadhaarValid) {
      return res.status(400).json({ 
        error: 'Aadhaar verification failed',
        code: 'INVALID_AADHAAR' 
      });
    }

    // Generate OTPs
    const otp1 = await otpService.generateOTP(epicNumber, 'epic', mobileEpic);
    const otp2 = await otpService.generateOTP(epicNumber, 'aadhaar', mobileAadhaar);

    // Send OTPs via SMS
    await otpService.sendOTP(mobileEpic, otp1);
    await otpService.sendOTP(mobileAadhaar, otp2);

    logger.info(`OTPs sent for registration: ${epicNumber}`);

    // In development, return OTPs for testing
    const response = { 
      success: true,
      message: 'OTPs sent successfully',
      expiresIn: 150 // seconds
    };

    if (process.env.NODE_ENV === 'development') {
      response.otp1Demo = otp1;
      response.otp2Demo = otp2;
    }

    res.json(response);

  } catch (error) {
    logger.error('OTP request error:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// ============================================
// Step 3: Verify OTP and Upload Documents
// ============================================
router.post('/verify-otp', [
  body('epicNumber').isLength({ min: 10, max: 10 }),
  body('otp1').isLength({ min: 6, max: 6 }),
  body('otp2').isLength({ min: 6, max: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { epicNumber, otp1, otp2 } = req.body;

    // Verify both OTPs
    const otp1Valid = await otpService.verifyOTP(epicNumber, 'epic', otp1);
    const otp2Valid = await otpService.verifyOTP(epicNumber, 'aadhaar', otp2);

    if (!otp1Valid || !otp2Valid) {
      logger.warn(`OTP verification failed for: ${epicNumber}`);
      return res.status(400).json({ 
        error: 'Invalid OTP',
        code: 'INVALID_OTP' 
      });
    }

    // Clear OTPs after successful verification
    await otpService.clearOTP(epicNumber, 'epic');
    await otpService.clearOTP(epicNumber, 'aadhaar');

    logger.info(`OTP verified for: ${epicNumber}`);
    res.json({ 
      success: true,
      message: 'OTP verified successfully' 
    });

  } catch (error) {
    logger.error('OTP verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// ============================================
// Step 4: Complete Registration
// ============================================
router.post('/register', [
  body('epicNumber').isLength({ min: 10, max: 10 }),
  body('aadhaar').isLength({ min: 12, max: 12 }),
  body('category').isIn(['nri', 'armed-forces']),
  body('mobileEpic').matches(/^\+91[0-9]{10}$/),
  body('mobileAadhaar').matches(/^\+91[0-9]{10}$/)
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      epicNumber, 
      aadhaar, 
      category, 
      mobileEpic, 
      mobileAadhaar,
      biometricData,
      documentBase64,
      ipAddress,
      location
    } = req.body;

    // Upload document to S3/Cloudinary
    let documentUrl = null;
    if (documentBase64) {
      documentUrl = await uploadService.uploadDocument(epicNumber, documentBase64);
    }

    // Hash sensitive data
    const aadhaarHash = await bcrypt.hash(aadhaar, 12);

    // Create user
    const user = new User({
      epicNumber,
      aadhaarHash,
      category,
      mobileEpic,
      mobileAadhaar,
      documentUrl,
      biometricBaseline: {
        embeddingHash: biometricData?.embeddingHash,
        capturedAt: new Date(),
        deviceInfo: req.headers['user-agent'],
      },
      registeredIp: ipAddress || req.ip,
      registeredLocation: location,
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, epicNumber: user.epicNumber },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Send confirmation email
    await emailService.sendRegistrationConfirmation(mobileEpic, {
      registrationId: user._id,
      epicNumber: user.epicNumber
    });

    logger.info(`Registration successful: ${epicNumber}`);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      registrationId: user._id,
      token,
    });

  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// ============================================
// Login: Send OTP
// ============================================
router.post('/login', [
  body('epicNumber').isLength({ min: 10, max: 10 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

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

    // Generate and send OTPs
    const otp1 = await otpService.generateOTP(epicNumber, 'epic', user.mobileEpic);
    const otp2 = await otpService.generateOTP(epicNumber, 'aadhaar', user.mobileAadhaar);

    await otpService.sendOTP(user.mobileEpic, otp1);
    await otpService.sendOTP(user.mobileAadhaar, otp2);

    logger.info(`Login OTPs sent for: ${epicNumber}`);

    const response = {
      success: true,
      message: 'OTPs sent',
      expiresIn: 150
    };

    if (process.env.NODE_ENV === 'development') {
      response.otp1Demo = otp1;
      response.otp2Demo = otp2;
    }

    res.json(response);

  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ============================================
// Verify Login OTP
// ============================================
router.post('/verify-login-otp', [
  body('epicNumber').isLength({ min: 10, max: 10 }),
  body('otp1').isLength({ min: 6, max: 6 }),
  body('otp2').isLength({ min: 6, max: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { epicNumber, otp1, otp2 } = req.body;

    const otp1Valid = await otpService.verifyOTP(epicNumber, 'epic', otp1);
    const otp2Valid = await otpService.verifyOTP(epicNumber, 'aadhaar', otp2);

    if (!otp1Valid || !otp2Valid) {
      return res.status(400).json({ 
        error: 'Invalid OTP',
        code: 'INVALID_OTP' 
      });
    }

    const user = await User.findOne({ epicNumber });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id, epicNumber: user.epicNumber },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Clear OTPs
    await otpService.clearOTP(epicNumber, 'epic');
    await otpService.clearOTP(epicNumber, 'aadhaar');

    logger.info(`Login successful: ${epicNumber}`);

    res.json({
      success: true,
      token,
      user: {
        epicNumber: user.epicNumber,
        category: user.category
      }
    });

  } catch (error) {
    logger.error('Login verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// ============================================
// Verify Liveness (with baseline comparison)
// ============================================
router.post('/verify-liveness', authenticateToken, [
  body('embeddingHash').notEmpty(),
  body('similarity').isFloat({ min: 0, max: 1 })
], async (req, res) => {
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

    // Verify similarity threshold (85%)
    const THRESHOLD = 0.85;
    if (similarity < THRESHOLD) {
      session.attempts += 1;
      session.lastAttemptAt = new Date();

      // Lock after 3 attempts
      if (session.attempts >= 3) {
        session.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 min
      }

      await session.save();

      logger.warn(`Liveness verification failed for user: ${userId}`);

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

    logger.info(`Liveness verified for user: ${userId}`);

    res.json({ 
      success: true,
      message: 'Liveness verified',
    });

  } catch (error) {
    logger.error('Liveness verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

module.exports = router;