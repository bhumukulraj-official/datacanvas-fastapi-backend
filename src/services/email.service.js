const nodemailer = require('nodemailer');
const config = require('../config');

/**
 * Email service for sending various emails
 */
class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.secure,
      auth: {
        user: config.email.user,
        pass: config.email.password
      }
    });
  }

  /**
   * Send an email
   * @param {Object} options - Email options
   * @returns {Promise<Object>} Send result
   */
  async sendEmail(options) {
    try {
      const mailOptions = {
        from: `"${config.email.fromName}" <${config.email.fromEmail}>`,
        to: options.to,
        subject: options.subject,
        html: options.html
      };

      return await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Email sending error:', error);
      throw error;
    }
  }

  /**
   * Send password reset email
   * @param {string} email - Recipient email
   * @param {string} resetUrl - Password reset URL
   * @returns {Promise<Object>} Send result
   */
  async sendPasswordResetEmail(email, resetUrl) {
    const subject = `${config.app.name} - Password Reset`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>We received a request to reset your password. If you didn't make this request, you can ignore this email.</p>
        <p>To reset your password, click the button below:</p>
        <a href="${resetUrl}" style="display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin: 20px 0;">Reset Password</a>
        <p>Or copy and paste this link in your browser:</p>
        <p>${resetUrl}</p>
        <p>This link will expire in 24 hours.</p>
        <p>Best regards,<br>${config.app.name} Team</p>
      </div>
    `;

    return this.sendEmail({ to: email, subject, html });
  }
}

module.exports = new EmailService(); 