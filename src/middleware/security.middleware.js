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
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Length', 'X-Request-Id'],
    credentials: true,
    maxAge: 86400
  }));

  // Rate limiting - global
  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again later'
  });

  // Apply global rate limiting to all routes
  app.use(globalLimiter);

  // Stricter rate limit for authentication routes
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many authentication attempts, please try again later'
  });

  // Rate limit for API documentation
  const docsLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 30, // limit each IP to 30 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false
  });

  // Apply authentication rate limiter to specific routes
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/request-password-recovery', authLimiter);
  app.use('/api/auth/reset-password', authLimiter);
  app.use('/api-docs', docsLimiter);

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
        scriptSrc: ["'self'", "'unsafe-inline'"], // Allow inline scripts for Swagger UI
        styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles for Swagger UI
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"]
      }
    }));
  }

  // HTTP Strict Transport Security
  if (config.app.environment === 'production') {
    app.use(helmet.hsts({
      maxAge: 31536000, // 1 year in seconds
      includeSubDomains: true,
      preload: true
    }));
  }

  // X-XSS-Protection
  app.use(helmet.xssFilter());

  // X-Content-Type-Options
  app.use(helmet.noSniff());

  // X-Frame-Options
  app.use(helmet.frameguard({ action: 'deny' }));

  // Referrer-Policy
  app.use(helmet.referrerPolicy({ policy: 'same-origin' }));

  // Feature-Policy
  app.use((req, res, next) => {
    res.setHeader('Feature-Policy', "geolocation 'none'; camera 'none'; microphone 'none'");
    next();
  });

  return app;
}

module.exports = setupSecurityMiddleware; 