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