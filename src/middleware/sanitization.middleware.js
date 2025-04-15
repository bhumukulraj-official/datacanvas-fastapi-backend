/**
 * Apply common sanitization rules to request bodies
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next function
 */
function sanitizeRequestBody(req, res, next) {
  // Don't sanitize file uploads
  if (req.is('multipart/form-data')) {
    return next();
  }

  // Apply sanitization to all string fields in body
  if (req.body && typeof req.body === 'object') {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        // Trim whitespace
        req.body[key] = req.body[key].trim();
        
        // Basic HTML sanitization if not explicitly allowed
        if (!req.skipSanitize || !req.skipSanitize.includes(key)) {
          req.body[key] = req.body[key]
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        }
      }
    });
  }
  
  next();
}

module.exports = {
  sanitizeRequestBody
}; 