const { ProfessionalAccount, AuthenticationToken, PasswordRecoveryRequest } = require('../db/models').models;
const { Op } = require('sequelize');
const { 
  hashPassword, 
  verifyPassword, 
  generateAccessToken, 
  generateRefreshToken,
  generatePasswordResetToken 
} = require('../utils/auth');
const emailService = require('./email.service');
const config = require('../config');

/**
 * Service for handling authentication-related operations
 */
class AuthService {
  /**
   * Authenticate a user with username/email and password
   * @param {string} usernameOrEmail - Username or email
   * @param {string} password - Plain text password
   * @param {boolean} rememberMe - Whether to extend token expiration
   * @returns {Promise<Object>} Authentication result with tokens
   */
  async authenticate(usernameOrEmail, password, rememberMe = false) {
    // Find user by username or email
    const user = await ProfessionalAccount.findOne({
      where: {
        [Op.or]: [
          { username: usernameOrEmail },
          { emailAddress: usernameOrEmail }
        ]
      }
    });

    if (!user) {
      return { success: false, message: 'Invalid credentials' };
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return { success: false, message: 'Invalid credentials' };
    }

    // Check if account is active
    if (!user.isAccountActive) {
      return { success: false, message: 'Account is inactive' };
    }

    // Update last login time
    await user.update({ lastLoginTime: new Date() });

    // Generate tokens
    const tokens = await this.generateTokenPair(user.accountId, user.accountRole, rememberMe);

    return {
      success: true,
      user: {
        accountId: user.accountId,
        username: user.username,
        emailAddress: user.emailAddress,
        accountRole: user.accountRole,
        profileImage: user.profileImage
      },
      ...tokens
    };
  }

  /**
   * Generate a new access and refresh token pair
   * @param {string} userId - User ID
   * @param {string} role - User role
   * @param {boolean} rememberMe - Whether to extend token expiration
   * @returns {Promise<Object>} Token pair
   */
  async generateTokenPair(userId, role, rememberMe = false) {
    // Generate tokens
    const accessToken = generateAccessToken(userId, role, rememberMe);
    const refreshToken = generateRefreshToken(userId);

    // Calculate expiration date for refresh token
    const refreshExpiry = new Date();
    refreshExpiry.setTime(
      refreshExpiry.getTime() + (config.auth.refreshTokenExpirationDays * 24 * 60 * 60 * 1000)
    );

    // Store refresh token in database
    await AuthenticationToken.create({
      accountId: userId,
      tokenValue: refreshToken,
      expirationDate: refreshExpiry
    });

    return {
      accessToken,
      refreshToken,
      tokenType: 'bearer'
    };
  }

  /**
   * Refresh access token using refresh token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<Object>} New token pair or error
   */
  async refreshTokens(refreshToken) {
    try {
      // Find token in database
      const tokenRecord = await AuthenticationToken.findOne({
        where: {
          tokenValue: refreshToken,
          expirationDate: { [Op.gt]: new Date() }
        },
        include: [{
          model: ProfessionalAccount,
          as: 'account'
        }]
      });

      if (!tokenRecord || !tokenRecord.account) {
        return { success: false, message: 'Invalid refresh token' };
      }

      // Check if account is active
      if (!tokenRecord.account.isAccountActive) {
        return { success: false, message: 'Account is inactive' };
      }

      // Delete used token (rotation)
      await tokenRecord.destroy();

      // Generate new token pair
      const tokens = await this.generateTokenPair(
        tokenRecord.account.accountId,
        tokenRecord.account.accountRole
      );

      return {
        success: true,
        ...tokens
      };
    } catch (error) {
      console.error('Error refreshing tokens:', error);
      return { success: false, message: 'Token refresh failed' };
    }
  }

  /**
   * Invalidate a refresh token (logout)
   * @param {string} refreshToken - Refresh token to invalidate
   * @returns {Promise<boolean>} Success indicator
   */
  async logout(refreshToken) {
    try {
      const result = await AuthenticationToken.destroy({
        where: { tokenValue: refreshToken }
      });
      return result > 0;
    } catch (error) {
      console.error('Error during logout:', error);
      return false;
    }
  }

  /**
   * Request password recovery
   * @param {string} email - User email address
   * @returns {Promise<boolean>} Success indicator
   */
  async requestPasswordRecovery(email) {
    try {
      // Find account by email
      const account = await ProfessionalAccount.findOne({
        where: {
          emailAddress: email,
          isAccountActive: true
        }
      });

      // Return true even if account not found to prevent email enumeration
      if (!account) {
        return true;
      }

      // Generate token and calculate expiration
      const token = generatePasswordResetToken();
      const expirationDate = new Date();
      expirationDate.setHours(expirationDate.getHours() + 24); // 24 hours

      // Create recovery request
      await PasswordRecoveryRequest.create({
        accountId: account.accountId,
        recoveryToken: token,
        expirationDate,
        isUsed: false
      });

      // Send recovery email
      const resetUrl = `${config.app.frontendUrl}/reset-password/${token}`;
      await emailService.sendPasswordResetEmail(email, resetUrl);

      return true;
    } catch (error) {
      console.error('Error requesting password recovery:', error);
      return false;
    }
  }

  /**
   * Reset password using recovery token
   * @param {string} token - Recovery token
   * @param {string} newPassword - New password
   * @returns {Promise<boolean>} Success indicator
   */
  async resetPassword(token, newPassword) {
    try {
      // Find valid recovery request
      const recovery = await PasswordRecoveryRequest.findOne({
        where: {
          recoveryToken: token,
          expirationDate: { [Op.gt]: new Date() },
          isUsed: false
        }
      });

      if (!recovery) {
        return false;
      }

      // Find the account
      const account = await ProfessionalAccount.findByPk(recovery.accountId);
      if (!account) {
        return false;
      }

      // Update password
      const passwordHash = await hashPassword(newPassword);
      await account.update({ passwordHash });

      // Mark recovery request as used
      await recovery.update({ isUsed: true });

      // Invalidate all refresh tokens for this account
      await AuthenticationToken.destroy({
        where: { accountId: account.accountId }
      });

      return true;
    } catch (error) {
      console.error('Error resetting password:', error);
      return false;
    }
  }
}

module.exports = new AuthService(); 