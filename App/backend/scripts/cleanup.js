// ========================================
// App/backend/scripts/cleanup.js
// ========================================
const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Vote = require('../models/Vote');
const Session = require('../models/Session');
const AnomalyReport = require('../models/AnomalyReport');
const logger = require('../utils/logger');

async function cleanup() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/voting_system');
    logger.info('Connected to MongoDB');

    // Delete all test data
    await User.deleteMany({});
    await Vote.deleteMany({});
    await Session.deleteMany({});
    await AnomalyReport.deleteMany({});

    logger.info('✅ All data cleaned up');
    process.exit(0);

  } catch (error) {
    logger.error('Cleanup error:', error);
    process.exit(1);
  }
}

cleanup();