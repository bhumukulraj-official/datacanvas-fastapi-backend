# Phase 3: Authentication and Security

In this phase, we'll implement robust authentication and security features for our DataCanvasDev backend application. We'll set up JWT-based authentication with refresh token rotation, secure password storage, and role-based access control.

## Step 1: Setting Up Authentication Libraries

First, let's install the necessary packages for authentication:

```bash
npm install jsonwebtoken bcrypt uuid cookie-parser
```

## Step 2: Creating Authentication Models

We've already defined our authentication-related models in the database setup phase. The key models are:

- `ProfessionalAccount`: Stores user account information
- `AuthenticationToken`: Stores refresh tokens for the token rotation strategy
- `PasswordRecoveryRequest`: Manages password reset requests

## Step 3: Implementing Security Utilities

Let's create authentication utilities in `src/utils/auth.js`:

```javascript
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
  const saltRounds = config.auth.saltRounds || 10;
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
    ? config.auth.extendedTokenExpiration 
    : config.auth.tokenExpiration;

  return jwt.sign(
    { 
      sub: userId,
      role: role,
      type: 'access'
    },
    config.auth.jwtSecret,
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
    config.auth.jwtRefreshSecret,
    { expiresIn: config.auth.refreshTokenExpiration }
  );
}

/**
 * Verify and decode a JWT token
 * @param {string} token - JWT token to verify
 * @param {string} secret - Secret used to sign the token
 * @returns {Object|null} Decoded token payload or null if invalid
 */
function verifyToken(token, secret = config.auth.jwtSecret) {
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
```

## Step 4: Creating Authentication Service

Let's implement the authentication service in `src/services/auth.service.js`:

```javascript
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
   * @returns {Promise<Object>} Authentication result with tokens
   */
  async authenticate(usernameOrEmail, password) {
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
    const tokens = await this.generateTokenPair(user.accountId, user.accountRole);

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
   * @returns {Promise<Object>} Token pair
   */
  async generateTokenPair(userId, role) {
    // Generate tokens
    const accessToken = generateAccessToken(userId, role);
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
```

## Step 5: Implementing Authentication Middleware

Let's create authentication middleware in `src/middleware/auth.middleware.js`:

```javascript
const { verifyToken, extractTokenFromRequest } = require('../utils/auth');
const { ProfessionalAccount } = require('../db/models').models;

/**
 * Middleware to authenticate requests
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
async function authenticate(req, res, next) {
  try {
    // Extract token from request
    const token = extractTokenFromRequest(req);
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Verify token
    const payload = verifyToken(token);
    if (!payload) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    // Check token type
    if (payload.type !== 'access') {
      return res.status(401).json({ message: 'Invalid token type' });
    }

    // Find user
    const user = await ProfessionalAccount.findByPk(payload.sub);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if account is active
    if (!user.isAccountActive) {
      return res.status(403).json({ message: 'Account is inactive' });
    }

    // Attach user to request object
    req.user = {
      accountId: user.accountId,
      username: user.username,
      emailAddress: user.emailAddress,
      accountRole: user.accountRole
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ message: 'Authentication error' });
  }
}

/**
 * Middleware to check if user has required role
 * @param {Array} roles - Allowed roles
 * @returns {Function} Express middleware
 */
function requireRoles(roles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.accountRole)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
}

// Common role middleware
const requireAdmin = requireRoles(['admin']);
const requireUser = requireRoles(['admin', 'user']);

module.exports = {
  authenticate,
  requireRoles,
  requireAdmin,
  requireUser
};
```

## Step 6: Implementing Authentication Controllers

Let's create authentication controllers in `src/controllers/auth.controller.js`:

```javascript
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
```

## Step 7: Implementing Authentication Routes

Let's create authentication routes in `src/routes/auth.routes.js`:

```javascript
const express = require('express');
const { body, param } = require('express-validator');
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * @route POST /api/auth/login
 * @desc Authenticate user and get tokens
 * @access Public
 */
router.post('/login', [
  body('username').notEmpty().withMessage('Username or email is required'),
  body('password').notEmpty().withMessage('Password is required')
], authController.login);

/**
 * @route POST /api/auth/refresh-token
 * @desc Refresh authentication tokens
 * @access Public
 */
router.post('/refresh-token', authController.refreshToken);

/**
 * @route POST /api/auth/logout
 * @desc Logout user by invalidating refresh token
 * @access Private
 */
router.post('/logout', authenticate, authController.logout);

/**
 * @route POST /api/auth/request-password-recovery
 * @desc Request password recovery email
 * @access Public
 */
router.post('/request-password-recovery', [
  body('email').isEmail().withMessage('Valid email is required')
], authController.requestPasswordRecovery);

/**
 * @route PUT /api/auth/reset-password/:token
 * @desc Reset password using recovery token
 * @access Public
 */
router.put('/reset-password/:token', [
  param('token').notEmpty().withMessage('Token is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Passwords do not match');
    }
    return true;
  })
], authController.resetPassword);

module.exports = router;
```

## Step 8: Email Service for Password Recovery

Let's implement an email service in `src/services/email.service.js`:

```javascript
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
```

## Step 9: Set Up Security Middleware

Let's implement security middleware in `src/middleware/security.middleware.js`:

```javascript
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const xss = require('xss-clean');
const hpp = require('hpp');
const config = require('../config');

/**
 * Configure and apply security middleware to Express app
 * @param {Object} app - Express app
 */
function setupSecurityMiddleware(app) {
  // Set security HTTP headers
  app.use(helmet());

  // Enable CORS
  app.use(cors({
    origin: config.app.corsOrigins || '*',
    credentials: true
  }));

  // Rate limiting
  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again later'
  });

  // Apply rate limiting to all routes
  app.use(globalLimiter);

  // Stricter rate limit for authentication routes
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many authentication attempts, please try again later'
  });

  // Apply authentication rate limiter to specific routes
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/request-password-recovery', authLimiter);
  app.use('/api/auth/reset-password', authLimiter);

  // Data sanitization against XSS
  app.use(xss());

  // Prevent parameter pollution
  app.use(hpp());

  // Set secure cookies
  app.use((req, res, next) => {
    res.cookie('sameSite', 'Strict');
    next();
  });

  // Content Security Policy
  if (config.app.environment === 'production') {
    app.use(helmet.contentSecurityPolicy({
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"]
      }
    }));
  }
}

module.exports = setupSecurityMiddleware;
```

## Step 10: Configure Error Handling Middleware

Let's implement error handling middleware in `src/middleware/error.middleware.js`:

```javascript
const config = require('../config');

/**
 * Handle 404 errors
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next function
 */
function notFoundHandler(req, res, next) {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
}

/**
 * Handle global errors
 * @param {Error} err - Error object
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next function
 */
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  
  // Log error
  console.error(`[${new Date().toISOString()}] ${err.stack}`);
  
  // Send error response
  res.status(statusCode).json({
    message: err.message,
    stack: config.app.environment === 'development' ? err.stack : undefined
  });
}

/**
 * Handle validation errors
 * @param {Error} err - Error object
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next function
 */
function validationErrorHandler(err, req, res, next) {
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Validation Error',
      errors: Object.values(err.errors).map(val => val.message)
    });
  }
  next(err);
}

/**
 * Handle JWT authentication errors
 * @param {Error} err - Error object
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next function
 */
function jwtErrorHandler(err, req, res, next) {
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      message: 'Invalid token'
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      message: 'Token expired'
    });
  }
  
  next(err);
}

module.exports = {
  notFoundHandler,
  errorHandler,
  validationErrorHandler,
  jwtErrorHandler
};
```

## Step 11: Set Up Authentication Tests

Let's create authentication tests in `tests/integration/auth.test.js`:

```javascript
const request = require('supertest');
const app = require('../../src/app');
const { ProfessionalAccount, AuthenticationToken } = require('../../src/db/models').models;
const { hashPassword } = require('../../src/utils/auth');
const { v4: uuidv4 } = require('uuid');

describe('Authentication API', () => {
  let testUser;
  let testRefreshToken;

  beforeAll(async () => {
    // Create test user
    const userId = uuidv4();
    const passwordHash = await hashPassword('Password123!');
    
    testUser = await ProfessionalAccount.create({
      accountId: userId,
      username: 'testuser',
      emailAddress: 'test@example.com',
      passwordHash,
      accountRole: 'user',
      isAccountActive: true
    });
  });

  afterAll(async () => {
    // Clean up test data
    await AuthenticationToken.destroy({ where: { accountId: testUser.accountId } });
    await testUser.destroy();
  });

  describe('POST /api/auth/login', () => {
    it('should log in successfully with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'Password123!'
        });
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user).toHaveProperty('accountId', testUser.accountId);
      
      // Save refresh token for later tests
      testRefreshToken = res.body.refreshToken;
    });

    it('should fail with invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'wrongpassword'
        });
      
      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('message');
    });

    it('should fail with missing credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser'
        });
      
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('errors');
    });
  });

  describe('POST /api/auth/refresh-token', () => {
    it('should issue new tokens with valid refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh-token')
        .send({
          refreshToken: testRefreshToken
        });
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      
      // Update refresh token for later tests
      testRefreshToken = res.body.refreshToken;
    });

    it('should fail with invalid refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh-token')
        .send({
          refreshToken: 'invalid-token'
        });
      
      expect(res.statusCode).toBe(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should successfully log out with valid token', async () => {
      // First get a valid access token
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'Password123!'
        });
      
      const accessToken = loginRes.body.accessToken;
      const refreshToken = loginRes.body.refreshToken;
      
      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          refreshToken
        });
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
    });
  });
});
```

In the next section, we'll continue with additional security features and integrating these components with our Express application. 