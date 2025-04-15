const database = require('./database');
const auth = require('./authentication');
const email = require('./email');
const storage = require('./storage');
const cache = require('./cache');

module.exports = {
  app: {
    environment: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    name: process.env.APP_NAME || 'DataCanvasDev',
    version: process.env.APP_VERSION || '1.0.0',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    corsOrigins: process.env.CORS_ORIGINS || '*',
    enableDocsProduction: process.env.ENABLE_DOCS_PRODUCTION === 'true'
  },
  db: database,
  auth,
  email,
  storage,
  cache
}; 