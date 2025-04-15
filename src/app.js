const express = require('express');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./docs/openapi.json');

// Import middleware
const errorHandler = require('./middleware/errorHandling');

// Import routes
const authenticationRoutes = require('./api/authentication');
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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(compression());

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false
});

// Apply rate limiting to all API routes
app.use('/api', apiLimiter);

// API routes
app.use('/api/authentication', authenticationRoutes);
app.use('/api/portfolio-projects', portfolioRoutes);
app.use('/api/articles', articlesRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/expertise', expertiseRoutes);
app.use('/api/client-inquiries', inquiriesRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/digital-assets', assetsRoutes);
app.use('/api/site-configuration', configurationRoutes);
app.use('/api/webhooks', webhooksRoutes);

// Swagger documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: `Welcome to ${process.env.APP_NAME || 'DataCanvasDev'} API`,
    documentation: '/api/docs',
    version: '0.1.0'
  });
});

// Error handling middleware (should be last)
app.use(errorHandler);

module.exports = app;
