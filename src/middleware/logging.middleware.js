const winston = require('winston');
const config = require('../config');

// Configure Winston logger
const logger = winston.createLogger({
  level: config.app.environment === 'development' ? 'debug' : 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'data-canvas-api' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

/**
 * Request logging middleware
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next function
 */
function requestLogger(req, res, next) {
  // Generate request ID if not present
  req.id = req.headers['x-request-id'] || require('uuid').v4();
  res.setHeader('X-Request-Id', req.id);

  // Log request
  logger.info({
    type: 'request',
    id: req.id,
    method: req.method,
    url: req.url,
    ip: req.ip,
    user: req.user ? req.user.accountId : 'anonymous'
  });

  // Log response
  const originalSend = res.send;
  res.send = function(body) {
    logger.info({
      type: 'response',
      id: req.id,
      statusCode: res.statusCode,
      responseTime: Date.now() - req._startTime,
      contentLength: Buffer.isBuffer(body) ? body.length : Buffer.byteLength(body)
    });
    originalSend.call(this, body);
  };

  req._startTime = Date.now();
  next();
}

/**
 * Audit logging for sensitive operations
 * @param {string} operation - Operation being performed
 * @param {Object} details - Operation details
 * @param {Object} user - User performing the operation
 */
function auditLog(operation, details, user) {
  logger.info({
    type: 'audit',
    timestamp: new Date(),
    operation,
    user: user ? { id: user.accountId, username: user.username } : 'system',
    details
  });
}

module.exports = {
  logger,
  requestLogger,
  auditLog
}; 