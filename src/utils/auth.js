const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');

/**
 * Generate a hashed password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
async function hashPassword(password) {
  const saltRounds = config.auth?.saltRounds || 10;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Verify a password against a hash
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} Whether the password is valid
 */
async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a JWT access token
 * @param {string} userId - User ID to include in the token
 * @param {string} role - User role for authorization
 * @param {boolean} rememberMe - Whether to extend token expiration
 * @returns {string} Signed JWT token
 */
function generateAccessToken(userId, role = 'user', rememberMe = false) {
  const expiresIn = rememberMe 
    ? config.auth?.extendedTokenExpiration || '7d'
    : config.auth?.tokenExpiration || '1h';

  return jwt.sign(
    { 
      sub: userId,
      role: role,
      type: 'access'
    },
    config.auth?.jwtSecret || 'your-secret-key',
    { expiresIn }
  );
}

/**
 * Generate a refresh token
 * @param {string} userId - User ID to include in the token
 * @returns {string} Signed JWT refresh token
 */
function generateRefreshToken(userId) {
  return jwt.sign(
    { 
      sub: userId,
      type: 'refresh',
      jti: uuidv4() // unique token identifier
    },
    config.auth?.jwtRefreshSecret || 'your-refresh-secret-key',
    { expiresIn: config.auth?.refreshTokenExpiration || '7d' }
  );
}

/**
 * Verify and decode a JWT token
 * @param {string} token - JWT token to verify
 * @param {string} secret - Secret used to sign the token
 * @returns {Object|null} Decoded token payload or null if invalid
 */
function verifyToken(token, secret = config.auth?.jwtSecret || 'your-secret-key') {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
}

/**
 * Extract token from request
 * @param {Object} req - Express request object
 * @returns {string|null} The token or null if not found
 */
function extractTokenFromRequest(req) {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    return req.headers.authorization.substring(7);
  } else if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }
  return null;
}

/**
 * Generate a password recovery token
 * @returns {string} Random token for password recovery
 */
function generatePasswordResetToken() {
  return uuidv4();
}

module.exports = {
  hashPassword,
  verifyPassword,
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  extractTokenFromRequest,
  generatePasswordResetToken
}; 