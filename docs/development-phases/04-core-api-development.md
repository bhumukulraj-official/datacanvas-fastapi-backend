# Phase 4: Core API Development

In this phase, we'll implement the core API endpoints for our DataCanvasDev application. We'll create endpoints for portfolio projects, articles, professional services, and other essential features.

## Step 1: Implementing Validation Schemas

Let's start by implementing the validation schemas for our API requests and responses. We'll begin with the portfolio project schemas in `src/utils/validationSchemas.js`:

```javascript
const Joi = require('joi');
const { v4: uuidv4 } = require('uuid');

// Portfolio Projects Validation Schemas
const portfolioProjectSchema = {
  create: Joi.object({
    projectTitle: Joi.string().required().min(3).max(100),
    projectDescription: Joi.string().required().min(10),
    completionDate: Joi.date().allow(null),
    isFeatured: Joi.boolean().default(false),
    thumbnailImage: Joi.string().required(),
    publicationStatus: Joi.string().valid('draft', 'published', 'archived').default('draft'),
    categories: Joi.array().items(Joi.string().guid({version: 'uuidv4'})).min(1).required(),
    technologies: Joi.array().items(Joi.string().guid({version: 'uuidv4'})).default([]),
    projectOutcomes: Joi.object().allow(null),
    businessImpact: Joi.string().allow(null, ''),
    implementationApproach: Joi.object().allow(null)
  }),

  update: Joi.object({
    projectTitle: Joi.string().min(3).max(100),
    projectDescription: Joi.string().min(10),
    completionDate: Joi.date().allow(null),
    isFeatured: Joi.boolean(),
    thumbnailImage: Joi.string(),
    publicationStatus: Joi.string().valid('draft', 'published', 'archived'),
    categories: Joi.array().items(Joi.string().guid({version: 'uuidv4'})).min(1),
    technologies: Joi.array().items(Joi.string().guid({version: 'uuidv4'})),
    projectOutcomes: Joi.object().allow(null),
    businessImpact: Joi.string().allow(null, ''),
    implementationApproach: Joi.object().allow(null)
  }).min(1)
};

// Article Validation Schemas
const articleSchema = {
  create: Joi.object({
    articleTitle: Joi.string().required().min(3).max(200),
    articleContent: Joi.string().required().min(10),
    articleSummary: Joi.string().required().min(10).max(500),
    featuredImage: Joi.string().required(),
    publicationStatus: Joi.string().valid('draft', 'published', 'archived').default('draft'),
    categories: Joi.array().items(Joi.string().guid({version: 'uuidv4'})).min(1).required(),
    tags: Joi.array().items(Joi.string().guid({version: 'uuidv4'})).default([])
  }),

  update: Joi.object({
    articleTitle: Joi.string().min(3).max(200),
    articleContent: Joi.string().min(10),
    articleSummary: Joi.string().min(10).max(500),
    featuredImage: Joi.string(),
    publicationStatus: Joi.string().valid('draft', 'published', 'archived'),
    categories: Joi.array().items(Joi.string().guid({version: 'uuidv4'})).min(1),
    tags: Joi.array().items(Joi.string().guid({version: 'uuidv4'}))
  }).min(1)
};

// Service Validation Schemas
const serviceSchema = {
  create: Joi.object({
    serviceTitle: Joi.string().required().min(3).max(100),
    serviceDescription: Joi.string().required().min(10),
    serviceOverview: Joi.string().required().min(10),
    priceRange: Joi.string().required(),
    serviceFeatures: Joi.array().items(Joi.object({
      title: Joi.string().required(),
      description: Joi.string().required()
    })).required().min(1),
    isFeatured: Joi.boolean().default(false),
    serviceIcon: Joi.string().required(),
    serviceStatus: Joi.string().valid('active', 'inactive', 'archived').default('active'),
    categoryId: Joi.string().guid({version: 'uuidv4'}).required()
  }),

  update: Joi.object({
    serviceTitle: Joi.string().min(3).max(100),
    serviceDescription: Joi.string().min(10),
    serviceOverview: Joi.string().min(10),
    priceRange: Joi.string(),
    serviceFeatures: Joi.array().items(Joi.object({
      title: Joi.string().required(),
      description: Joi.string().required()
    })).min(1),
    isFeatured: Joi.boolean(),
    serviceIcon: Joi.string(),
    serviceStatus: Joi.string().valid('active', 'inactive', 'archived'),
    categoryId: Joi.string().guid({version: 'uuidv4'})
  }).min(1)
};

// Expertise Validation Schemas
const expertiseSchema = {
  create: Joi.object({
    expertiseName: Joi.string().required().min(2).max(50),
    proficiencyLevel: Joi.number().integer().min(1).max(100).required(),
    expertiseIcon: Joi.string().allow(null, ''),
    isFeatured: Joi.boolean().default(false),
    categoryId: Joi.string().guid({version: 'uuidv4'}).required()
  }),

  update: Joi.object({
    expertiseName: Joi.string().min(2).max(50),
    proficiencyLevel: Joi.number().integer().min(1).max(100),
    expertiseIcon: Joi.string().allow(null, ''),
    isFeatured: Joi.boolean(),
    categoryId: Joi.string().guid({version: 'uuidv4'})
  }).min(1)
};

module.exports = {
  portfolioProjectSchema,
  articleSchema,
  serviceSchema,
  expertiseSchema
};
```

## Step 2: Implementing CRUD Services

Now let's implement CRUD services for our API endpoints. We'll start with the portfolio project service in `src/services/portfolioService.js`:

```javascript
const { 
  PortfolioProject, 
  ContentCategory, 
  TechnicalExpertise, 
  ProjectCategoryAssignment, 
  ProjectTechnologyAssignment, 
  ClientTestimonial 
} = require('../db/models');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const slugify = require('slugify');

/**
 * Service for managing portfolio projects
 */
class PortfolioService {
  /**
   * Get all published portfolio projects
   * @param {Object} options - Query options
   * @param {number} options.skip - Number of records to skip
   * @param {number} options.limit - Maximum number of records to return
   * @param {string} options.categoryId - Optional category ID filter
   * @param {boolean} options.featuredOnly - Filter for featured projects only
   * @returns {Promise<Array>} Array of portfolio projects
   */
  async getProjects({ skip = 0, limit = 10, categoryId = null, featuredOnly = false }) {
    const whereClause = {
      publicationStatus: 'published'
    };

    if (featuredOnly) {
      whereClause.isFeatured = true;
    }

    // If categoryId is provided, we need to filter by category
    if (categoryId) {
      const projects = await PortfolioProject.findAndCountAll({
        include: [
          {
            model: ContentCategory,
            as: 'categories',
            through: { attributes: [] },
            where: { categoryId }
          },
          {
            model: TechnicalExpertise,
            as: 'technicalExpertise',
            through: { attributes: [] }
          }
        ],
        where: whereClause,
        distinct: true,
        offset: skip,
        limit: limit,
        order: [['createdAt', 'DESC']]
      });

      return {
        data: projects.rows,
        total: projects.count,
        page: Math.floor(skip / limit) + 1,
        limit: limit,
        totalPages: Math.ceil(projects.count / limit)
      };
    }

    // Otherwise, get all published projects
    const projects = await PortfolioProject.findAndCountAll({
      include: [
        {
          model: ContentCategory,
          as: 'categories',
          through: { attributes: [] }
        },
        {
          model: TechnicalExpertise,
          as: 'technicalExpertise',
          through: { attributes: [] }
        }
      ],
      where: whereClause,
      distinct: true,
      offset: skip,
      limit: limit,
      order: [['createdAt', 'DESC']]
    });

    return {
      data: projects.rows,
      total: projects.count,
      page: Math.floor(skip / limit) + 1,
      limit: limit,
      totalPages: Math.ceil(projects.count / limit)
    };
  }

  /**
   * Get a specific portfolio project by ID
   * @param {string} projectId - The project ID
   * @returns {Promise<Object>} The portfolio project
   */
  async getProjectById(projectId) {
    const project = await PortfolioProject.findByPk(projectId, {
      include: [
        {
          model: ContentCategory,
          as: 'categories',
          through: { attributes: [] }
        },
        {
          model: TechnicalExpertise,
          as: 'technicalExpertise',
          through: { attributes: [] }
        },
        {
          model: ClientTestimonial,
          as: 'testimonials'
        }
      ]
    });

    if (!project) {
      throw new Error('Portfolio project not found');
    }

    return project;
  }

  // More methods will follow for CRUD operations
}

module.exports = PortfolioService;
```

## Step 3: Implementing API Endpoints for Portfolio Projects

Let's implement the API endpoints for portfolio projects in `src/api/portfolio/index.js`:

```javascript
const express = require('express');
const { portfolioProjectSchema } = require('../../utils/validationSchemas');
const PortfolioService = require('../../services/portfolioService');
const validateRequest = require('../../middleware/requestValidation');
const { requireAuthentication } = require('../../middleware/authentication');
const { requireRole } = require('../../middleware/accessControl');

const router = express.Router();
const portfolioService = new PortfolioService();

/**
 * @swagger
 * /api/portfolio-projects:
 *   get:
 *     summary: Retrieve published portfolio projects
 *     parameters:
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of items to skip for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Maximum number of items to return
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
 *         description: A list of portfolio projects
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
 * /api/portfolio-projects/{projectId}:
 *   get:
 *     summary: Get a specific portfolio project
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
 *       404:
 *         description: Project not found
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

// Add more routes for CRUD operations...

module.exports = router; 