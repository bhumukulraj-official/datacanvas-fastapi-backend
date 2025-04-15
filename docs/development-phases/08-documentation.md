# Phase 8: Documentation

In this phase, we'll create comprehensive documentation for our DataCanvasDev API. Good documentation is essential for developers who will use the API, as well as for maintainers of the codebase.

## Step 1: Setting Up OpenAPI Documentation

Let's set up Swagger/OpenAPI documentation for our Express.js API using swagger-jsdoc and swagger-ui-express:

```bash
npm install --save swagger-jsdoc swagger-ui-express
```

Now, let's create a configuration file for Swagger in `src/docs/swagger.js`:

```javascript
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'DataCanvasDev API',
      version: '1.0.0',
      description: `
        DataCanvasDev API - A professional portfolio and content management system for freelance web development and data science services.
        
        ## Features
        
        * **Authentication** - Secure JWT authentication with refresh token rotation
        * **Portfolio Projects** - Manage and showcase professional portfolio projects
        * **Article Publications** - Create and publish blog articles
        * **Professional Services** - Define and promote service offerings
        * **Client Inquiries** - Handle client inquiries and contact form submissions
        * **Newsletter Management** - Manage newsletter subscribers
        * **Digital Asset Management** - Upload and manage media assets
        * **Site Configuration** - Customize site settings
        
        ## Authentication
        
        All protected endpoints require an OAuth2 bearer token. To obtain a token, use the \`/api/authentication/login\` endpoint.
      `,
      license: {
        name: 'Proprietary',
        url: 'https://datacanvasdev.com/license/',
      },
      contact: {
        name: 'DataCanvasDev Support',
        url: 'https://datacanvasdev.com/contact/',
        email: 'support@datacanvasdev.com',
      },
    },
    servers: [
      {
        url: '/api',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'Endpoints for user authentication and token management',
      },
      {
        name: 'Portfolio Projects',
        description: 'Endpoints for managing portfolio projects',
      },
      {
        name: 'Articles',
        description: 'Endpoints for managing article publications',
      },
      {
        name: 'Services',
        description: 'Endpoints for managing professional services',
      },
      {
        name: 'Expertise',
        description: 'Endpoints for managing professional expertise',
      },
      {
        name: 'Client Inquiries',
        description: 'Endpoints for handling client inquiries',
      },
      {
        name: 'Newsletter',
        description: 'Endpoints for managing newsletter subscriptions',
      },
      {
        name: 'Digital Assets',
        description: 'Endpoints for managing digital assets (images, documents)',
      },
      {
        name: 'Site Configuration',
        description: 'Endpoints for managing site configuration',
      },
    ],
  },
  apis: ['./src/api/*/*.js', './src/api/*/index.js'], // Path to the API routes
};

const specs = swaggerJsdoc(options);

module.exports = specs;
```

Then update `src/app.js` to include the Swagger documentation:

```javascript
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./docs/swagger');

// ... other imports

const app = express();

// ... middleware setup

// Swagger documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));
app.get('/api/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpecs);
});

// ... API routes
```

## Step 2: Enhance Endpoint Documentation

Let's improve the documentation for one of our key endpoints to serve as an example. Update the portfolio projects endpoints in `src/api/portfolio/index.js`:

```javascript
/**
 * @swagger
 * /portfolio-projects:
 *   get:
 *     summary: Retrieve published portfolio projects
 *     description: |
 *       Returns a list of published portfolio projects.
 *       Results can be filtered by category and featured status.
 *     tags: [Portfolio Projects]
 *     parameters:
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of records to skip for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Maximum number of records to return
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter projects by category ID
 *       - in: query
 *         name: featuredOnly
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Filter for featured projects only
 *     responses:
 *       200:
 *         description: A paginated list of portfolio projects
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PortfolioProjectList'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *       500:
 *         description: Server error
 */
router.get('/', async (req, res, next) => {
  try {
    const { skip = 0, limit = 10, categoryId, featuredOnly = false } = req.query;
    
    const projects = await portfolioService.getProjects({
      skip: parseInt(skip, 10),
      limit: parseInt(limit, 10),
      categoryId,
      featuredOnly: featuredOnly === 'true'
    });
    
    return res.json(projects);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /portfolio-projects/{projectId}:
 *   get:
 *     summary: Get a specific portfolio project
 *     description: Retrieves detailed information about a specific portfolio project
 *     tags: [Portfolio Projects]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the portfolio project
 *     responses:
 *       200:
 *         description: Portfolio project details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PortfolioProjectDetail'
 *       404:
 *         description: Project not found
 *       500:
 *         description: Server error
 */
router.get('/:projectId', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = await portfolioService.getProjectById(projectId);
    return res.json(project);
  } catch (error) {
    if (error.message === 'Portfolio project not found') {
      return res.status(404).json({ message: error.message });
    }
    next(error);
  }
});
```

## Step 3: Define Schema Components

Create component schemas to document the data models in `src/docs/schema-components.js`:

```javascript
/**
 * @swagger
 * components:
 *   schemas:
 *     PortfolioProjectList:
 *       type: object
 *       properties:
 *         projectId:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the project
 *         projectTitle:
 *           type: string
 *           description: Title of the project
 *         projectSlug:
 *           type: string
 *           description: URL-friendly slug for the project
 *         projectDescription:
 *           type: string
 *           description: Summary description of the project
 *         completionDate:
 *           type: string
 *           format: date
 *           nullable: true
 *           description: Date the project was completed
 *         isFeatured:
 *           type: boolean
 *           description: Whether the project is featured
 *         thumbnailImage:
 *           type: string
 *           description: URL of the project thumbnail image
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *         categories:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Category'
 *           description: Categories associated with the project
 *
 *     PortfolioProjectDetail:
 *       allOf:
 *         - $ref: '#/components/schemas/PortfolioProjectList'
 *         - type: object
 *           properties:
 *             publicationStatus:
 *               type: string
 *               enum: [draft, published, archived]
 *               description: Publication status of the project
 *             projectOutcomes:
 *               type: object
 *               nullable: true
 *               description: Outcomes and results of the project
 *             businessImpact:
 *               type: string
 *               nullable: true
 *               description: Business impact of the project
 *             implementationApproach:
 *               type: object
 *               nullable: true
 *               description: Technical implementation details
 *             technicalExpertise:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TechnicalExpertise'
 *               description: Technical skills used in the project
 *             testimonials:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Testimonial'
 *               description: Client testimonials related to the project
 *
 *     Category:
 *       type: object
 *       properties:
 *         categoryId:
 *           type: string
 *           format: uuid
 *         categoryName:
 *           type: string
 *         categorySlug:
 *           type: string
 *         categoryType:
 *           type: string
 *           enum: [project, article, service, expertise]
 *
 *     TechnicalExpertise:
 *       type: object
 *       properties:
 *         expertiseId:
 *           type: string
 *           format: uuid
 *         expertiseName:
 *           type: string
 *         expertiseSlug:
 *           type: string
 *         iconIdentifier:
 *           type: string
 *           nullable: true
 *
 *     Testimonial:
 *       type: object
 *       properties:
 *         testimonialId:
 *           type: string
 *           format: uuid
 *         clientName:
 *           type: string
 *         clientCompany:
 *           type: string
 *         testimonialContent:
 *           type: string
 *         satisfactionRating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         isFeatured:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 */
```

## Step 4: Add Tags to Organize API Documentation

Update `app/api/v1/api.py` to add tags for organizing the API documentation:

```python
from fastapi import APIRouter

from app.api.v1.endpoints import (
    authentication,
    portfolios,
    articles,
    services,
    expertise,
    inquiries,
    newsletter,
    assets,
    configuration,
    webhooks
)

api_router = APIRouter()

api_router.include_router(
    authentication.router, 
    prefix="/auth", 
    tags=["Authentication"],
    responses={401: {"description": "Unauthorized"}}
)
api_router.include_router(
    portfolios.router, 
    prefix="/portfolio-projects", 
    tags=["Portfolio Projects"],
    responses={404: {"description": "Project not found"}}
)
api_router.include_router(
    articles.router, 
    prefix="/articles", 
    tags=["Article Publications"],
    responses={404: {"description": "Article not found"}}
)
api_router.include_router(
    services.router, 
    prefix="/services", 
    tags=["Professional Services"],
    responses={404: {"description": "Service not found"}}
)
api_router.include_router(
    expertise.router, 
    prefix="/expertise", 
    tags=["Professional Expertise"],
    responses={404: {"description": "Expertise not found"}}
)
api_router.include_router(
    inquiries.router, 
    prefix="/client-inquiries", 
    tags=["Client Inquiries"],
    responses={404: {"description": "Inquiry not found"}}
)
api_router.include_router(
    newsletter.router, 
    prefix="/newsletter", 
    tags=["Newsletter"],
    responses={400: {"description": "Invalid request"}}
)
api_router.include_router(
    assets.router, 
    prefix="/digital-assets", 
    tags=["Digital Assets"],
    responses={404: {"description": "Asset not found"}}
)
api_router.include_router(
    configuration.router, 
    prefix="/site-configuration", 
    tags=["Site Configuration"],
    responses={404: {"description": "Configuration not found"}}
)
api_router.include_router(
    webhooks.router, 
    prefix="/webhooks", 
    tags=["Webhooks"],
    responses={401: {"description": "Unauthorized"}}
)
```

## Step 5: Enhance Pydantic Model Documentation

Update the Pydantic models to include better documentation. For example, in `app/schemas/portfolio.py`:

```python
class PortfolioProjectBase(BaseModel):
    """Base model for portfolio project data."""
    projectTitle: str = Field(
        ..., 
        description="Title of the portfolio project",
        example="E-commerce Website"
    )
    projectDescription: str = Field(
        ..., 
        description="Detailed description of the project",
        example="A modern e-commerce platform built with React and Node.js"
    )
    completionDate: Optional[date] = Field(
        None, 
        description="Date when the project was completed",
        example="2023-01-15"
    )
    isFeatured: bool = Field(
        False, 
        description="Whether the project should be featured on the homepage",
        example=True
    )
    thumbnailImage: str = Field(
        ..., 
        description="URL to the project thumbnail image",
        example="https://example.com/images/project1.jpg"
    )
    projectOutcomes: Optional[Dict[str, Any]] = Field(
        None, 
        description="JSON object describing project outcomes",
        example={
            "users": 10000,
            "conversionRate": "5.2%",
            "revenue": "$500,000"
        }
    )
    businessImpact: Optional[str] = Field(
        None, 
        description="Description of the business impact",
        example="Increased client's revenue by 35% in the first quarter"
    )
    implementationApproach: Optional[Dict[str, Any]] = Field(
        None, 
        description="JSON object describing implementation approach",
        example={
            "methodology": "Agile",
            "teamSize": 5,
            "duration": "3 months"
        }
    )
```

Apply this pattern to all your schema models to provide detailed information.

## Step 6: Generate Static OpenAPI Documentation

Create a script to generate static OpenAPI documentation in `scripts/generate_openapi_docs.py`:

```python
#!/usr/bin/env python
import json
import os
from pathlib import Path

from app.main import app

# Ensure the docs directory exists
docs_dir = Path("docs/api")
docs_dir.mkdir(parents=True, exist_ok=True)

# Generate OpenAPI schema
openapi_schema = app.openapi()

# Write the schema to a file
with open(docs_dir / "openapi.json", "w") as f:
    json.dump(openapi_schema, f, indent=2)

print(f"OpenAPI schema written to {docs_dir}/openapi.json")

# Generate Markdown documentation
try:
    import yaml
    from openapi_to_md.converter import convert_openapi_to_markdown
    
    # Convert to YAML for the converter
    with open(docs_dir / "openapi.yaml", "w") as f:
        yaml.dump(openapi_schema, f)
    
    # Convert to Markdown
    convert_openapi_to_markdown(
        str(docs_dir / "openapi.yaml"),
        str(docs_dir / "api_documentation.md")
    )
    
    print(f"Markdown documentation written to {docs_dir}/api_documentation.md")
except ImportError:
    print("To generate Markdown documentation, install the required package:")
    print("pip install openapi-to-md")
```

## Step 7: Create API Usage Examples

Create a dedicated examples directory in `docs/examples` with usage examples for each major endpoint:

### Authentication Example (`docs/examples/authentication.md`):

```markdown
# Authentication Examples

## Login

```bash
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin@example.com&password=adminpassword"
```

Response:

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "bearer"
}
```

## Refresh Token

```bash
curl -X POST "http://localhost:8000/api/auth/refresh-token" \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}'
```

Response:

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "bearer"
}
```

## Logout

```bash
curl -X POST "http://localhost:8000/api/auth/logout" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}'
```

Response:

```json
{
  "success": true
}
```
```

Create similar examples for each endpoint group (Portfolio Projects, Articles, Services, etc.).

## Step 8: Create Project README

Update the main `README.md` file to provide an overview of the project:

```markdown
# DataCanvasDev Backend API

A Node.js/Express.js backend for the DataCanvasDev platform - a portfolio and content management system for freelance web development and data science services.

## Features

- **Authentication** - Secure JWT authentication with refresh token rotation
- **Portfolio Projects** - Manage and showcase professional portfolio projects
- **Article Publications** - Create and publish blog articles
- **Professional Services** - Define and promote service offerings
- **Client Inquiries** - Handle client inquiries through a contact form
- **Newsletter Management** - Manage newsletter subscribers
- **Digital Asset Management** - Upload and manage media assets
- **Site Configuration** - Customize site settings

## Tech Stack

- **Node.js:** Runtime environment
- **Express.js:** Modern, high-performance web framework
- **PostgreSQL:** Robust relational database
- **Sequelize:** ORM for database operations
- **Redis:** For caching and background tasks
- **AWS S3:** For media storage
- **JWT:** For secure authentication

## Installation

### Prerequisites

- Node.js (v18+)
- PostgreSQL (v14+)
- Redis (optional, for caching)

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/datacanvas-backend.git
cd datacanvas-backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit the .env file with your configuration
# ...

# Run database migrations
npm run migrate

# Seed the database with initial data
npm run seed

# Start the development server
npm run dev
```

## API Documentation

- **OpenAPI Documentation:** `/api/docs`
- **ReDoc Alternative:** `/api/redoc`
- **OpenAPI JSON Schema:** `/api/openapi.json`

## Testing

Run tests with pytest:

```bash
# Install development dependencies
pip install -r requirements-dev.txt

# Run all tests
pytest

# Run tests with coverage
pytest --cov=app
```

## Code Quality

We use several tools to maintain code quality:

- **Black:** Code formatting
- **isort:** Import sorting
- **Flake8:** Linting
- **Mypy:** Type checking

Run the quality checks with:

```bash
# Install development dependencies
pip install -r requirements-dev.txt

# Run all checks
make lint

# Format code
make format
```

## Deployment

See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed deployment instructions.

## License

Proprietary - All rights reserved

## Contact

For questions or support, please contact [support@datacanvasdev.com](mailto:support@datacanvasdev.com)
```

## Step 9: Create Detailed Deployment Documentation

Create a dedicated deployment guide in `docs/DEPLOYMENT.md`:

```markdown
# Deployment Guide

This guide explains how to deploy the DataCanvasDev backend API to production environments.

## Prerequisites

- A Linux server (Ubuntu 20.04+ recommended)
- Docker and Docker Compose
- Domain name with DNS properly configured
- SSL certificate

## Production Deployment with Docker

### 1. Prepare the Server

Update and install basic requirements:

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y docker.io docker-compose nginx certbot python3-certbot-nginx
```

Enable and start Docker:

```bash
sudo systemctl enable docker
sudo systemctl start docker
```

### 2. Clone the Repository

```bash
git clone https://github.com/yourusername/datacanvas-backend.git
cd datacanvas-backend
```

### 3. Configure Environment Variables

Create a production environment file:

```bash
cp .env.example .env.prod
```

Edit `.env.prod` with your production settings:
- Set `ENVIRONMENT=production`
- Configure database credentials
- Set up your JWT secrets
- Configure email settings
- Set up AWS credentials for S3
- Configure Redis settings

### 4. Set Up SSL Certificate

```bash
sudo certbot --nginx -d api.yourdomain.com
```

### 5. Configure Nginx

Create an Nginx configuration file:

```bash
sudo nano /etc/nginx/sites-available/datacanvas-api
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;
    
    # Redirect all HTTP to HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name api.yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384;
    ssl_session_timeout 10m;
    ssl_session_cache shared:SSL:10m;
    ssl_session_tickets off;
    ssl_stapling on;
    ssl_stapling_verify on;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Proxy settings
    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Activate the configuration:

```bash
sudo ln -s /etc/nginx/sites-available/datacanvas-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 6. Launch with Docker Compose

Create a production Docker Compose file:

```yaml
version: '3.8'

services:
  api:
    build: 
      context: .
      dockerfile: docker/Dockerfile
    restart: always
    ports:
      - "8000:8000"
    env_file:
      - .env.prod
    volumes:
      - ./app:/app/app
    depends_on:
      - db
      - redis
    command: >
      sh -c "alembic upgrade head &&
             gunicorn app.main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000"

  db:
    image: postgres:14-alpine
    restart: always
    volumes:
      - postgres_data:/var/lib/postgresql/data/
    env_file:
      - .env.prod
    ports:
      - "5432:5432"

  redis:
    image: redis:alpine
    restart: always
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"

  celery_worker:
    build:
      context: .
      dockerfile: docker/Dockerfile
    restart: always
    env_file:
      - .env.prod
    depends_on:
      - db
      - redis
    command: celery -A app.tasks.worker worker --loglevel=info

  celery_beat:
    build:
      context: .
      dockerfile: docker/Dockerfile
    restart: always
    env_file:
      - .env.prod
    depends_on:
      - db
      - redis
    command: celery -A app.tasks.worker beat --loglevel=info

volumes:
  postgres_data:
  redis_data:
```

Start the services:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### 7. Initial Database Setup

Run the initialization script:

```bash
docker-compose -f docker-compose.prod.yml exec api python -m scripts.init_db
```

### 8. Monitoring and Logs

View logs:

```bash
docker-compose -f docker-compose.prod.yml logs -f
```

### 9. Backup Strategy

Create a backup script in `scripts/backup.sh`:

```bash
#!/bin/bash

# Backup variables
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/var/backups/datacanvas"
DB_CONTAINER="datacanvas-backend_db_1"
DB_NAME="datacanvas"
DB_USER="postgres"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Database backup
echo "Starting database backup..."
docker exec $DB_CONTAINER pg_dump -U $DB_USER -d $DB_NAME -F c -f /tmp/db_backup_$TIMESTAMP.dump
docker cp $DB_CONTAINER:/tmp/db_backup_$TIMESTAMP.dump $BACKUP_DIR/
docker exec $DB_CONTAINER rm /tmp/db_backup_$TIMESTAMP.dump

# S3 assets backup (if needed, set up AWS CLI in the container)
echo "Starting S3 backup..."
aws s3 sync s3://your-bucket-name $BACKUP_DIR/s3_backup_$TIMESTAMP

# Compress backups
echo "Compressing backups..."
tar -czf $BACKUP_DIR/backup_$TIMESTAMP.tar.gz -C $BACKUP_DIR db_backup_$TIMESTAMP.dump $BACKUP_DIR/s3_backup_$TIMESTAMP

# Clean up temporary files
rm $BACKUP_DIR/db_backup_$TIMESTAMP.dump
rm -rf $BACKUP_DIR/s3_backup_$TIMESTAMP

# Keep only the last 7 backups
echo "Cleaning old backups..."
ls -tp $BACKUP_DIR/backup_*.tar.gz | grep -v '/$' | tail -n +8 | xargs -I {} rm -- {}

echo "Backup completed: $BACKUP_DIR/backup_$TIMESTAMP.tar.gz"
```

Add this script to your crontab to run daily:

```bash
0 2 * * * /path/to/datacanvas-backend/scripts/backup.sh
```

## Troubleshooting

### Common Issues

1. **Database Connection Errors**:
   - Check database credentials in .env.prod
   - Ensure the database service is running

2. **Permission Issues**:
   - Check file permissions for mounted volumes
   - Ensure the application has write access to necessary directories

3. **API Not Reachable**:
   - Check Nginx configuration
   - Verify firewall settings
   - Ensure Docker containers are running

For more help, refer to the logs or contact the development team.
```

## Step 10: Create API Client Examples

Create examples for common programming languages in `docs/examples/client-examples`:

### Python Client Example (`docs/examples/client-examples/python_client.py`):

```python
"""
DataCanvasDev API - Python Client Example

This script demonstrates how to interact with the DataCanvasDev API
using Python and the requests library.
"""

import requests

# API Base URL
BASE_URL = "https://api.datacanvasdev.com/api"

# Authentication
def login(email, password):
    """Authenticate with the API and return tokens."""
    response = requests.post(
        f"{BASE_URL}/auth/login",
        data={"username": email, "password": password}
    )
    response.raise_for_status()
    return response.json()

# Get portfolio projects
def get_portfolio_projects(token):
    """Retrieve portfolio projects."""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(
        f"{BASE_URL}/portfolio-projects",
        headers=headers
    )
    response.raise_for_status()
    return response.json()

# Create a portfolio project
def create_portfolio_project(token, project_data):
    """Create a new portfolio project."""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.post(
        f"{BASE_URL}/portfolio-projects",
        headers=headers,
        json=project_data
    )
    response.raise_for_status()
    return response.json()

# Usage example
if __name__ == "__main__":
    # Authenticate
    auth_data = login("admin@example.com", "password")
    access_token = auth_data["accessToken"]
    
    # Get portfolio projects
    projects = get_portfolio_projects(access_token)
    print(f"Found {len(projects)} projects:")
    for project in projects:
        print(f" - {project['projectTitle']}")
    
    # Create a new project
    new_project = {
        "projectTitle": "New Project",
        "projectDescription": "A new project created via API",
        "thumbnailImage": "https://example.com/image.jpg",
        "publicationStatus": "draft",
        "categories": ["3fa85f64-5717-4562-b3fc-2c963f66afa6"]
    }
    
    created_project = create_portfolio_project(access_token, new_project)
    print(f"Created project: {created_project['projectTitle']}")
```

Create similar examples for JavaScript, TypeScript, and other languages as needed.

## Step 11: Document Database Schema

Create a database schema documentation file in `docs/database_schema.md`:

```markdown
# Database Schema Documentation

This document provides detailed information about the database schema for the DataCanvasDev application.

## Entity Relationship Diagram

![Entity Relationship Diagram](./diagrams/erd.png)

## Tables

### ProfessionalAccounts

Stores information about professional users of the system.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| accountId | UUID | Primary key | NOT NULL |
| username | VARCHAR | Username for login | NOT NULL, UNIQUE |
| emailAddress | VARCHAR | Email address | NOT NULL, UNIQUE |
| passwordHash | VARCHAR | Hashed password | NOT NULL |
| accountRole | ENUM | User role (admin, user) | NOT NULL, DEFAULT 'user' |
| professionalBio | TEXT | Professional biography | NULL |
| profileImage | VARCHAR | Profile image URL | NULL |
| socialMediaProfiles | JSONB | Social media links | NULL |
| isAccountActive | BOOLEAN | Account status | NOT NULL, DEFAULT true |
| lastLoginTime | TIMESTAMP | Last successful login | NULL |
| createdAt | TIMESTAMP | Creation timestamp | NOT NULL |
| updatedAt | TIMESTAMP | Update timestamp | NOT NULL |

### PortfolioProjects

Stores professional portfolio projects.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| projectId | UUID | Primary key | NOT NULL |
| accountId | UUID | Owner account ID | NOT NULL, FK |
| projectTitle | VARCHAR | Project title | NOT NULL |
| projectSlug | VARCHAR | URL-friendly identifier | NOT NULL, UNIQUE |
| projectDescription | TEXT | Project description | NOT NULL |
| completionDate | DATE | Project completion date | NULL |
| isFeatured | BOOLEAN | Featured status | NOT NULL, DEFAULT false |
| thumbnailImage | VARCHAR | Thumbnail image URL | NOT NULL |
| publicationStatus | ENUM | Status (draft, published, archived) | NOT NULL, DEFAULT 'draft' |
| projectOutcomes | JSONB | Project outcomes | NULL |
| businessImpact | TEXT | Business impact description | NULL |
| implementationApproach | JSONB | Implementation approach | NULL |
| createdAt | TIMESTAMP | Creation timestamp | NOT NULL |
| updatedAt | TIMESTAMP | Update timestamp | NOT NULL |

(Continue documenting all tables...)

## Triggers

### update_timestamp

Updates the `updatedAt` column whenever a record is modified.

```sql
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updatedAt = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### calculate_category_depth

Automatically calculates the hierarchy level of categories.

```sql
CREATE OR REPLACE FUNCTION calculate_category_depth()
RETURNS TRIGGER AS $$
DECLARE
    parent_depth integer;
BEGIN
    IF NEW.parentCategoryId IS NULL THEN
        NEW.hierarchyLevel = 0;
    ELSE
        SELECT hierarchyLevel INTO parent_depth FROM content_categories WHERE categoryId = NEW.parentCategoryId;
        NEW.hierarchyLevel = parent_depth + 1;
        
        -- Check for circular references
        IF NEW.hierarchyLevel > 10 THEN
            RAISE EXCEPTION 'Category depth limit exceeded - possible circular reference';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

(Document all database triggers...)

## Indexes

| Table | Index Name | Columns | Type | Description |
|-------|------------|---------|------|-------------|
| professional_accounts | idx_username | username | BTREE, UNIQUE | Fast lookup by username |
| professional_accounts | idx_email_address | emailAddress | BTREE, UNIQUE | Fast lookup by email |
| professional_accounts | idx_account_role | accountRole | BTREE | Filter by role |
| portfolio_projects | idx_project_slug | projectSlug | BTREE, UNIQUE | Fast lookup by slug |
| portfolio_projects | idx_account_id | accountId | BTREE | Filter by owner |
| portfolio_projects | idx_publication_status | publicationStatus | BTREE | Filter by status |
| portfolio_projects | idx_featured | isFeatured | BTREE | Filter by featured status |

(Document all relevant indexes...)
```

This completes the documentation phase for our DataCanvasDev application. With comprehensive documentation in place, developers will be able to understand, use, and maintain the API effectively.

In the next phase, we'll focus on deployment strategies to take our application to production. 