const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./docs/openapi.json');
const compression = require('compression');

// Import middleware
const setupSecurityMiddleware = require('./middleware/security.middleware');
const { notFoundHandler, errorHandler, validationErrorHandler, jwtErrorHandler } = require('./middleware/error.middleware');
const { requestLogger } = require('./middleware/logging.middleware');
const { sanitizeRequestBody } = require('./middleware/sanitization.middleware');
const config = require('./config');

// Import routes
const authRoutes = require('./routes/auth.routes');
const portfolioRoutes = require('./api/portfolio');
const articlesRoutes = require('./api/articles');
const servicesRoutes = require('./api/services');
const expertiseRoutes = require('./api/expertise');
const inquiriesRoutes = require('./api/client-inquiries');
const newsletterRoutes = require('./api/newsletter');
const assetsRoutes = require('./api/digital-assets');
const configurationRoutes = require('./api/site-configuration');
const webhooksRoutes = require('./api/webhooks');

const app = express();

// Basic middleware setup
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());
app.use(compression());

// Apply logging middleware
app.use(requestLogger);

// Apply security middleware
setupSecurityMiddleware(app);

// Apply request sanitization
app.use(sanitizeRequestBody);

// Static files
app.use(express.static(path.join(__dirname, '../public')));

// API Documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  swaggerOptions: {
    persistAuthorization: true
  }
}));

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: `Welcome to ${config.app.name || 'DataCanvasDev'} API`,
    documentation: '/api/docs',
    version: config.app.version || '0.1.0'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'up',
    timestamp: new Date(),
    version: config.app.version || '0.1.0'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/portfolio-projects', portfolioRoutes);
app.use('/api/articles', articlesRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/expertise', expertiseRoutes);
app.use('/api/client-inquiries', inquiriesRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/digital-assets', assetsRoutes);
app.use('/api/site-configuration', configurationRoutes);
app.use('/api/webhooks', webhooksRoutes);

// Error handling middleware (should be last)
app.use(notFoundHandler);
app.use(validationErrorHandler);
app.use(jwtErrorHandler);
app.use(errorHandler);

module.exports = app;
