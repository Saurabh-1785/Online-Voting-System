// App/backend/services/uploadService.js
// ========================================
const AWS = require('aws-sdk');
const cloudinary = require('cloudinary').v2;
const crypto = require('crypto');
const logger = require('../utils/logger');

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

class UploadService {
  async uploadDocument(epicNumber, base64Data) {
    try {
      if (process.env.STORAGE_PROVIDER === 's3') {
        return await this._uploadToS3(epicNumber, base64Data);
      } else if (process.env.STORAGE_PROVIDER === 'cloudinary') {
        return await this._uploadToCloudinary(epicNumber, base64Data);
      } else {
        logger.warn('No storage provider configured');
        return null;
      }
    } catch (error) {
      logger.error('Upload error:', error);
      throw error;
    }
  }

  async _uploadToS3(epicNumber, base64Data) {
    const buffer = Buffer.from(base64Data.split(',')[1], 'base64');
    const fileHash = crypto.randomBytes(16).toString('hex');
    const key = `documents/${epicNumber}/${fileHash}.pdf`;

    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentEncoding: 'base64',
      ContentType: 'application/pdf',
      ServerSideEncryption: 'AES256'
    };

    const result = await s3.upload(params).promise();
    logger.info(`Document uploaded to S3: ${result.Location}`);
    return result.Location;
  }

  async _uploadToCloudinary(epicNumber, base64Data) {
    const result = await cloudinary.uploader.upload(base64Data, {
      folder: `eci-voting/${epicNumber}`,
      resource_type: 'auto'
    });
    logger.info(`Document uploaded to Cloudinary: ${result.secure_url}`);
    return result.secure_url;
  }
}

module.exports = new UploadService();