# Phase 1: Project Setup and Configuration

This phase focuses on setting up a solid foundation for the DataCanvasDev backend application using Express.js. We'll establish the project structure, configure the development environment, and set up the essential dependencies.

## Step 1: Environment Setup

### Create the Project Directory and Initialize

```bash
# Create project directory (if not already created)
mkdir -p datacanvas-backend
cd datacanvas-backend

# Initialize npm package
npm init -y

# Update package.json with project details
```

### Install Core Dependencies

```bash
# Install Express and core packages
npm install express cors helmet express-rate-limit compression dotenv

# Install database packages
npm install pg pg-hstore sequelize sequelize-cli

# Install security packages
npm install bcrypt jsonwebtoken cookie-parser

# Install utility packages
npm install multer sharp aws-sdk redis nodemailer joi winston

# Install development dependencies
npm install --save-dev nodemon eslint jest supertest
```

## Step 2: Project Structure Creation

Create the following project structure:

```
datacanvas-backend/
├── src/                        # Source code
│   ├── api/                    # API implementation
│   │   ├── authentication/     # Authentication routes and controllers
│   │   ├── articles/           # Article publication routes and controllers
│   │   ├── portfolio/          # Portfolio project routes and controllers
│   │   ├── services/           # Professional services routes and controllers
│   │   ├── expertise/          # Professional expertise routes and controllers
│   │   ├── client-inquiries/   # Client inquiry form routes and controllers
│   │   ├── newsletter/         # Newsletter subscription routes and controllers
│   │   ├── digital-assets/     # Digital asset management routes and controllers
│   │   ├── site-configuration/ # Site configuration routes and controllers
│   │   └── webhooks/           # Webhook routes and controllers
│   │
│   ├── config/                 # Configuration files
│   │   ├── database.js         # Database configuration
│   │   ├── authentication.js   # Authentication configuration
│   │   ├── storage.js          # S3 storage configuration
│   │   ├── cache.js            # Redis cache configuration
│   │   └── email.js            # Email service configuration
│   │
│   ├── db/                     # Database related files
│   │   ├── migrations/         # Database migrations
│   │   ├── seeders/            # Seed data
│   │   └── models/             # Sequelize models
│   │
│   ├── services/               # Business logic services
│   │   ├── authenticationService.js   # Authentication service
│   │   ├── digitalAssetService.js     # Digital asset processing service
│   │   ├── communicationService.js    # Email and notification service
│   │   ├── cacheService.js            # Redis caching service
│   │   └── storageService.js          # S3 storage service
│   │
│   ├── middleware/             # Express middleware
│   │   ├── authentication.js           # Authentication middleware
│   │   ├── accessControl.js            # Role-based access control middleware
│   │   ├── requestValidation.js        # Request validation middleware
│   │   ├── errorHandling.js            # Error handling middleware
│   │   ├── responseCache.js            # Response caching middleware
│   │   ├── fileUpload.js               # File upload middleware
│   │   └── parameterValidation.js      # UUID validation middleware
│   │
│   ├── utils/                  # Utility functions
│   │   ├── logger.js           # Logging utility
│   │   ├── businessHelpers.js  # General business logic helper functions
│   │   └── validationSchemas.js # Validation schemas
│   │
│   ├── docs/                   # API documentation
│   │   └── openapi.json        # OpenAPI/Swagger specification
│   │
│   ├── scheduled/              # Scheduled tasks
│   │   └── assetCleanup.js     # Digital asset cleanup cron job
│   │
│   ├── app.js                  # Express app setup
│   └── server.js               # Server entry point
│
├── tests/                      # Test files
│   ├── unit/                   # Unit tests
│   ├── integration/            # Integration tests
│   └── fixtures/               # Test fixtures
│
├── scripts/                    # Utility scripts
│   ├── migrate.js              # Database migration script
│   ├── seed.js                 # Database seeding script
│   └── backup.js               # Database backup script
│
├── .sequelizerc                # Sequelize CLI configuration
├── .env.example                # Example environment variables
├── .eslintrc.js                # ESLint configuration
├── .prettierrc                 # Prettier configuration
├── jest.config.js              # Jest configuration
├── package.json                # NPM dependencies and scripts
└── README.md                   # Backend documentation
```

Create the directory structure with the following script:

```bash
#!/bin/bash
# Create project structure script

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

# Create configuration files
touch .sequelizerc
touch .env.example
touch .eslintrc.js
touch .prettierrc
touch jest.config.js
touch README.md

echo "Project structure created successfully!"
```

Save this script as `setup.sh`, make it executable with `chmod +x setup.sh`, and then run it with `./setup.sh`.

## Step 3: Configuration Setup

### Environment Variables Configuration

Create `.env.example` with the following content:

```env
# Application
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
FRONTEND_URL=http://localhost:3000
```

Copy this file to `.env`:

```bash
cp .env.example .env
```

### Setting Up Sequelize Configuration

Create `.sequelizerc` with the following content:

```javascript
const path = require('path');

module.exports = {
  'config': path.resolve('src/config', 'database.js'),
  'models-path': path.resolve('src/db', 'models'),
  'seeders-path': path.resolve('src/db', 'seeders'),
  'migrations-path': path.resolve('src/db', 'migrations')
};
```

### Setting Up Database Configuration

Create the database configuration in `src/config/database.js`:

```javascript
require('dotenv').config();

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
};
```

## Step 4: Main Application Setup

Create the Express application in `src/app.js`:

```javascript
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
```

Create the server entry point in `src/server.js`:

```javascript
require('dotenv').config();
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
      console.log(`Server running at http://${HOST}:${PORT}/`);
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

startServer();
```

## Step 5: Add Scripts to package.json

Update your `package.json` with the following scripts:

```json
{
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
  "license": "MIT",
  "dependencies": {
    "aws-sdk": "^2.1282.0",
    "bcrypt": "^5.1.0",
    "compression": "^1.7.4",
    "cookie-parser": "^1.4.6",
    "cors": "^2.8.5",
    "dotenv": "^16.0.3",
    "express": "^4.18.2",
    "express-rate-limit": "^6.7.0",
    "helmet": "^6.0.1",
    "joi": "^17.7.0",
    "jsonwebtoken": "^9.0.0",
    "multer": "^1.4.5-lts.1",
    "nodemailer": "^6.8.0",
    "pg": "^8.8.0",
    "pg-hstore": "^2.3.4",
    "redis": "^4.5.1",
    "sequelize": "^6.28.0",
    "sequelize-cli": "^6.5.2",
    "sharp": "^0.31.3",
    "swagger-ui-express": "^4.6.0",
    "winston": "^3.8.2"
  },
  "devDependencies": {
    "eslint": "^8.30.0",
    "jest": "^29.3.1",
    "nodemon": "^2.0.20",
    "supertest": "^6.3.3"
  }
}
```

## Step 6: Initialize ESLint

Create an ESLint configuration file `.eslintrc.js`:

```javascript
module.exports = {
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
};
```

## Step 7: Initialize Jest

Create a Jest configuration file `jest.config.js`:

```javascript
module.exports = {
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
};
```

## Next Steps

Now that we have set up the project foundation, we can proceed to Phase 2: [Database Design and Setup](02-database-design.md) to define our database models and implement migration scripts. 