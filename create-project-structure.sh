#!/bin/bash
# Create project structure script

echo "Creating DataCanvasDev project structure..."

# Main app directories
mkdir -p src/api/authentication
mkdir -p src/api/articles
mkdir -p src/api/portfolio
mkdir -p src/api/services
mkdir -p src/api/expertise
mkdir -p src/api/client-inquiries
mkdir -p src/api/newsletter
mkdir -p src/api/digital-assets
mkdir -p src/api/site-configuration
mkdir -p src/api/webhooks
mkdir -p src/config
mkdir -p src/db/migrations
mkdir -p src/db/seeders
mkdir -p src/db/models
mkdir -p src/services
mkdir -p src/middleware
mkdir -p src/utils
mkdir -p src/docs
mkdir -p src/scheduled

# Test directories
mkdir -p tests/unit
mkdir -p tests/integration
mkdir -p tests/fixtures

# Scripts directory
mkdir -p scripts

# Create placeholder files
touch src/app.js
touch src/server.js

# Create config files
touch src/config/database.js
touch src/config/authentication.js
touch src/config/storage.js
touch src/config/cache.js
touch src/config/email.js

# Create middleware files
touch src/middleware/authentication.js
touch src/middleware/accessControl.js
touch src/middleware/requestValidation.js
touch src/middleware/errorHandling.js
touch src/middleware/responseCache.js
touch src/middleware/fileUpload.js
touch src/middleware/parameterValidation.js

# Create service files
touch src/services/authenticationService.js
touch src/services/digitalAssetService.js
touch src/services/communicationService.js
touch src/services/cacheService.js
touch src/services/storageService.js

# Create utility files
touch src/utils/logger.js
touch src/utils/businessHelpers.js
touch src/utils/validationSchemas.js

# Create scheduled tasks
touch src/scheduled/assetCleanup.js

# Create documentation file
touch src/docs/openapi.json

# Create script files
touch scripts/migrate.js
touch scripts/seed.js
touch scripts/backup.js

# Create configuration files
touch .sequelizerc
touch .env.example
touch .eslintrc.js
touch .prettierrc
touch jest.config.js
touch README.md

# Create package.json file
echo '{
  "name": "datacanvas-backend",
  "version": "0.1.0",
  "description": "DataCanvasDev Backend API",
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "lint": "eslint .",
    "test": "jest",
    "test:coverage": "jest --coverage",
    "db:migrate": "sequelize db:migrate",
    "db:migrate:undo": "sequelize db:migrate:undo",
    "db:seed": "sequelize db:seed:all",
    "db:seed:undo": "sequelize db:seed:undo:all",
    "generate:migration": "sequelize-cli migration:generate --name"
  },
  "keywords": [
    "express",
    "api",
    "backend",
    "portfolio",
    "cms"
  ],
  "author": "",
  "license": "MIT"
}' > package.json

# Add content to .sequelizerc
echo "const path = require('path');

module.exports = {
  'config': path.resolve('src/config', 'database.js'),
  'models-path': path.resolve('src/db', 'models'),
  'seeders-path': path.resolve('src/db', 'seeders'),
  'migrations-path': path.resolve('src/db', 'migrations')
};" > .sequelizerc

# Add content to .env.example
echo "# Application
APP_NAME=DataCanvasDev
APP_ENV=development
APP_DEBUG=true
APP_HOST=0.0.0.0
APP_PORT=8000

# Database
DATABASE_URL=postgresql://postgres:postgres@db:5432/datacanvas
DATABASE_TEST_URL=postgresql://postgres:postgres@db:5432/datacanvas_test

# Security
SECRET_KEY=generate_a_secure_secret_key_here
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
ALGORITHM=HS256
SALT_ROUNDS=12

# AWS S3
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET_NAME=your_bucket_name
AWS_S3_REGION=your_region
AWS_S3_ENDPOINT=https://s3.your_region.amazonaws.com

# Redis
REDIS_URL=redis://redis:6379/0

# Email
SMTP_TLS=true
SMTP_PORT=587
SMTP_HOST=smtp.example.com
SMTP_USER=your_user
SMTP_PASSWORD=your_password
EMAILS_FROM_EMAIL=info@example.com
EMAILS_FROM_NAME=DataCanvasDev

# Frontend URL (for emails, CORS)
FRONTEND_URL=http://localhost:3000" > .env.example

# Copy .env.example to .env
cp .env.example .env

# Add content to .eslintrc.js
echo "module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true,
  },
  extends: [
    'eslint:recommended',
  ],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
  },
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'indent': ['error', 2],
    'linebreak-style': ['error', 'unix'],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
  },
};" > .eslintrc.js

# Add content to jest.config.js
echo "module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/app.js',
    '!src/config/*.js',
    '!src/db/migrations/*.js',
    '!src/db/seeders/*.js',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  verbose: true,
};" > jest.config.js

# Add content to src/config/database.js
echo "require('dotenv').config();

module.exports = {
  development: {
    url: process.env.DATABASE_URL,
    dialect: 'postgres',
    logging: console.log,
    define: {
      timestamps: true,
      underscored: true,
      underscoredAll: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  },
  test: {
    url: process.env.DATABASE_TEST_URL,
    dialect: 'postgres',
    logging: false,
    define: {
      timestamps: true,
      underscored: true,
      underscoredAll: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  },
  production: {
    url: process.env.DATABASE_URL,
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    define: {
      timestamps: true,
      underscored: true,
      underscoredAll: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  }
};" > src/config/database.js

# Add content to src/app.js
echo "const express = require('express');
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
    message: \`Welcome to \${process.env.APP_NAME || 'DataCanvasDev'} API\`,
    documentation: '/api/docs',
    version: '0.1.0'
  });
});

// Error handling middleware (should be last)
app.use(errorHandler);

module.exports = app;" > src/app.js

# Add content to src/server.js
echo "require('dotenv').config();
const http = require('http');
const app = require('./app');
const { sequelize } = require('./db/models');

const PORT = process.env.APP_PORT || 8000;
const HOST = process.env.APP_HOST || '0.0.0.0';

const server = http.createServer(app);

async function startServer() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    
    // Start server
    server.listen(PORT, HOST, () => {
      console.log(\`Server running at http://\${HOST}:\${PORT}/\`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    sequelize.close().then(() => {
      console.log('Database connection closed');
      process.exit(0);
    });
  });
});

startServer();" > src/server.js

echo "Project structure created successfully!" 