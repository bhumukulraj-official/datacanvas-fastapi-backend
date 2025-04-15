const csrf = require('csurf');
const config = require('../config');

/**
 * Configure CSRF protection middleware
 * @returns {Function} CSRF middleware
 */
function setupCSRFProtection() {
  // Only enable CSRF protection for non-API routes or specific routes if needed
  const csrfProtection = csrf({
    cookie: {
      key: '_csrf',
      httpOnly: true,
      secure: config.app.environment === 'production',
      sameSite: 'strict'
    }
  });

  return csrfProtection;
}

/**
 * Add CSRF token to response locals for templates
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next function
 */
function addCSRFToken(req, res, next) {
  res.locals.csrfToken = req.csrfToken();
  next();
}

module.exports = {
  setupCSRFProtection,
  addCSRFToken
}; 