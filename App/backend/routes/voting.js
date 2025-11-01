// App/backend/routes/voting.js
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');

const User = require('../models/User');
const Vote = require('../models/Vote');
const { authenticateToken } = require('../middleware/auth');
const emailService = require('../services/emailService');
const logger = require('../utils/logger');

// ============================================
// Cast Vote
// ============================================
router.post('/cast', authenticateToken, [
  body('encryptedVote').notEmpty().withMessage('Encrypted vote required'),
  body('constituency').notEmpty(),
  body('electionId').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId, epicNumber } = req.user;
    const { encryptedVote, constituency, electionId } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ 
        error: 'Account blocked',
        reason: user.blockReason 
      });
    }

    // Check for existing vote (last vote counts rule)
    const voterHashInput = `${userId.toString()}_${electionId}`;
    const voterHash = crypto.createHash('sha256').update(voterHashInput).digest('hex');

    const existingVote = await Vote.findOne({ 
      voterHash,
      electionId,
    });

    if (existingVote) {
      logger.info(`User ${epicNumber} is re-voting (last vote counts)`);
      // Delete previous vote
      await Vote.deleteOne({ _id: existingVote._id });
    }

    // Generate cryptographically secure tracking code
    const trackingCode = generateTrackingCode();
    
    const vote = new Vote({
      encryptedVote,
      trackingCode,
      voterHash,
      constituency,
      electionId,
      ipAddress: req.ip,
      verified: false,
    });

    await vote.save();

    // Update user voting status
    user.hasVoted = true;
    user.lastVoteAt = new Date();
    await user.save();

    // Send confirmation email (with tracking code only, NOT vote content)
    await emailService.sendVoteConfirmation(user.mobileEpic, {
      trackingCode,
      timestamp: new Date()
    });

    logger.info(`Vote cast successfully for user: ${epicNumber}, tracking: ${trackingCode}`);

    res.json({
      success: true,
      trackingCode,
      message: 'Vote cast successfully',
      castAt: vote.castAt
    });

  } catch (error) {
    logger.error('Vote casting error:', error);
    res.status(500).json({ error: 'Failed to cast vote' });
  }
});

// ============================================
// Verify Vote (Public Endpoint)
// ============================================
router.get('/verify/:trackingCode', async (req, res) => {
  try {
    const { trackingCode } = req.params;

    if (!trackingCode || trackingCode.length < 10) {
      return res.status(400).json({ error: 'Invalid tracking code' });
    }

    const vote = await Vote.findOne({ trackingCode });
    
    if (!vote) {
      logger.info(`Vote verification failed: tracking code not found - ${trackingCode}`);
      return res.status(404).json({ 
        found: false,
        message: 'Vote not found' 
      });
    }

    logger.info(`Vote verified: ${trackingCode}`);

    res.json({
      found: true,
      castAt: vote.castAt,
      verified: vote.verified,
      constituency: vote.constituency,
      // DO NOT return: voterHash, encryptedVote (privacy)
    });

  } catch (error) {
    logger.error('Vote verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// ============================================
// Get Vote Statistics (Public)
// ============================================
router.get('/statistics', async (req, res) => {
  try {
    const { electionId } = req.query;

    const filter = electionId ? { electionId } : {};

    const totalVotes = await Vote.countDocuments(filter);
    const verifiedVotes = await Vote.countDocuments({ ...filter, verified: true });

    const votesByConstituency = await Vote.aggregate([
      { $match: filter },
      { 
        $group: { 
          _id: '$constituency', 
          count: { $sum: 1 } 
        } 
      }
    ]);

    res.json({
      totalVotes,
      verifiedVotes,
      votesByConstituency,
      lastUpdated: new Date()
    });

  } catch (error) {
    logger.error('Statistics error:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

// ============================================
// Get User Voting Status (Authenticated)
// ============================================
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      hasVoted: user.hasVoted,
      lastVoteAt: user.lastVoteAt,
      canVote: !user.isBlocked
    });

  } catch (error) {
    logger.error('Status check error:', error);
    res.status(500).json({ error: 'Failed to get status' });
  }
});

// ============================================
// Utility: Generate Tracking Code
// ============================================
function generateTrackingCode() {
  // Generate cryptographically secure tracking code
  // Format: XXX-XXX-XXX (3 groups of 3 alphanumeric chars)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing chars
  const bytes = crypto.randomBytes(9);
  
  let code = '';
  for (let i = 0; i < 9; i++) {
    const index = bytes[i] % chars.length;
    code += chars[index];
    if ((i + 1) % 3 === 0 && i < 8) {
      code += '-';
    }
  }
  
  return code;
}

module.exports = router;