// ========================================
// App/backend/services/aadhaarService.js
// ========================================
const axios = require('axios');
const crypto = require('crypto');
const logger = require('../utils/logger');

class AadhaarService {
  async verifyAadhaar(aadhaarNumber, mobileNumber) {
    try {
      // In mock mode, always return true
      if (process.env.AADHAAR_MOCK_MODE === 'true') {
        logger.info(`Aadhaar verification (MOCK MODE): ${this._maskAadhaar(aadhaarNumber)}`);
        return true;
      }

      // Production: Call UIDAI API
      if (process.env.UIDAI_API_URL && process.env.UIDAI_LICENSE_KEY) {
        return await this._verifyWithUIDAI(aadhaarNumber, mobileNumber);
      }

      logger.warn('Aadhaar verification not configured');
      return false;
    } catch (error) {
      logger.error('Aadhaar verification error:', error);
      return false;
    }
  }

  async _verifyWithUIDAI(aadhaarNumber, mobileNumber) {
    // This is a simplified example. Real UIDAI integration requires:
    // 1. eKYC license from UIDAI
    // 2. Digital signatures
    // 3. Encryption of requests/responses
    
    const response = await axios.post(
      `${process.env.UIDAI_API_URL}/ekyc`,
      {
        aadhaarNumber: this._encryptAadhaar(aadhaarNumber),
        mobileNumber
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.UIDAI_LICENSE_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.verified === true;
  }

  _maskAadhaar(aadhaar) {
    if (!aadhaar || aadhaar.length !== 12) return aadhaar;
    return 'XXXX-XXXX-' + aadhaar.slice(-4);
  }

  _encryptAadhaar(aadhaar) {
    // Simplified encryption. Real implementation needs UIDAI-specified encryption
    const cipher = crypto.createCipher('aes-256-cbc', process.env.UIDAI_CLIENT_SECRET);
    let encrypted = cipher.update(aadhaar, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }
}

module.exports = new AadhaarService();