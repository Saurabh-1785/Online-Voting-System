// App/backend/services/emailService.js
// ========================================
const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');
const logger = require('../utils/logger');

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Initialize SMTP transporter
const smtpTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

class EmailService {
  async sendRegistrationConfirmation(email, data) {
    const { registrationId, epicNumber } = data;
    
    const subject = 'Registration Successful - ECI Secure Vote';
    const html = `
      <h2>Registration Successful!</h2>
      <p>Your registration for online voting has been completed.</p>
      <p><strong>Registration ID:</strong> ${registrationId}</p>
      <p><strong>EPIC Number:</strong> ${epicNumber}</p>
      <p>You will receive an SMS notification when voting opens.</p>
    `;

    return this._sendEmail(email, subject, html);
  }

  async sendVoteConfirmation(email, data) {
    const { trackingCode, timestamp } = data;
    
    const subject = 'Vote Cast Successfully - ECI Secure Vote';
    const html = `
      <h2>Vote Cast Successfully!</h2>
      <p>Your vote has been securely recorded.</p>
      <p><strong>Tracking Code:</strong> ${trackingCode}</p>
      <p><strong>Time:</strong> ${timestamp}</p>
      <p>Save this tracking code to verify your vote was counted.</p>
    `;

    return this._sendEmail(email, subject, html);
  }

  async _sendEmail(to, subject, html) {
    if (process.env.NODE_ENV === 'development') {
      logger.info(`📧 [DEV] Email to ${to}: ${subject}`);
      return true;
    }

    try {
      if (process.env.EMAIL_PROVIDER === 'sendgrid' && process.env.SENDGRID_API_KEY) {
        await sgMail.send({
          to,
          from: process.env.SENDGRID_FROM_EMAIL,
          subject,
          html
        });
        logger.info(`Email sent via SendGrid to ${to}`);
      } else if (process.env.EMAIL_PROVIDER === 'smtp') {
        await smtpTransporter.sendMail({
          from: process.env.SMTP_FROM,
          to,
          subject,
          html
        });
        logger.info(`Email sent via SMTP to ${to}`);
      }
      return true;
    } catch (error) {
      logger.error('Email sending error:', error);
      return false;
    }
  }
}

module.exports = new EmailService();
