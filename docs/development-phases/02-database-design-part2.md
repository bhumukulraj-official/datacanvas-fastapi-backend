# Phase 2: Database Design and Setup (Continued)

## Step 4: Digital Asset Management

Let's implement the digital asset management models in `src/db/models/asset.js`:

```javascript
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const DigitalAsset = sequelize.define('DigitalAsset', {
    assetId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      field: 'asset_id'
    },
    uploadedBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'professional_accounts',
        key: 'account_id'
      },
      onDelete: 'CASCADE',
      field: 'uploaded_by'
    },
    assetName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'asset_name'
    },
    fileName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'file_name'
    },
    mimeType: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'mime_type'
    },
    fileSize: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'file_size'
    },
    filePath: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'file_path'
    },
    thumbnailPath: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'thumbnail_path'
    },
    alternativeText: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'alternative_text'
    }
  }, {
    tableName: 'digital_assets',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['uploaded_by'] },
      { fields: ['mime_type'] }
    ]
  });

  const ProjectAssetAssociation = sequelize.define('ProjectAssetAssociation', {
    associationId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      field: 'association_id'
    },
    projectId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'portfolio_projects',
        key: 'project_id'
      },
      onDelete: 'CASCADE',
      field: 'project_id'
    },
    assetId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'digital_assets',
        key: 'asset_id'
      },
      onDelete: 'CASCADE',
      field: 'asset_id'
    },
    displayOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'display_order'
    }
  }, {
    tableName: 'project_asset_associations',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      { fields: ['project_id'] },
      { fields: ['asset_id'] },
      { unique: true, fields: ['project_id', 'asset_id'] }
    ]
  });

  const ArticleAssetAssociation = sequelize.define('ArticleAssetAssociation', {
    associationId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      field: 'association_id'
    },
    articleId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'article_publications',
        key: 'article_id'
      },
      onDelete: 'CASCADE',
      field: 'article_id'
    },
    assetId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'digital_assets',
        key: 'asset_id'
      },
      onDelete: 'CASCADE',
      field: 'asset_id'
    },
    displayOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'display_order'
    }
  }, {
    tableName: 'article_asset_associations',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      { fields: ['article_id'] },
      { fields: ['asset_id'] },
      { unique: true, fields: ['article_id', 'asset_id'] }
    ]
  });

  const ServiceAssetAssociation = sequelize.define('ServiceAssetAssociation', {
    associationId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      field: 'association_id'
    },
    serviceId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'professional_services',
        key: 'service_id'
      },
      onDelete: 'CASCADE',
      field: 'service_id'
    },
    assetId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'digital_assets',
        key: 'asset_id'
      },
      onDelete: 'CASCADE',
      field: 'asset_id'
    },
    displayOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'display_order'
    }
  }, {
    tableName: 'service_asset_associations',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      { fields: ['service_id'] },
      { fields: ['asset_id'] },
      { unique: true, fields: ['service_id', 'asset_id'] }
    ]
  });

  // Association tables and relationships will be defined in associations.js

  return {
    DigitalAsset,
    ProjectAssetAssociation,
    ArticleAssetAssociation,
    ServiceAssetAssociation
  };
};
```

## Step 5: Client Inquiry and Newsletter Models

Let's implement client inquiries and newsletter subscribers in `src/db/models/inquiry.js` and `src/db/models/newsletter.js`:

```javascript
// src/db/models/inquiry.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ClientInquiry = sequelize.define('ClientInquiry', {
    inquiryId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      field: 'inquiry_id'
    },
    clientName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'client_name'
    },
    clientEmail: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'client_email'
    },
    inquirySubject: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'inquiry_subject'
    },
    inquiryMessage: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'inquiry_message'
    },
    inquiryStatus: {
      type: DataTypes.ENUM('unread', 'read', 'replied', 'archived'),
      allowNull: false,
      defaultValue: 'unread',
      field: 'inquiry_status'
    }
  }, {
    tableName: 'client_inquiries',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['client_email'] },
      { fields: ['inquiry_status'] }
    ]
  });

  return {
    ClientInquiry
  };
};
```

```javascript
// src/db/models/newsletter.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const NewsletterSubscriber = sequelize.define('NewsletterSubscriber', {
    subscriberId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      field: 'subscriber_id'
    },
    emailAddress: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: 'email_address'
    },
    subscriberName: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'subscriber_name'
    },
    unsubscribeToken: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: 'unsubscribe_token'
    },
    subscriptionStatus: {
      type: DataTypes.ENUM('active', 'inactive', 'unsubscribed'),
      allowNull: false,
      defaultValue: 'active',
      field: 'subscription_status'
    }
  }, {
    tableName: 'newsletter_subscribers',
    timestamps: true,
    underscored: true,
    indexes: [
      { unique: true, fields: ['email_address'] },
      { unique: true, fields: ['unsubscribe_token'] },
      { fields: ['subscription_status'] }
    ]
  });

  return {
    NewsletterSubscriber
  };
};
```

## Step 6: Data Access Layer with Sequelize

Let's create CRUD operations using Sequelize. First, let's define a base repository in `src/repositories/base.repository.js`:

```javascript
class BaseRepository {
  /**
   * Base repository for CRUD operations.
   * @param {Object} model - Sequelize model
   */
  constructor(model) {
    this.model = model;
  }

  /**
   * Get a record by ID.
   * @param {string} id - Record ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Found record or null
   */
  async findById(id, options = {}) {
    return this.model.findByPk(id, options);
  }

  /**
   * Get multiple records with pagination.
   * @param {Object} options - Query options
   * @param {number} page - Page number
   * @param {number} limit - Records per page
   * @returns {Promise<Object>} Paginated results
   */
  async findAll(options = {}, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    
    const { count, rows } = await this.model.findAndCountAll({
      ...options,
      offset,
      limit
    });

    return {
      data: rows,
      pagination: {
        total: count,
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        limit
      }
    };
  }

  /**
   * Create a new record.
   * @param {Object} data - Record data
   * @param {Object} options - Create options
   * @returns {Promise<Object>} Created record
   */
  async create(data, options = {}) {
    return this.model.create(data, options);
  }

  /**
   * Update a record.
   * @param {string} id - Record ID
   * @param {Object} data - Update data
   * @param {Object} options - Update options
   * @returns {Promise<Object>} Updated record
   */
  async update(id, data, options = {}) {
    const [updated] = await this.model.update(data, {
      where: { id },
      ...options
    });

    if (!updated) {
      throw new Error('Record not found');
    }

    return this.findById(id);
  }

  /**
   * Delete a record.
   * @param {string} id - Record ID
   * @param {Object} options - Delete options
   * @returns {Promise<boolean>} Success indicator
   */
  async delete(id, options = {}) {
    const deleted = await this.model.destroy({
      where: { id },
      ...options
    });

    return Boolean(deleted);
  }

  /**
   * Find one record by criteria.
   * @param {Object} criteria - Search criteria
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Found record or null
   */
  async findOne(criteria, options = {}) {
    return this.model.findOne({
      where: criteria,
      ...options
    });
  }

  /**
   * Count records by criteria.
   * @param {Object} criteria - Count criteria
   * @returns {Promise<number>} Record count
   */
  async count(criteria = {}) {
    return this.model.count({
      where: criteria
    });
  }
}

module.exports = BaseRepository;
```

## Step 7: Database Migration Setup with Sequelize CLI

Let's set up our database migrations with Sequelize CLI. First, we need to create a configuration file at `.sequelizerc`:

```javascript
const path = require('path');

module.exports = {
  'config': path.resolve('src/config', 'database.js'),
  'models-path': path.resolve('src/db', 'models'),
  'seeders-path': path.resolve('src/db', 'seeders'),
  'migrations-path': path.resolve('src/db', 'migrations')
};
```

Now, let's create a migration for our database schema in `src/db/migrations/`:

```bash
npx sequelize-cli migration:generate --name initial-schema
```

Edit the generated migration file to include our schema definitions:

```javascript
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Create tables in the correct order to respect foreign key constraints
    
    // Professional accounts table
    await queryInterface.createTable('professional_accounts', {
      account_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      username: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      email_address: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      password_hash: {
        type: Sequelize.STRING,
        allowNull: false
      },
      account_role: {
        type: Sequelize.ENUM('admin', 'user'),
        allowNull: false,
        defaultValue: 'user'
      },
      professional_bio: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      profile_image: {
        type: Sequelize.STRING,
        allowNull: true
      },
      social_media_profiles: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      is_account_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      last_login_time: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Categories table
    await queryInterface.createTable('content_categories', {
      category_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      parent_category_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'content_categories',
          key: 'category_id'
        },
        onDelete: 'SET NULL'
      },
      category_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      category_slug: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      category_type: {
        type: Sequelize.ENUM('project', 'article', 'service', 'expertise'),
        allowNull: false
      },
      hierarchy_level: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Continue with other tables...
    // This would be a lengthy migration file with all tables defined
  },

  async down(queryInterface, Sequelize) {
    // Drop tables in reverse order to respect foreign key constraints
    await queryInterface.dropTable('service_asset_associations');
    await queryInterface.dropTable('article_asset_associations');
    await queryInterface.dropTable('project_asset_associations');
    await queryInterface.dropTable('digital_assets');
    // Continue with other tables...
  }
};
```

## Step 8: Initial Database Migration and Seed Data

Let's create a helper script to run the migrations and seed the database in `src/db/init-db.js`:

```javascript
const { sequelize } = require('./models');
const { ProfessionalAccount } = require('./models').models;
const { ContentCategory } = require('./models').models;
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

async function initializeDatabase() {
  console.log('Initializing database...');
  
  try {
    // Create admin user if it doesn't exist
    const adminUser = await ProfessionalAccount.findOne({
      where: { username: 'admin' }
    });
    
    if (!adminUser) {
      console.log('Creating initial admin user');
      await ProfessionalAccount.create({
        accountId: uuidv4(),
        username: 'admin',
        emailAddress: 'admin@example.com', // Change in production
        passwordHash: await bcrypt.hash('admin', 10), // Change in production
        accountRole: 'admin',
        professionalBio: 'System administrator',
        isAccountActive: true
      });
    }
    
    // Create default categories
    const categoryTypes = [
      // Project categories
      { name: 'Web Development', slug: 'web-development', type: 'project' },
      { name: 'Data Science', slug: 'data-science', type: 'project' },
      { name: 'Mobile App', slug: 'mobile-app', type: 'project' },
      { name: 'UI/UX Design', slug: 'ui-ux-design', type: 'project' },
      
      // Article categories
      { name: 'Tutorials', slug: 'tutorials', type: 'article' },
      { name: 'Case Studies', slug: 'case-studies', type: 'article' },
      { name: 'Industry Insights', slug: 'industry-insights', type: 'article' },
      { name: 'Technology News', slug: 'technology-news', type: 'article' },
      
      // Service categories
      { name: 'Development Services', slug: 'development-services', type: 'service' },
      { name: 'Data Analysis', slug: 'data-analysis', type: 'service' },
      { name: 'Design Services', slug: 'design-services', type: 'service' },
      { name: 'Consulting', slug: 'consulting', type: 'service' },
      
      // Expertise categories
      { name: 'Programming Languages', slug: 'programming-languages', type: 'expertise' },
      { name: 'Frameworks', slug: 'frameworks', type: 'expertise' },
      { name: 'Tools', slug: 'tools', type: 'expertise' },
      { name: 'Methodologies', slug: 'methodologies', type: 'expertise' }
    ];
    
    for (const category of categoryTypes) {
      const existingCategory = await ContentCategory.findOne({
        where: { categorySlug: category.slug }
      });
      
      if (!existingCategory) {
        console.log(`Creating category: ${category.name}`);
        await ContentCategory.create({
          categoryId: uuidv4(),
          categoryName: category.name,
          categorySlug: category.slug,
          categoryType: category.type,
          hierarchyLevel: 0
        });
      }
    }
    
    console.log('Database initialization completed successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

module.exports = { initializeDatabase };
```

## Step 9: Database Helper Functions for Common Operations

Let's create a utility file with common database operations in `src/db/utils.js`:

```javascript
const { DataTypes } = require('sequelize');
const { sequelize } = require('./models');

/**
 * Create database functions for optimized operations
 */
async function createDatabaseFunctions() {
  // Function to generate slugs
  await sequelize.query(`
    CREATE OR REPLACE FUNCTION generate_slug(title text)
    RETURNS text AS $$
    DECLARE
      slug text;
      base_slug text;
      counter integer := 0;
      slug_exists boolean;
    BEGIN
      -- Convert to lowercase, replace spaces with hyphens, remove special chars
      base_slug := lower(regexp_replace(title, '[^a-zA-Z0-9\\s-]', '', 'g'));
      base_slug := regexp_replace(base_slug, '\\s+', '-', 'g');
      
      slug := base_slug;
      
      -- Check if slug exists and append counter if needed
      LOOP
        EXECUTE format('SELECT EXISTS(SELECT 1 FROM %I WHERE %I = $1)', TG_TABLE_NAME, TG_ARGV[0])
        INTO slug_exists
        USING slug;
        
        EXIT WHEN NOT slug_exists;
        
        counter := counter + 1;
        slug := base_slug || '-' || counter;
      END LOOP;
      
      RETURN slug;
    END;
    $$ LANGUAGE plpgsql;
  `);
  
  // Function to update timestamp fields
  await sequelize.query(`
    CREATE OR REPLACE FUNCTION update_timestamp()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = CURRENT_TIMESTAMP;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);
  
  // Function for category depth calculation
  await sequelize.query(`
    CREATE OR REPLACE FUNCTION calculate_category_depth()
    RETURNS TRIGGER AS $$
    DECLARE
      parent_depth integer;
    BEGIN
      IF NEW.parent_category_id IS NULL THEN
        NEW.hierarchy_level = 0;
      ELSE
        SELECT hierarchy_level INTO parent_depth FROM content_categories WHERE category_id = NEW.parent_category_id;
        NEW.hierarchy_level = parent_depth + 1;
        
        -- Check for circular references
        IF NEW.hierarchy_level > 10 THEN
          RAISE EXCEPTION 'Category depth limit exceeded - possible circular reference';
        END IF;
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);
  
  // Function to set publication date
  await sequelize.query(`
    CREATE OR REPLACE FUNCTION set_publication_date()
    RETURNS TRIGGER AS $$
    BEGIN
      IF NEW.publication_status = 'published' AND (OLD.publication_status != 'published' OR OLD.publication_status IS NULL) THEN
        NEW.publication_date = CURRENT_TIMESTAMP;
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);
  
  // Create triggers
  
  // Update timestamp trigger for professional_accounts
  await sequelize.query(`
    CREATE TRIGGER update_timestamp_professional_accounts
    BEFORE UPDATE ON professional_accounts
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();
  `);
  
  // Category depth trigger
  await sequelize.query(`
    CREATE TRIGGER update_category_depth
    BEFORE INSERT OR UPDATE ON content_categories
    FOR EACH ROW EXECUTE FUNCTION calculate_category_depth();
  `);
  
  // Publication date trigger for articles
  await sequelize.query(`
    CREATE TRIGGER set_publication_date_articles
    BEFORE UPDATE ON article_publications
    FOR EACH ROW EXECUTE FUNCTION set_publication_date();
  `);
  
  // Similar trigger for projects
  await sequelize.query(`
    CREATE TRIGGER set_publication_date_projects
    BEFORE UPDATE ON portfolio_projects
    FOR EACH ROW EXECUTE FUNCTION set_publication_date();
  `);
}

module.exports = {
  createDatabaseFunctions
};
```

## Step 10: Setting Up Associations

Let's create a file to define all model associations in `src/db/models/associations.js`:

```javascript
/**
 * Define Sequelize model associations
 * @param {Object} models - The Sequelize models
 */
function setupAssociations(models) {
  const {
    ProfessionalAccount,
    AuthenticationToken,
    PasswordRecoveryRequest,
    ContentCategory,
    ContentTag,
    SiteConfiguration,
    PortfolioProject,
    ProjectCategoryAssignment,
    ProjectTechnologyAssignment,
    ClientTestimonial,
    ArticlePublication,
    ArticleCategoryAssignment,
    ArticleTagAssignment,
    ProfessionalService,
    TechnicalExpertise,
    ProfessionalExpertise,
    DigitalAsset,
    ProjectAssetAssociation,
    ArticleAssetAssociation,
    ServiceAssetAssociation
  } = models;

  // ProfessionalAccount associations
  ProfessionalAccount.hasMany(PortfolioProject, {
    foreignKey: 'accountId',
    as: 'portfolioProjects'
  });
  PortfolioProject.belongsTo(ProfessionalAccount, {
    foreignKey: 'accountId',
    as: 'owner'
  });

  ProfessionalAccount.hasMany(ArticlePublication, {
    foreignKey: 'authorId',
    as: 'articles'
  });
  ArticlePublication.belongsTo(ProfessionalAccount, {
    foreignKey: 'authorId',
    as: 'author'
  });

  // ContentCategory associations
  ContentCategory.belongsToMany(PortfolioProject, {
    through: ProjectCategoryAssignment,
    foreignKey: 'categoryId',
    otherKey: 'projectId',
    as: 'projects'
  });
  PortfolioProject.belongsToMany(ContentCategory, {
    through: ProjectCategoryAssignment,
    foreignKey: 'projectId',
    otherKey: 'categoryId',
    as: 'categories'
  });

  ContentCategory.belongsToMany(ArticlePublication, {
    through: ArticleCategoryAssignment,
    foreignKey: 'categoryId',
    otherKey: 'articleId',
    as: 'articles'
  });
  ArticlePublication.belongsToMany(ContentCategory, {
    through: ArticleCategoryAssignment,
    foreignKey: 'articleId',
    otherKey: 'categoryId',
    as: 'categories'
  });

  // ContentTag associations
  ContentTag.belongsToMany(ArticlePublication, {
    through: ArticleTagAssignment,
    foreignKey: 'tagId',
    otherKey: 'articleId',
    as: 'articles'
  });
  ArticlePublication.belongsToMany(ContentTag, {
    through: ArticleTagAssignment,
    foreignKey: 'articleId',
    otherKey: 'tagId',
    as: 'tags'
  });

  // TechnicalExpertise associations
  TechnicalExpertise.belongsToMany(PortfolioProject, {
    through: ProjectTechnologyAssignment,
    foreignKey: 'expertiseId',
    otherKey: 'projectId',
    as: 'projects'
  });
  PortfolioProject.belongsToMany(TechnicalExpertise, {
    through: ProjectTechnologyAssignment,
    foreignKey: 'projectId',
    otherKey: 'expertiseId',
    as: 'technologies'
  });

  // Asset associations
  DigitalAsset.belongsToMany(PortfolioProject, {
    through: ProjectAssetAssociation,
    foreignKey: 'assetId',
    otherKey: 'projectId',
    as: 'projects'
  });
  PortfolioProject.belongsToMany(DigitalAsset, {
    through: ProjectAssetAssociation,
    foreignKey: 'projectId',
    otherKey: 'assetId',
    as: 'assets'
  });

  DigitalAsset.belongsToMany(ArticlePublication, {
    through: ArticleAssetAssociation,
    foreignKey: 'assetId',
    otherKey: 'articleId',
    as: 'articles'
  });
  ArticlePublication.belongsToMany(DigitalAsset, {
    through: ArticleAssetAssociation,
    foreignKey: 'articleId',
    otherKey: 'assetId',
    as: 'assets'
  });

  DigitalAsset.belongsToMany(ProfessionalService, {
    through: ServiceAssetAssociation,
    foreignKey: 'assetId',
    otherKey: 'serviceId',
    as: 'services'
  });
  ProfessionalService.belongsToMany(DigitalAsset, {
    through: ServiceAssetAssociation,
    foreignKey: 'serviceId',
    otherKey: 'assetId',
    as: 'assets'
  });

  // Additional associations can be defined here
}

module.exports = setupAssociations;
```

## Step 11: Database Health Check Function

Let's implement a database health check function in `src/db/health.js`:

```javascript
const { sequelize } = require('./models');

/**
 * Check database health and connectivity
 * @returns {Promise<Object>} Health status
 */
async function checkDatabaseHealth() {
  try {
    await sequelize.authenticate();
    
    // Run basic query to test functionality
    const [result] = await sequelize.query('SELECT 1+1 as result');
    const isWorking = result[0].result === 2;
    
    return {
      status: 'healthy',
      connected: true,
      working: isWorking,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      connected: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = {
  checkDatabaseHealth
};
```

## Step 12: Creating an Index for Model Exports

For easy access to all models, let's create an index file at `src/db/models/index.js`:

```javascript
const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const setupAssociations = require('./associations');
const config = require('../../config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(dbConfig.url, dbConfig);
const models = {};

// Import models
fs.readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== path.basename(__filename) &&
      file !== 'associations.js' &&
      file.slice(-3) === '.js'
    );
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize);
    Object.keys(model).forEach(modelName => {
      models[modelName] = model[modelName];
    });
  });

// Set up associations
setupAssociations(models);

module.exports = {
  sequelize,
  Sequelize,
  models
};
```

With this database design in place, we now have a solid foundation for our DataCanvasDev application using Sequelize ORM with PostgreSQL. 