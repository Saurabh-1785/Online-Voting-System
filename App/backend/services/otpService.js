// App/backend/services/otpService.js
const crypto = require('crypto');
const Redis = require('ioredis');
const twilio = require('twilio');
const logger = require('../utils/logger');

// Initialize Redis client
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});

redis.on('error', (err) => logger.error('Redis error:', err));
redis.on('connect', () => logger.info('✅ Redis connected'));

// Initialize Twilio client
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

// OTP Configuration
const OTP_LENGTH = 6;
const OTP_EXPIRY = 150; // seconds (2.5 minutes)
const MAX_ATTEMPTS = 3;
const RATE_LIMIT_WINDOW = 3600; // 1 hour
const MAX_OTP_PER_HOUR = 5;

class OTPService {
  
  /**
   * Generate OTP and store in Redis
   */
  async generateOTP(identifier, type, mobileNumber) {
    try {
      // Check rate limiting
      const rateLimitKey = `otp:ratelimit:${identifier}`;
      const requestCount = await redis.incr(rateLimitKey);
      
      if (requestCount === 1) {
        await redis.expire(rateLimitKey, RATE_LIMIT_WINDOW);
      }
      
      if (requestCount > MAX_OTP_PER_HOUR) {
        throw new Error('OTP request limit exceeded. Please try again later.');
      }

      // Generate cryptographically secure OTP
      const otp = this._generateSecureOTP();
      
      // Create OTP key
      const otpKey = `otp:${identifier}:${type}`;
      
      // Hash OTP before storing (security best practice)
      const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
      
      // Store in Redis with metadata
      const otpData = {
        hash: otpHash,
        mobile: this._maskMobile(mobileNumber),
        attempts: 0,
        createdAt: Date.now()
      };
      
      await redis.setex(otpKey, OTP_EXPIRY, JSON.stringify(otpData));
      
      logger.info(`OTP generated for ${identifier} (${type})`);
      
      return otp;
      
    } catch (error) {
      logger.error('OTP generation error:', error);
      throw error;
    }
  }

  /**
   * Verify OTP
   */
  async verifyOTP(identifier, type, otp) {
    try {
      const otpKey = `otp:${identifier}:${type}`;
      const otpDataStr = await redis.get(otpKey);
      
      if (!otpDataStr) {
        logger.warn(`OTP expired or not found: ${identifier} (${type})`);
        return false;
      }
      
      const otpData = JSON.parse(otpDataStr);
      
      // Check max attempts
      if (otpData.attempts >= MAX_ATTEMPTS) {
        logger.warn(`Max OTP attempts exceeded: ${identifier} (${type})`);
        await redis.del(otpKey);
        return false;
      }
      
      // Hash submitted OTP and compare
      const submittedHash = crypto.createHash('sha256').update(otp).digest('hex');
      
      if (submittedHash === otpData.hash) {
        logger.info(`OTP verified successfully: ${identifier} (${type})`);
        return true;
      } else {
        // Increment attempt counter
        otpData.attempts += 1;
        const ttl = await redis.ttl(otpKey);
        await redis.setex(otpKey, ttl, JSON.stringify(otpData));
        
        logger.warn(`Invalid OTP attempt: ${identifier} (${type}), attempts: ${otpData.attempts}`);
        return false;
      }
      
    } catch (error) {
      logger.error('OTP verification error:', error);
      return false;
    }
  }

  /**
   * Send OTP via SMS (Twilio or MSG91)
   */
  async sendOTP(mobileNumber, otp) {
    try {
      // In development, just log the OTP
      if (process.env.NODE_ENV === 'development') {
        logger.info(`📱 [DEV] OTP for ${mobileNumber}: ${otp}`);
        return true;
      }

      // Production: Send via Twilio
      if (twilioClient && process.env.TWILIO_PHONE_NUMBER) {
        const message = await twilioClient.messages.create({
          body: `Your ECI Secure Vote OTP is: ${otp}. Valid for ${OTP_EXPIRY / 60} minutes. DO NOT share this code.`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: mobileNumber
        });
        
        logger.info(`SMS sent via Twilio: ${message.sid}`);
        return true;
      }

      // Alternative: MSG91 integration
      if (process.env.MSG91_AUTH_KEY) {
        await this._sendViaMSG91(mobileNumber, otp);
        return true;
      }

      // Fallback: Log warning
      logger.warn('No SMS provider configured. OTP not sent.');
      return false;
      
    } catch (error) {
      logger.error('OTP sending error:', error);
      throw error;
    }
  }

  /**
   * Clear OTP from Redis
   */
  async clearOTP(identifier, type) {
    try {
      const otpKey = `otp:${identifier}:${type}`;
      await redis.del(otpKey);
      logger.info(`OTP cleared: ${identifier} (${type})`);
    } catch (error) {
      logger.error('OTP clear error:', error);
    }
  }

  /**
   * Check remaining attempts
   */
  async getRemainingAttempts(identifier, type) {
    try {
      const otpKey = `otp:${identifier}:${type}`;
      const otpDataStr = await redis.get(otpKey);
      
      if (!otpDataStr) return 0;
      
      const otpData = JSON.parse(otpDataStr);
      return MAX_ATTEMPTS - otpData.attempts;
      
    } catch (error) {
      logger.error('Get remaining attempts error:', error);
      return 0;
    }
  }

  /**
   * Private: Generate secure OTP
   */
  _generateSecureOTP() {
    const digits = '0123456789';
    const bytes = crypto.randomBytes(OTP_LENGTH);
    let otp = '';
    
    for (let i = 0; i < OTP_LENGTH; i++) {
      otp += digits[bytes[i] % digits.length];
    }
    
    return otp;
  }

  /**
   * Private: Mask mobile number for logging
   */
  _maskMobile(mobile) {
    if (!mobile || mobile.length < 4) return mobile;
    return mobile.slice(0, -4).replace(/./g, '*') + mobile.slice(-4);
  }

  /**
   * Private: Send OTP via MSG91
   */
  async _sendViaMSG91(mobileNumber, otp) {
    const axios = require('axios');
    
    const payload = {
      authkey: process.env.MSG91_AUTH_KEY,
      mobiles: mobileNumber.replace('+91', ''),
      message: `Your ECI Secure Vote OTP is ${otp}. Valid for ${OTP_EXPIRY / 60} minutes.`,
      sender: process.env.MSG91_SENDER_ID || 'ECIVOT',
      route: '4',
      country: '91'
    };

    const response = await axios.post('https://api.msg91.com/api/sendhttp.php', null, {
      params: payload
    });

    logger.info(`SMS sent via MSG91: ${response.data}`);
  }

  /**
   * Resend OTP (with rate limiting)
   */
  async resendOTP(identifier, type, mobileNumber) {
    // Clear existing OTP
    await this.clearOTP(identifier, type);
    
    // Generate new OTP
    const otp = await this.generateOTP(identifier, type, mobileNumber);
    
    // Send via SMS
    await this.sendOTP(mobileNumber, otp);
    
    return otp;
  }
}

module.exports = new OTPService();