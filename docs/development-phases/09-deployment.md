# Phase 9: Deployment

This phase outlines the deployment process for the DataCanvasDev Express.js backend application. We'll cover Docker containerization, environment configuration, CI/CD pipeline setup, and application monitoring.

## Step 1: Docker Containerization

### Create a Production-Ready Dockerfile

Create a `Dockerfile` in the project root:

```dockerfile
FROM node:18-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Build if needed (uncomment if you have a build step)
# RUN npm run build

# Remove development dependencies
RUN npm prune --production

# Production image
FROM node:18-alpine

WORKDIR /app

# Set NODE_ENV
ENV NODE_ENV=production

# Copy from builder stage
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src

# Expose port
EXPOSE 8000

# Run as non-root user
USER node

# Start the application
CMD ["node", "src/server.js"]
```

### Create a Docker Compose File for Production

Create a `docker-compose.prod.yml` file:

```yaml
version: '3.8'

services:
  api:
    image: datacanvas-backend:${TAG:-latest}
    build:
      context: .
      dockerfile: Dockerfile
    restart: unless-stopped
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    ports:
      - "${PORT:-8000}:8000"
    depends_on:
      - db
      - redis
    networks:
      - datacanvas_network
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:8000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  db:
    image: postgres:14-alpine
    restart: unless-stopped
    volumes:
      - postgres_data:/var/lib/postgresql/data
    env_file:
      - .env.production
    environment:
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_DB=${DB_NAME}
    networks:
      - datacanvas_network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER} -d ${DB_NAME}"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    networks:
      - datacanvas_network
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s

networks:
  datacanvas_network:

volumes:
  postgres_data:
  redis_data:
```

## Step 2: Environment Configuration for Different Environments

### Create Environment Configuration Files

Create `.env.production` for production settings:

```
# Application
APP_NAME=DataCanvasDev
APP_ENV=production
APP_DEBUG=false
APP_HOST=0.0.0.0
APP_PORT=8000

# Database
DB_USER=postgres
DB_PASSWORD=secure_production_password
DB_NAME=datacanvas_prod
DB_HOST=db
DB_PORT=5432
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}

# Security
SECRET_KEY=your_secure_production_key_here
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
ALGORITHM=HS256
SALT_ROUNDS=12

# AWS S3
AWS_ACCESS_KEY_ID=your_production_access_key
AWS_SECRET_ACCESS_KEY=your_production_secret_key
AWS_S3_BUCKET_NAME=your_production_bucket_name
AWS_S3_REGION=your_region
AWS_S3_ENDPOINT=https://s3.your_region.amazonaws.com

# Redis
REDIS_PASSWORD=secure_redis_password
REDIS_URL=redis://default:${REDIS_PASSWORD}@redis:6379/0

# Email
SMTP_TLS=true
SMTP_PORT=587
SMTP_HOST=smtp.production-email-service.com
SMTP_USER=your_prod_user
SMTP_PASSWORD=your_prod_password
EMAILS_FROM_EMAIL=info@example.com
EMAILS_FROM_NAME=DataCanvasDev

# Frontend URL (for emails, CORS)
FRONTEND_URL=https://www.datacanvasdev.com
```

Create a `.env.staging` file for staging environment:

```
# Application
APP_NAME=DataCanvasDev-Staging
APP_ENV=staging
APP_DEBUG=true
APP_HOST=0.0.0.0
APP_PORT=8000

# Database
DB_USER=postgres
DB_PASSWORD=secure_staging_password
DB_NAME=datacanvas_staging
DB_HOST=db
DB_PORT=5432
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}

# Security
SECRET_KEY=your_secure_staging_key_here
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
ALGORITHM=HS256
SALT_ROUNDS=12

# AWS S3
AWS_ACCESS_KEY_ID=your_staging_access_key
AWS_SECRET_ACCESS_KEY=your_staging_secret_key
AWS_S3_BUCKET_NAME=your_staging_bucket_name
AWS_S3_REGION=your_region
AWS_S3_ENDPOINT=https://s3.your_region.amazonaws.com

# Redis
REDIS_PASSWORD=secure_redis_password_staging
REDIS_URL=redis://default:${REDIS_PASSWORD}@redis:6379/0

# Email
SMTP_TLS=true
SMTP_PORT=587
SMTP_HOST=smtp.staging-email-service.com
SMTP_USER=your_staging_user
SMTP_PASSWORD=your_staging_password
EMAILS_FROM_EMAIL=staging@example.com
EMAILS_FROM_NAME=DataCanvasDev Staging

# Frontend URL (for emails, CORS)
FRONTEND_URL=https://staging.datacanvasdev.com
```

## Step 3: CI/CD Pipeline Setup

### GitHub Actions CI/CD Pipeline

Create `.github/workflows/ci-cd.yml`:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: datacanvas_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:7
        ports:
          - 6379:6379
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Lint
        run: npm run lint
      
      - name: Run tests
        run: npm test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/datacanvas_test
          REDIS_URL: redis://localhost:6379/0
          SECRET_KEY: test_secret_key
          NODE_ENV: test
      
      - name: Upload test coverage
        uses: actions/upload-artifact@v3
        with:
          name: coverage
          path: coverage/

  build:
    needs: test
    if: github.event_name == 'push'
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2
      
      - name: Login to DockerHub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}
      
      - name: Build and push Docker image
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: |
            yourusername/datacanvas-backend:latest
            yourusername/datacanvas-backend:${{ github.sha }}
          cache-from: type=registry,ref=yourusername/datacanvas-backend:buildcache
          cache-to: type=registry,ref=yourusername/datacanvas-backend:buildcache,mode=max

  deploy-staging:
    needs: build
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    environment: staging
    
    steps:
      - name: Deploy to staging
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.STAGING_SSH_HOST }}
          username: ${{ secrets.STAGING_SSH_USERNAME }}
          key: ${{ secrets.STAGING_SSH_KEY }}
          script: |
            cd /path/to/deployment
            docker-compose pull
            docker-compose -f docker-compose.prod.yml up -d
            docker image prune -af

  deploy-production:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production
    
    steps:
      - name: Deploy to production
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.PRODUCTION_SSH_HOST }}
          username: ${{ secrets.PRODUCTION_SSH_USERNAME }}
          key: ${{ secrets.PRODUCTION_SSH_KEY }}
          script: |
            cd /path/to/deployment
            docker-compose pull
            docker-compose -f docker-compose.prod.yml up -d
            docker image prune -af
```

## Step 4: Infrastructure Setup with AWS

### AWS Deployment Architecture

Create a deployment architecture document with the following components:

1. **EC2 Instances**: To host the containerized Express.js application
2. **RDS (PostgreSQL)**: For the database, instead of self-managed PostgreSQL
3. **ElastiCache (Redis)**: For caching, replacing the self-managed Redis
4. **S3**: For storing media assets and static files
5. **CloudFront**: As a CDN for optimized content delivery
6. **Route 53**: For DNS management
7. **CloudWatch**: For logging and monitoring
8. **ECR**: For private Docker image registry

### Terraform Infrastructure as Code

Create a `terraform` directory with basic AWS resources:

```terraform
# terraform/main.tf
provider "aws" {
  region = var.aws_region
}

resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true
  
  tags = {
    Name = "datacanvas-vpc"
  }
}

resource "aws_subnet" "public" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 1}.0/24"
  availability_zone = "${var.aws_region}${count.index == 0 ? "a" : "b"}"
  
  tags = {
    Name = "datacanvas-public-subnet-${count.index + 1}"
  }
}

resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 10}.0/24"
  availability_zone = "${var.aws_region}${count.index == 0 ? "a" : "b"}"
  
  tags = {
    Name = "datacanvas-private-subnet-${count.index + 1}"
  }
}

resource "aws_db_subnet_group" "main" {
  name       = "datacanvas-db-subnet-group"
  subnet_ids = aws_subnet.private[*].id
  
  tags = {
    Name = "DataCanvas DB Subnet Group"
  }
}

resource "aws_security_group" "db" {
  name        = "datacanvas-db-sg"
  description = "Security group for DataCanvas database"
  vpc_id      = aws_vpc.main.id
  
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = {
    Name = "datacanvas-db-sg"
  }
}

resource "aws_security_group" "app" {
  name        = "datacanvas-app-sg"
  description = "Security group for DataCanvas application"
  vpc_id      = aws_vpc.main.id
  
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.admin_cidr_block]
  }
  
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = {
    Name = "datacanvas-app-sg"
  }
}

resource "aws_db_instance" "main" {
  allocated_storage      = 20
  storage_type           = "gp2"
  engine                 = "postgres"
  engine_version         = "14"
  instance_class         = "db.t3.micro"
  db_name                = "datacanvas"
  username               = var.db_username
  password               = var.db_password
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.db.id]
  skip_final_snapshot    = true
  
  tags = {
    Name = "datacanvas-db"
  }
}

resource "aws_s3_bucket" "media" {
  bucket = "datacanvas-media-${var.environment}"
  
  tags = {
    Name        = "DataCanvas Media Bucket"
    Environment = var.environment
  }
}

resource "aws_s3_bucket_public_access_block" "media" {
  bucket = aws_s3_bucket.media.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_cloudfront_distribution" "media" {
  origin {
    domain_name = aws_s3_bucket.media.bucket_regional_domain_name
    origin_id   = "S3-${aws_s3_bucket.media.id}"
    
    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.media.cloudfront_access_identity_path
    }
  }
  
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  
  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.media.id}"
    
    forwarded_values {
      query_string = false
      
      cookies {
        forward = "none"
      }
    }
    
    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
  }
  
  price_class = "PriceClass_100"
  
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
  
  viewer_certificate {
    cloudfront_default_certificate = true
  }
  
  tags = {
    Name        = "DataCanvas Media CDN"
    Environment = var.environment
  }
}

resource "aws_cloudfront_origin_access_identity" "media" {
  comment = "DataCanvas Media S3 access"
}

resource "aws_elasticache_subnet_group" "main" {
  name       = "datacanvas-cache-subnet-group"
  subnet_ids = aws_subnet.private[*].id
}

resource "aws_elasticache_cluster" "main" {
  cluster_id           = "datacanvas-redis"
  engine               = "redis"
  node_type            = "cache.t3.micro"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  engine_version       = "7.0"
  port                 = 6379
  subnet_group_name    = aws_elasticache_subnet_group.main.name
  security_group_ids   = [aws_security_group.app.id]
}

resource "aws_ecr_repository" "app" {
  name                 = "datacanvas-backend"
  image_tag_mutability = "MUTABLE"
  
  image_scanning_configuration {
    scan_on_push = true
  }
}

# Variables file
# terraform/variables.tf
variable "aws_region" {
  description = "AWS region to deploy resources"
  default     = "us-east-1"
}

variable "environment" {
  description = "Deployment environment"
  default     = "production"
}

variable "admin_cidr_block" {
  description = "CIDR block for admin access"
  default     = "0.0.0.0/0"  # Restrict this in production!
}

variable "db_username" {
  description = "Database username"
  sensitive   = true
}

variable "db_password" {
  description = "Database password"
  sensitive   = true
}
```

## Step 5: Monitoring and Logging

### Application Monitoring

Create monitoring endpoints in your application:

1. Create a health check endpoint at `src/api/health/index.js`:

```javascript
const express = require('express');
const { sequelize } = require('../../db/models');
const redisClient = require('../../services/cacheService');

const router = express.Router();

// Health check endpoint
router.get('/', async (req, res) => {
  const healthCheck = {
    uptime: process.uptime(),
    timestamp: Date.now(),
    message: 'OK',
    services: {
      database: 'unknown',
      redis: 'unknown'
    }
  };

  try {
    // Check database connection
    await sequelize.authenticate();
    healthCheck.services.database = 'connected';
  } catch (error) {
    healthCheck.services.database = 'disconnected';
    healthCheck.message = 'ERROR';
  }

  try {
    // Check Redis connection
    if (redisClient && redisClient.isReady) {
      await redisClient.ping();
      healthCheck.services.redis = 'connected';
    } else {
      healthCheck.services.redis = 'not configured';
    }
  } catch (error) {
    healthCheck.services.redis = 'disconnected';
    healthCheck.message = 'ERROR';
  }

  // Send response based on service status
  const statusCode = healthCheck.message === 'OK' ? 200 : 503;
  res.status(statusCode).json(healthCheck);
});

// Detailed system information (admin only)
router.get('/system', /* adminAuthMiddleware, */ async (req, res) => {
  const systemInfo = {
    environment: process.env.NODE_ENV,
    nodejs: {
      version: process.version,
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      uptime: process.uptime()
    },
    timestamp: new Date().toISOString()
  };

  res.json(systemInfo);
});

module.exports = router;
```

2. Add this route to your `app.js`:

```javascript
// In app.js
const healthRoutes = require('./api/health');
// ...
app.use('/api/health', healthRoutes);
```

### Logging with Winston

Create a logging setup in `src/utils/logger.js`:

```javascript
const winston = require('winston');
const path = require('path');

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Define different transports based on environment
const transports = [];

// Always log to console
transports.push(
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.printf(
        info => `${info.timestamp} ${info.level}: ${info.message}`
      )
    ),
  })
);

// In production, also log to file
if (process.env.NODE_ENV === 'production') {
  // Create log directory if it doesn't exist
  const logDir = path.join(process.cwd(), 'logs');
  
  // Add file transports
  transports.push(
    new winston.transports.File({ 
      filename: path.join(logDir, 'error.log'), 
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),
    new winston.transports.File({ 
      filename: path.join(logDir, 'combined.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    })
  );
}

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports,
  exitOnError: false,
});

// Create a stream object for Morgan integration
logger.stream = {
  write: (message) => logger.info(message.trim()),
};

module.exports = logger;
```

### AWS CloudWatch Integration

Create a CloudWatch setup in `src/utils/cloudwatch.js`:

```javascript
const AWS = require('aws-sdk');
const winston = require('winston');
const WinstonCloudWatch = require('winston-cloudwatch');

// Only add CloudWatch transport in production
if (process.env.NODE_ENV === 'production') {
  // Configure AWS credentials
  AWS.config.update({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: new AWS.Credentials({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }),
  });

  // Get the logger instance
  const logger = require('./logger');

  // Create log group name based on environment
  const logGroupName = `datacanvas-backend-${process.env.APP_ENV || 'production'}`;

  // Add CloudWatch transport
  logger.add(new WinstonCloudWatch({
    logGroupName,
    logStreamName: `${logGroupName}-${new Date().toISOString().split('T')[0]}`,
    awsRegion: process.env.AWS_REGION || 'us-east-1',
    messageFormatter: ({ level, message, timestamp }) => {
      return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    },
  }));
}
```

### Error Tracking with Sentry

Install Sentry:

```bash
npm install @sentry/node @sentry/tracing
```

Configure Sentry in `src/utils/sentry.js`:

```javascript
const Sentry = require('@sentry/node');
const { ProfilingIntegration } = require('@sentry/profiling-node');

// Only initialize Sentry in production and staging
if (['production', 'staging'].includes(process.env.NODE_ENV)) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.APP_ENV || 'production',
    integrations: [
      new ProfilingIntegration(),
    ],
    tracesSampleRate: 1.0,
    profilesSampleRate: 1.0,
  });
}

module.exports = Sentry;
```

## Step 6: Deployment Checklist

### Pre-Deployment Checklist

Create a `deployment-checklist.md` file:

```markdown
# Deployment Checklist

## Security
- [ ] All environment variables are properly set
- [ ] Database credentials are secure
- [ ] JWT secret key is unique and secure
- [ ] CORS is properly configured
- [ ] Rate limiting is properly configured
- [ ] Helmet middleware is enabled
- [ ] No sensitive information in logs
- [ ] Database connections are restricted to app servers
- [ ] S3 bucket has proper access controls

## Database
- [ ] Run migrations
- [ ] Verify database indexes
- [ ] Seed essential data

## Application
- [ ] Run tests
- [ ] Verify that the build completes successfully
- [ ] Ensure proper logging is configured
- [ ] Verify health check endpoints
- [ ] Setup monitoring alerts

## Infrastructure
- [ ] Backup strategy is in place
- [ ] Scaling strategy is defined
- [ ] CDN is properly configured 
- [ ] Load balancer is set up (for high availability)
- [ ] Firewall rules are properly configured
- [ ] SSL certificates are valid and installed

## Post-Deployment Verification
- [ ] Verify API endpoints functionality
- [ ] Check database connectivity
- [ ] Verify caching operations
- [ ] Test file uploads
- [ ] Ensure email sending works
- [ ] Monitor initial logs for any errors
```

### Deployment Script

Create a `scripts/deploy.sh` script:

```bash
#!/bin/bash

# Deployment script for DataCanvasDev backend

# Exit on error
set -e

# Check environment argument
ENV=$1
if [ -z "$ENV" ]; then
  echo "Usage: $0 <environment> (staging|production)"
  exit 1
fi

# Validate environment
if [ "$ENV" != "staging" ] && [ "$ENV" != "production" ]; then
  echo "Invalid environment. Use 'staging' or 'production'."
  exit 1
fi

# Load appropriate env file
ENV_FILE=".env.$ENV"
if [ ! -f "$ENV_FILE" ]; then
  echo "Environment file $ENV_FILE not found!"
  exit 1
fi

echo "Deploying to $ENV environment..."

# Build Docker image
echo "Building Docker image..."
docker build -t datacanvas-backend:$ENV .

# Tag Docker image
echo "Tagging Docker image..."
docker tag datacanvas-backend:$ENV yourusername/datacanvas-backend:$ENV

# Push Docker image
echo "Pushing Docker image..."
docker push yourusername/datacanvas-backend:$ENV

# If deploying locally
if [ "$2" == "local" ]; then
  echo "Starting containers locally..."
  docker-compose -f docker-compose.prod.yml --env-file $ENV_FILE up -d
  exit 0
fi

# For remote deployment via SSH (uncomment and configure)
# SSH_HOST="your_ssh_host"
# SSH_USER="your_ssh_user"
# SSH_KEY="path/to/your/key"
# REMOTE_DIR="/path/to/deployment"
# 
# echo "Deploying to remote server..."
# 
# # Copy necessary files
# scp -i $SSH_KEY docker-compose.prod.yml $ENV_FILE $SSH_USER@$SSH_HOST:$REMOTE_DIR/
# 
# # Execute remote commands
# ssh -i $SSH_KEY $SSH_USER@$SSH_HOST "cd $REMOTE_DIR && \
#   docker pull yourusername/datacanvas-backend:$ENV && \
#   docker-compose -f docker-compose.prod.yml --env-file $ENV_FILE down && \
#   docker-compose -f docker-compose.prod.yml --env-file $ENV_FILE up -d && \
#   docker system prune -af"

echo "Deployment completed successfully!"
```

Make the script executable:

```bash
chmod +x scripts/deploy.sh
```

## Step 7: Production Launch Considerations

### Performance Optimization

1. **Enable GZIP Compression**: Ensure compression middleware is properly configured.
2. **Database Optimization**: Set up database indexes and optimize queries.
3. **Redis Caching**: Implement caching for frequently accessed data.
4. **Load Balancing**: Set up load balancing for high availability.
5. **Horizontal Scaling**: Deploy multiple instances behind a load balancer.

### Security Hardening

1. **Regular Security Audits**: Schedule regular security audits.
2. **Vulnerability Scanning**: Set up automated vulnerability scanning.
3. **Secret Rotation**: Implement a strategy for rotating secrets.
4. **DDoS Protection**: Configure DDoS protection (e.g., AWS Shield).
5. **Request Validation**: Ensure all API requests are validated.

### Backup Strategy

1. **Database Backups**: Set up automated database backups.
2. **S3 Bucket Versioning**: Enable versioning for S3 buckets.
3. **Disaster Recovery Plan**: Document a disaster recovery plan.
4. **Backup Testing**: Regularly test backup restoration.

### Monitoring and Alerting

1. **Error Rate Monitoring**: Set up alerts for increased error rates.
2. **Performance Monitoring**: Monitor API response times.
3. **Resource Utilization**: Monitor CPU, memory, and disk usage.
4. **Database Performance**: Monitor database queries and performance.
5. **Custom Dashboard**: Create a custom monitoring dashboard.

### Documentation

1. **API Documentation**: Ensure API documentation is up to date.
2. **Deployment Documentation**: Document the deployment process.
3. **Troubleshooting Guide**: Create a troubleshooting guide.
4. **Infrastructure Documentation**: Document the infrastructure setup.
