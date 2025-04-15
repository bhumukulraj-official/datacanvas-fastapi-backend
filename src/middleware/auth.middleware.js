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