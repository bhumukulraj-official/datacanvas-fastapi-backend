# Phase 10: Maintenance and Future Enhancements

This phase outlines the ongoing maintenance tasks and potential future enhancements for the DataCanvasDev backend application. Having a clear maintenance strategy ensures the application remains reliable, secure, and adaptable to changing requirements.

## Maintenance Tasks

### Regular Health Checks

1. **Database Maintenance**
   - Run weekly VACUUM operations to reclaim storage
   - Analyze query performance and optimize slow queries
   - Monitor connection pool usage and adjust as needed

2. **Security Updates**
   - Apply npm security patches promptly
   - Rotate JWT secrets and API keys quarterly
   - Conduct regular dependency audits (`npm audit`)
   - Update SSL certificates before expiration

3. **Performance Monitoring**
   - Track API response times and optimize slow endpoints
   - Monitor server resource utilization (CPU, memory, disk space)
   - Analyze Redis cache hit/miss ratios to optimize caching strategies

4. **Backup Verification**
   - Test database restore procedures monthly
   - Verify backup integrity and accessibility
   - Validate disaster recovery procedures quarterly

### Automated Tasks

Create scheduled tasks for common maintenance operations:

```javascript
// src/scheduled/maintenanceTasks.js
const cron = require('node-cron');
const { sequelize } = require('../db/models');
const logger = require('../utils/logger');

// Database connection status check - Every 30 minutes
cron.schedule('*/30 * * * *', async () => {
  try {
    await sequelize.authenticate();
    logger.info('Database connection is healthy');
  } catch (error) {
    logger.error('Database connection check failed', { error: error.message });
  }
});

// Weekly database stats collection - Every Sunday at 1 AM
cron.schedule('0 1 * * 0', async () => {
  try {
    // Get table statistics
    const [results] = await sequelize.query(`
      SELECT 
        schemaname, 
        relname AS table_name, 
        n_live_tup AS row_count,
        pg_size_pretty(pg_total_relation_size(relid)) AS total_size
      FROM pg_stat_user_tables
      ORDER BY n_live_tup DESC;
    `);
    
    logger.info('Database statistics collected', { stats: results });
    
    // Check for tables that might need vacuuming
    const [bloatResults] = await sequelize.query(`
      SELECT 
        schemaname, 
        relname AS table_name,
        n_dead_tup AS dead_tuples
      FROM pg_stat_user_tables
      WHERE n_dead_tup > 1000
      ORDER BY n_dead_tup DESC;
    `);
    
    if (bloatResults.length > 0) {
      logger.warn('Some tables have significant bloat and might need vacuuming', {
        tables: bloatResults
      });
    }
  } catch (error) {
    logger.error('Error collecting database statistics', { error: error.message });
  }
});

// Cleanup expired tokens - Daily at 2 AM
cron.schedule('0 2 * * *', async () => {
  try {
    const { AuthenticationToken } = require('../db/models');
    const now = new Date();
    
    // Delete expired refresh tokens
    const result = await AuthenticationToken.destroy({
      where: {
        expirationDate: { [sequelize.Op.lt]: now }
      }
    });
    
    logger.info(`Cleaned up ${result} expired authentication tokens`);
  } catch (error) {
    logger.error('Error cleaning up expired tokens', { error: error.message });
  }
});

// Cleanup expired password reset requests - Daily at 2:15 AM
cron.schedule('15 2 * * *', async () => {
  try {
    const { PasswordRecoveryRequest } = require('../db/models');
    const now = new Date();
    
    // Delete expired password reset requests
    const result = await PasswordRecoveryRequest.destroy({
      where: {
        expirationDate: { [sequelize.Op.lt]: now }
      }
    });
    
    logger.info(`Cleaned up ${result} expired password reset requests`);
  } catch (error) {
    logger.error('Error cleaning up expired password reset requests', { error: error.message });
  }
});
```

### Log Rotation

Configure log rotation to prevent log files from growing too large:

```javascript
// Add log rotation configuration to src/utils/logger.js
const { createLogger, format, transports } = require('winston');
require('winston-daily-rotate-file');

// Create file rotate transport for production
const fileRotateTransport = new transports.DailyRotateFile({
  filename: 'logs/application-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
  format: format.combine(
    format.timestamp(),
    format.json()
  )
});

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    })
  ]
});

// Add file transport in production
if (process.env.NODE_ENV === 'production') {
  logger.add(fileRotateTransport);
}

module.exports = logger;
```

## Performance Optimization

### Database Query Optimization

1. **Implement Query Analysis**

Create a utility to identify slow queries:

```javascript
// src/utils/queryAnalyzer.js
const logger = require('./logger');

function logQueryTime(queryInfo, startTime) {
  const duration = Date.now() - startTime;
  
  // Log queries that take longer than 500ms
  if (duration > 500) {
    logger.warn('Slow query detected', {
      query: queryInfo.sql,
      parameters: queryInfo.bind,
      duration,
      timestamp: new Date().toISOString()
    });
  }
}

// Use with Sequelize
sequelize.addHook('beforeQuery', (options) => {
  options.startTime = Date.now();
});

sequelize.addHook('afterQuery', (options) => {
  if (options.startTime) {
    logQueryTime(options, options.startTime);
  }
});

module.exports = { logQueryTime };
```

2. **Create Database Indexes for Common Queries**

```javascript
// Add to relevant migrations
await queryInterface.addIndex('portfolio_projects', {
  fields: ['accountId', 'publicationStatus'],
  name: 'idx_projects_account_status'
});

await queryInterface.addIndex('article_publications', {
  fields: ['publicationStatus', 'publicationDate'],
  name: 'idx_articles_status_date'
});

await queryInterface.addIndex('content_tags', {
  fields: ['tagSlug'],
  name: 'idx_tags_slug'
});
```

### Response Caching Strategy

Implement caching for frequently accessed data:

```javascript
// src/middleware/cacheMiddleware.js
const redisClient = require('../services/cacheService');

// Cache middleware for responses
function cacheResponse(duration = 3600) {
  return async (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }

    try {
      const cacheKey = `api:${req.originalUrl}`;
      const cachedResponse = await redisClient.get(cacheKey);

      if (cachedResponse) {
        const data = JSON.parse(cachedResponse);
        return res.json(data);
      }

      // Store the original res.json function
      const originalJson = res.json;

      // Override res.json method to cache the response
      res.json = function(data) {
        // Store response in cache
        redisClient.set(cacheKey, JSON.stringify(data), {
          EX: duration
        }).catch(err => {
          console.error('Redis cache error:', err);
        });

        // Call the original json method
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      next();
    }
  };
}

// Function to invalidate cache based on patterns
async function invalidateCache(pattern) {
  try {
    // Get all keys matching the pattern
    const keys = await redisClient.keys(`api:${pattern}`);
    
    if (keys.length > 0) {
      // Delete all matching keys
      await redisClient.del(keys);
      return keys.length;
    }
    
    return 0;
  } catch (error) {
    console.error('Cache invalidation error:', error);
    return 0;
  }
}

module.exports = { cacheResponse, invalidateCache };
```

## Future Enhancements

### API Versioning Implementation

1. **Implement Version Routing**

```javascript
// src/app.js - Update route registration
const v1Routes = require('./api/v1');
const v2Routes = require('./api/v2');

// Apply v1 routes
app.use('/api/v1', v1Routes);

// Apply v2 routes when ready
app.use('/api/v2', v2Routes);

// Redirect base API calls to the latest version
app.use('/api', (req, res) => {
  // Redirect to the latest API version
  const path = req.originalUrl.replace(/^\/api/, '/api/v2');
  res.redirect(path);
});
```

2. **Create Version Header Support**

```javascript
// src/middleware/versionMiddleware.js
function versionRouter(req, res, next) {
  // Check for API version header
  const apiVersion = req.headers['accept-version'] || 'v1';
  
  // Modify request to include version info
  req.apiVersion = apiVersion;
  
  next();
}

module.exports = versionRouter;
```

### GraphQL Implementation

1. **Add GraphQL Support**

```javascript
// Install required packages
// npm install graphql apollo-server-express

// src/graphql/index.js
const { ApolloServer } = require('apollo-server-express');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const { typeDefs, resolvers } = require('./schema');

// Create schema
const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

// Create Apollo Server
const apolloServer = new ApolloServer({
  schema,
  context: ({ req }) => {
    // Add authentication context
    const token = req.headers.authorization || '';
    // Create context with user information
    return { token };
  },
  formatError: (error) => {
    // Log error details
    console.error('GraphQL Error:', error);
    
    // Return simplified error for client
    return {
      message: error.message,
      path: error.path,
    };
  },
});

module.exports = apolloServer;
```

2. **Create Basic Schema**

```graphql
// src/graphql/schema.js
const { gql } = require('apollo-server-express');

const typeDefs = gql`
  type Project {
    id: ID!
    title: String!
    description: String!
    thumbnail: String!
    status: String!
    created_at: String!
    updated_at: String!
    categories: [Category]
    technologies: [Technology]
  }
  
  type Category {
    id: ID!
    name: String!
    type: String!
  }
  
  type Technology {
    id: ID!
    name: String!
  }
  
  type Query {
    projects(limit: Int, offset: Int, status: String): [Project]
    project(id: ID!): Project
    categories(type: String): [Category]
  }
`;

const resolvers = {
  Query: {
    projects: async (_, { limit = 10, offset = 0, status = 'published' }) => {
      // Implement fetching projects
    },
    project: async (_, { id }) => {
      // Implement fetching a single project
    },
    categories: async (_, { type }) => {
      // Implement fetching categories
    },
  },
  Project: {
    categories: async (parent) => {
      // Implement fetching categories for a project
    },
    technologies: async (parent) => {
      // Implement fetching technologies for a project
    },
  },
};

module.exports = { typeDefs, resolvers };
```

### Webhook System Enhancement

Implement a more robust webhook system:

```javascript
// src/services/webhookService.js
const crypto = require('crypto');
const axios = require('axios');
const { WebhookSubscription } = require('../db/models');
const logger = require('../utils/logger');

/**
 * Send webhooks for a specific event
 * @param {string} event - Event name (e.g., 'project.created')
 * @param {object} payload - Event payload
 */
async function sendWebhooks(event, payload) {
  try {
    // Find all active webhook subscriptions for this event
    const subscriptions = await WebhookSubscription.findAll({
      where: {
        eventType: event,
        isActive: true
      }
    });
    
    if (!subscriptions.length) {
      return;
    }
    
    // Send webhook to each subscriber
    for (const subscription of subscriptions) {
      try {
        // Create signature for the payload
        const signature = crypto
          .createHmac('sha256', subscription.secret)
          .update(JSON.stringify(payload))
          .digest('hex');
        
        // Send the webhook
        await axios.post(subscription.targetUrl, payload, {
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Signature': signature,
            'X-Webhook-Event': event
          },
          timeout: 5000 // 5 second timeout
        });
        
        // Update last successful delivery
        await subscription.update({
          lastSuccessfulDelivery: new Date(),
          failureCount: 0
        });
        
        logger.info(`Webhook delivered successfully`, {
          event,
          targetUrl: subscription.targetUrl
        });
      } catch (error) {
        // Track failures
        await subscription.increment('failureCount');
        
        // If reached max failures, deactivate
        if (subscription.failureCount >= 5) {
          await subscription.update({ isActive: false });
          logger.warn(`Webhook deactivated due to multiple failures`, {
            event,
            targetUrl: subscription.targetUrl
          });
        }
        
        logger.error(`Webhook delivery failed`, {
          event,
          targetUrl: subscription.targetUrl,
          error: error.message
        });
      }
    }
  } catch (error) {
    logger.error(`Error processing webhooks`, {
      event,
      error: error.message
    });
  }
}

module.exports = { sendWebhooks };
```

### Real-time Features with Socket.IO

Add real-time capabilities:

```javascript
// npm install socket.io

// src/services/socketService.js
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const { SECRET_KEY } = process.env;

let io;

// Initialize Socket.IO
function initialize(server) {
  io = socketIo(server, {
    cors: {
      origin: process.env.FRONTEND_URL,
      methods: ["GET", "POST"],
      credentials: true
    }
  });
  
  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error'));
    }
    
    try {
      const decoded = jwt.verify(token, SECRET_KEY);
      socket.user = { id: decoded.sub };
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });
  
  io.on('connection', (socket) => {
    // Join user to their personal room for private messages
    socket.join(`user:${socket.user.id}`);
    
    // Handle notifications subscription
    socket.on('subscribe:notifications', () => {
      socket.join(`notifications:${socket.user.id}`);
    });
    
    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });
  
  return io;
}

// Send notification to specific user
function sendUserNotification(userId, notification) {
  if (!io) return;
  
  io.to(`notifications:${userId}`).emit('notification', notification);
}

// Broadcast project update to all connected clients
function broadcastProjectUpdate(projectId, data) {
  if (!io) return;
  
  io.emit('project:update', { projectId, ...data });
}

module.exports = {
  initialize,
  sendUserNotification,
  broadcastProjectUpdate
};
```

### Content Analytics and Reporting

Implement content analytics tracking:

```javascript
// src/services/analyticsService.js
const { ContentView, ContentInteraction } = require('../db/models');
const logger = require('../utils/logger');

/**
 * Track content view
 */
async function trackContentView(contentType, contentId, userId = null, metadata = {}) {
  try {
    await ContentView.create({
      contentType,
      contentId,
      userId,
      ipAddress: metadata.ipAddress || null,
      userAgent: metadata.userAgent || null,
      referrer: metadata.referrer || null,
      timestamp: new Date()
    });
  } catch (error) {
    logger.error('Error tracking content view', { error: error.message });
  }
}

/**
 * Track content interaction (likes, shares, comments)
 */
async function trackContentInteraction(contentType, contentId, interactionType, userId = null, metadata = {}) {
  try {
    await ContentInteraction.create({
      contentType,
      contentId,
      interactionType,
      userId,
      metadata: JSON.stringify(metadata),
      timestamp: new Date()
    });
  } catch (error) {
    logger.error('Error tracking content interaction', { error: error.message });
  }
}

/**
 * Get content popularity report
 */
async function getContentPopularityReport(contentType, dateRange) {
  try {
    const { startDate, endDate } = dateRange;
    
    const results = await ContentView.findAll({
      attributes: [
        'contentId',
        [sequelize.fn('COUNT', sequelize.col('id')), 'viewCount']
      ],
      where: {
        contentType,
        timestamp: {
          [sequelize.Op.between]: [startDate, endDate]
        }
      },
      group: ['contentId'],
      order: [[sequelize.literal('viewCount'), 'DESC']],
      limit: 10
    });
    
    return results;
  } catch (error) {
    logger.error('Error generating content popularity report', { error: error.message });
    return [];
  }
}

module.exports = {
  trackContentView,
  trackContentInteraction,
  getContentPopularityReport
};
```

## Scaling Considerations

### Load Balancing and Horizontal Scaling

Implement solutions to handle increased traffic:

1. **Stateless Application Design**
   - Store session data in Redis instead of memory
   - Ensure all API endpoints can run on any instance

2. **Database Connection Pooling**
   - Configure optimal connection pool size:

```javascript
// src/db/models/index.js
const Sequelize = require('sequelize');
const config = require('../../config/database')[process.env.NODE_ENV || 'development'];

const sequelize = new Sequelize(config.url, {
  ...config,
  pool: {
    max: 20,            // Maximum connections in pool
    min: 5,             // Minimum connections in pool
    acquire: 30000,     // Maximum time to acquire connection (ms)
    idle: 10000         // Maximum idle time (ms)
  },
  logging: process.env.NODE_ENV === 'development' ? console.log : false
});

// Test connection pool
async function testConnectionPool() {
  try {
    // Get multiple connections from the pool
    const promises = Array(10).fill().map(() => sequelize.authenticate());
    await Promise.all(promises);
    console.log('Connection pool is working properly');
  } catch (error) {
    console.error('Connection pool error:', error);
  }
}

// Export models setup function
async function setupModels() {
  // Import models
  const models = {
    ProfessionalAccount: require('./account')(sequelize),
    PortfolioProject: require('./portfolio')(sequelize),
    // ... other models
  };
  
  // Set up associations
  Object.keys(models).forEach(modelName => {
    if (models[modelName].associate) {
      models[modelName].associate(models);
    }
  });
  
  return models;
}

module.exports = {
  sequelize,
  setupModels,
  testConnectionPool
};
```

### Multi-tenant Architecture

For potential future SaaS offering:

```javascript
// src/middleware/tenantMiddleware.js
async function tenantResolver(req, res, next) {
  // Get tenant ID from subdomain
  const hostname = req.headers.host;
  const subdomain = hostname.split('.')[0];
  
  if (subdomain === 'www' || subdomain === 'api') {
    // Default tenant or public site
    req.tenantId = null;
    return next();
  }
  
  try {
    // Look up tenant by subdomain
    const tenant = await Tenant.findOne({ where: { subdomain } });
    
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    
    if (!tenant.isActive) {
      return res.status(403).json({ error: 'Tenant is inactive' });
    }
    
    // Add tenant to request
    req.tenantId = tenant.id;
    req.tenant = tenant;
    
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = tenantResolver;
```
