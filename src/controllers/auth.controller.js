const authService = require('../services/auth.service');
const { validationResult } = require('express-validator');
const config = require('../config');

/**
 * Handle user login
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
async function login(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password, rememberMe } = req.body;
    const result = await authService.authenticate(username, password, rememberMe);

    if (!result.success) {
      return res.status(401).json({ message: result.message });
    }

    // Set refresh token as HTTP-only cookie if configured
    if (config.auth.useCookies) {
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: config.app.environment === 'production',
        maxAge: config.auth.refreshTokenExpirationDays * 24 * 60 * 60 * 1000,
        sameSite: 'strict'
      });
    }

    res.json({
      accessToken: result.accessToken,
      refreshToken: config.auth.useCookies ? undefined : result.refreshToken,
      tokenType: result.tokenType,
      user: result.user
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
}

/**
 * Refresh authentication tokens
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
async function refreshToken(req, res) {
  try {
    const refreshToken = req.body.refreshToken || req.cookies.refreshToken;
    
    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }

    const result = await authService.refreshTokens(refreshToken);

    if (!result.success) {
      return res.status(401).json({ message: result.message });
    }

    // Update refresh token cookie if using cookies
    if (config.auth.useCookies) {
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: config.app.environment === 'production',
        maxAge: config.auth.refreshTokenExpirationDays * 24 * 60 * 60 * 1000,
        sameSite: 'strict'
      });
    }

    res.json({
      accessToken: result.accessToken,
      refreshToken: config.auth.useCookies ? undefined : result.refreshToken,
      tokenType: result.tokenType
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ message: 'Token refresh failed' });
  }
}

/**
 * Log user out by invalidating refresh token
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
async function logout(req, res) {
  try {
    const refreshToken = req.body.refreshToken || req.cookies.refreshToken;
    
    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }

    await authService.logout(refreshToken);

    // Clear refresh token cookie if using cookies
    if (config.auth.useCookies) {
      res.clearCookie('refreshToken');
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Logout failed' });
  }
}

/**
 * Request password recovery
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
async function requestPasswordRecovery(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;
    await authService.requestPasswordRecovery(email);

    // Always return success to prevent email enumeration
    res.json({
      success: true,
      message: 'If your email is registered, you will receive a password recovery link'
    });
  } catch (error) {
    console.error('Password recovery request error:', error);
    // Still return success to prevent email enumeration
    res.json({
      success: true,
      message: 'If your email is registered, you will receive a password recovery link'
    });
  }
}

/**
 * Reset password using recovery token
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
async function resetPassword(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { token } = req.params;
    const { password } = req.body;

    const success = await authService.resetPassword(token, password);

    if (!success) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Password reset failed' });
  }
}

module.exports = {
  login,
  refreshToken,
  logout,
  requestPasswordRecovery,
  resetPassword
}; 