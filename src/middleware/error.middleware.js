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