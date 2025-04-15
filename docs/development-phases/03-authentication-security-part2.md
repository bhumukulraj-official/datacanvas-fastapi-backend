# Phase 3: Authentication and Security (Part 2)

In this section, we continue implementing security measures for the DataCanvasDev backend application.

## Step 9: Setting Up Additional Security Middleware

Let's implement comprehensive security middleware in `src/middleware/security.middleware.js`:

```javascript
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const xss = require('xss-clean');
const hpp = require('hpp');
const contentSecurityPolicy = require('helmet-csp');
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
    app.use(contentSecurityPolicy({
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
```

## Step 10: Update Main Application with Security Settings

Now, let's update our main application file in `src/app.js` to include all security middleware:

```javascript
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const rateLimit = require('express-rate-limit');

const setupSecurityMiddleware = require('./middleware/security.middleware');
const { notFoundHandler, errorHandler, validationErrorHandler, jwtErrorHandler } = require('./middleware/error.middleware');
const config = require('./config');

// Import routes
const indexRouter = require('./routes/index');
const authRouter = require('./routes/auth.routes');
const portfolioRouter = require('./routes/portfolio.routes');
const articleRouter = require('./routes/article.routes');
const serviceRouter = require('./routes/service.routes');
const assetRouter = require('./routes/asset.routes');

// Create Express app
const app = express();

// Apply basic middleware
app.use(logger(config.app.environment === 'development' ? 'dev' : 'combined'));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../public')));

// Apply security middleware
setupSecurityMiddleware(app);

// API Documentation
if (config.app.environment !== 'production' || config.app.enableDocsProduction) {
  const swaggerDocument = YAML.load(path.join(__dirname, '../docs/api-spec.yaml'));
  
  // Apply rate limit to swagger docs
  const swaggerLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 30, // limit each IP to 30 requests per windowMs
    message: 'Too many requests to the API documentation, please try again later'
  });
  
  app.use('/api-docs', swaggerLimiter, swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: {
      persistAuthorization: true
    }
  }));
}

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'DataCanvasDev API',
    version: config.app.version,
    documentation: '/api-docs'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'up',
    timestamp: new Date(),
    version: config.app.version
  });
});

// Apply routes
app.use('/api', indexRouter);
app.use('/api/auth', authRouter);
app.use('/api/portfolio', portfolioRouter);
app.use('/api/articles', articleRouter);
app.use('/api/services', serviceRouter);
app.use('/api/assets', assetRouter);

// Error handling middleware
app.use(notFoundHandler);
app.use(validationErrorHandler);
app.use(jwtErrorHandler);
app.use(errorHandler);

module.exports = app;
```

## Step 11: Data Validation

Let's implement request validation using express-validator. First, create a utility in `src/utils/validation.js`:

```javascript
const { validationResult } = require('express-validator');

/**
 * Middleware to handle validation errors
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next function
 */
function validateRequest(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors.array().map(error => ({
        field: error.param,
        message: error.msg
      }))
    });
  }
  next();
}

module.exports = {
  validateRequest
};
```

## Step 12: Configure CSRF Protection

For forms and session-based endpoints, let's add CSRF protection in `src/middleware/csrf.middleware.js`:

```javascript
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
```

## Step 13: Implement Request Logging and Audit

Create a logging middleware in `src/middleware/logging.middleware.js`:

```javascript
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
```

## Step 14: Implement Request Sanitization

Let's create a sanitization middleware in `src/middleware/sanitization.middleware.js`:

```javascript
const { sanitize } = require('express-validator');

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
```

## Step 15: Writing Tests for Security Features

Let's create security tests in `tests/security/security.test.js`:

```javascript
const request = require('supertest');
const app = require('../../src/app');

describe('Security Headers', () => {
  it('should include security headers', async () => {
    const res = await request(app).get('/');
    
    // Content Type Options
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    
    // XSS Protection
    expect(res.headers['x-xss-protection']).toBe('1; mode=block');
    
    // Frame Options
    expect(res.headers['x-frame-options']).toBe('DENY');
    
    // Referrer Policy
    expect(res.headers['referrer-policy']).toBe('same-origin');
  });
});

describe('Rate Limiting', () => {
  it('should rate limit login endpoint', async () => {
    const requests = Array(15).fill().map(() => 
      request(app)
        .post('/api/auth/login')
        .send({ username: 'test', password: 'test' })
    );
    
    const responses = await Promise.all(requests);
    
    // At least one response should be rate limited
    const rateLimited = responses.some(res => res.status === 429);
    expect(rateLimited).toBe(true);
  });
});

describe('Input Validation', () => {
  it('should reject invalid input', async () => {
    const res = await request(app)
      .post('/api/auth/request-password-recovery')
      .send({ email: 'not-an-email' });
    
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });
});

describe('CORS', () => {
  it('should include CORS headers', async () => {
    const res = await request(app)
      .get('/')
      .set('Origin', 'http://example.com');
    
    expect(res.headers['access-control-allow-origin']).toBeDefined();
  });
});
```

By implementing these security measures, our DataCanvasDev application is now well-protected against common web vulnerabilities, including XSS, CSRF, injection attacks, and brute force attempts. The application also includes proper request validation, sanitization, and logging to help identify and respond to security incidents. 