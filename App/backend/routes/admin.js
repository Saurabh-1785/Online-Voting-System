// ========================================
// App/backend/routes/admin.js
// ========================================
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Vote = require('../models/Vote');
const AnomalyReport = require('../models/AnomalyReport');
const { authenticateAdmin } = require('../middleware/auth');
const logger = require('../utils/logger');

router.get('/stats', authenticateAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalVotes = await Vote.countDocuments();
    const blockedUsers = await User.countDocuments({ isBlocked: true });
    const anomalyReports = await AnomalyReport.countDocuments();
    const pendingReviews = await AnomalyReport.countDocuments({ 
      reviewStatus: 'pending' 
    });

    res.json({
      totalUsers,
      totalVotes,
      blockedUsers,
      anomalyReports,
      pendingReviews,
      timestamp: new Date()
    });

  } catch (error) {
    logger.error('Admin stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

router.get('/anomalies', authenticateAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, riskLevel, reviewStatus } = req.query;
    
    const filter = {};
    if (riskLevel) filter.riskLevel = riskLevel;
    if (reviewStatus) filter.reviewStatus = reviewStatus;

    const anomalies = await AnomalyReport.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('userId', 'epicNumber category');

    const total = await AnomalyReport.countDocuments(filter);

    res.json({
      anomalies,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });

  } catch (error) {
    logger.error('Get anomalies error:', error);
    res.status(500).json({ error: 'Failed to get anomalies' });
  }
});

router.post('/block-user', authenticateAdmin, async (req, res) => {
  try {
    const { epicNumber, reason } = req.body;

    const user = await User.findOne({ epicNumber });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.isBlocked = true;
    user.blockReason = reason;
    await user.save();

    logger.info(`User blocked by admin: ${epicNumber}`);

    res.json({ success: true, message: 'User blocked' });

  } catch (error) {
    logger.error('Block user error:', error);
    res.status(500).json({ error: 'Failed to block user' });
  }
});

router.post('/unblock-user', authenticateAdmin, async (req, res) => {
  try {
    const { epicNumber } = req.body;

    const user = await User.findOne({ epicNumber });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.isBlocked = false;
    user.blockReason = null;
    await user.save();

    logger.info(`User unblocked by admin: ${epicNumber}`);

    res.json({ success: true, message: 'User unblocked' });

  } catch (error) {
    logger.error('Unblock user error:', error);
    res.status(500).json({ error: 'Failed to unblock user' });
  }
});

module.exports = router;