// ========================================
// App/backend/routes/security.js
// ========================================
const express = require('express');
const router = express.Router();
const AnomalyReport = require('../models/AnomalyReport');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');

router.post('/anomaly', async (req, res) => {
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

    const user = await User.findOne({ epicNumber });

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

    if (autoBlocked && user) {
      user.isBlocked = true;
      user.blockReason = `Automatic block: ${riskLevel} risk detected`;
      await user.save();
      logger.warn(`User auto-blocked: ${epicNumber}`);
    }

    res.json({ 
      success: true,
      reportId: report._id,
      message: 'Anomaly reported',
    });

  } catch (error) {
    logger.error('Anomaly report error:', error);
    res.status(500).json({ error: 'Failed to report anomaly' });
  }
});

router.get('/check-blocked/:epicNumber', async (req, res) => {
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
    logger.error('Block check error:', error);
    res.status(500).json({ error: 'Check failed' });
  }
});

router.get('/stats', authenticateToken, async (req, res) => {
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
    logger.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

module.exports = router;