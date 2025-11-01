
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const Vote = require('../models/Vote');
const logger = require('../utils/logger');

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/voting_system');
    logger.info('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Vote.deleteMany({});
    logger.info('Cleared existing data');

    // Create test users
    const testUsers = [
      {
        epicNumber: 'ABC1234567',
        aadhaarHash: await bcrypt.hash('123456789012', 12),
        category: 'nri',
        mobileEpic: '+919876543210',
        mobileAadhaar: '+919876543210',
        biometricBaseline: {
          embeddingHash: 'test_hash_1',
          capturedAt: new Date(),
          deviceInfo: 'Test Device'
        },
        registeredIp: '1.2.3.4',
        registeredLocation: {
          latitude: 40.7128,
          longitude: -74.0060,
          country: 'USA'
        }
      },
      {
        epicNumber: 'XYZ9876543',
        aadhaarHash: await bcrypt.hash('987654321098', 12),
        category: 'armed-forces',
        mobileEpic: '+919123456789',
        mobileAadhaar: '+919123456789',
        biometricBaseline: {
          embeddingHash: 'test_hash_2',
          capturedAt: new Date(),
          deviceInfo: 'Test Device'
        },
        registeredIp: '5.6.7.8',
        hasVoted: true,
        lastVoteAt: new Date()
      }
    ];

    await User.insertMany(testUsers);
    logger.info(`Created ${testUsers.length} test users`);

    // Create test votes
    const testVotes = [
      {
        encryptedVote: 'encrypted_ballot_data_1',
        trackingCode: 'A7R-4GT-P9K',
        voterHash: 'voter_hash_1',
        constituency: 'Mumbai North',
        electionId: 'election_2025',
        ipAddress: '5.6.7.8',
        verified: true
      }
    ];

    await Vote.insertMany(testVotes);
    logger.info(`Created ${testVotes.length} test votes`);

    logger.info('✅ Database seeded successfully');
    process.exit(0);

  } catch (error) {
    logger.error('Seed error:', error);
    process.exit(1);
  }
}

seedDatabase();