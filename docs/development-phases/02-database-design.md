# Phase 2: Database Design and Setup

In this phase, we'll implement the database schema for the DataCanvasDev application. The database schema is based on the requirements outlined in the specification document, using Sequelize as our ORM.

## Step 1: Creating the Base Models

We'll start by defining the base models that will represent our database tables. Each model will be defined in its respective file under the `src/db/models/` directory.

### Core Entity: Professional Accounts

First, let's implement the account-related models in `src/db/models/account.js`:

```javascript
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ProfessionalAccount = sequelize.define('ProfessionalAccount', {
    accountId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      field: 'account_id'
    },
    username: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      field: 'username'
    },
    emailAddress: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: {
        isEmail: true
      },
      field: 'email_address'
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'password_hash'
    },
    accountRole: {
      type: DataTypes.ENUM('admin', 'user'),
      allowNull: false,
      defaultValue: 'user',
      field: 'account_role'
    },
    professionalBio: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'professional_bio'
    },
    profileImage: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'profile_image'
    },
    socialMediaProfiles: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'social_media_profiles'
    },
    isAccountActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_account_active'
    },
    lastLoginTime: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_login_time'
    }
  }, {
    tableName: 'professional_accounts',
    timestamps: true,
    underscored: true,
    indexes: [
      { unique: true, fields: ['username'] },
      { unique: true, fields: ['email_address'] },
      { fields: ['account_role'] }
    ]
  });

  const AuthenticationToken = sequelize.define('AuthenticationToken', {
    tokenId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      field: 'token_id'
    },
    accountId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'professional_accounts',
        key: 'account_id'
      },
      onDelete: 'CASCADE',
      field: 'account_id'
    },
    tokenValue: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: 'token_value'
    },
    expirationDate: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'expiration_date'
    }
  }, {
    tableName: 'authentication_tokens',
    timestamps: true,
    underscored: true,
    indexes: [
      { unique: true, fields: ['token_value'] },
      { fields: ['account_id'] }
    ]
  });

  const PasswordRecoveryRequest = sequelize.define('PasswordRecoveryRequest', {
    requestId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      field: 'request_id'
    },
    accountId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'professional_accounts',
        key: 'account_id'
      },
      onDelete: 'CASCADE',
      field: 'account_id'
    },
    recoveryToken: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: 'recovery_token'
    },
    expirationDate: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'expiration_date'
    },
    isUsed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_used'
    }
  }, {
    tableName: 'password_recovery_requests',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      { unique: true, fields: ['recovery_token'] },
      { fields: ['account_id'] }
    ]
  });

  // Define associations
  ProfessionalAccount.hasMany(AuthenticationToken, { 
    foreignKey: 'accountId', 
    as: 'authenticationTokens',
    onDelete: 'CASCADE'
  });
  AuthenticationToken.belongsTo(ProfessionalAccount, { 
    foreignKey: 'accountId', 
    as: 'account' 
  });

  ProfessionalAccount.hasMany(PasswordRecoveryRequest, { 
    foreignKey: 'accountId', 
    as: 'recoveryRequests',
    onDelete: 'CASCADE'
  });
  PasswordRecoveryRequest.belongsTo(ProfessionalAccount, { 
    foreignKey: 'accountId', 
    as: 'account' 
  });

  return {
    ProfessionalAccount,
    AuthenticationToken,
    PasswordRecoveryRequest
  };
};
```

### Categories and Taxonomies

Next, let's implement categories and tags in `src/db/models/configuration.js`:

```javascript
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ContentCategory = sequelize.define('ContentCategory', {
    categoryId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      field: 'category_id'
    },
    parentCategoryId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'content_categories',
        key: 'category_id'
      },
      onDelete: 'SET NULL',
      field: 'parent_category_id'
    },
    categoryName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'category_name'
    },
    categorySlug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: 'category_slug'
    },
    categoryType: {
      type: DataTypes.ENUM('project', 'article', 'service', 'expertise'),
      allowNull: false,
      field: 'category_type'
    },
    hierarchyLevel: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 10
      },
      field: 'hierarchy_level'
    }
  }, {
    tableName: 'content_categories',
    timestamps: true,
    underscored: true,
    indexes: [
      { unique: true, fields: ['category_slug'] },
      { fields: ['parent_category_id'] },
      { fields: ['category_type'] }
    ]
  });

  const ContentTag = sequelize.define('ContentTag', {
    tagId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      field: 'tag_id'
    },
    tagName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'tag_name'
    },
    tagSlug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: 'tag_slug'
    }
  }, {
    tableName: 'content_tags',
    timestamps: true,
    underscored: true,
    indexes: [
      { unique: true, fields: ['tag_slug'] }
    ]
  });

  const SiteConfiguration = sequelize.define('SiteConfiguration', {
    configId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      field: 'config_id'
    },
    siteName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'site_name'
    },
    siteDescription: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'site_description'
    },
    logoPath: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'logo_path'
    },
    faviconPath: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'favicon_path'
    },
    socialMediaLinks: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'social_media_links'
    },
    contactInformation: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'contact_information'
    },
    metaKeywords: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'meta_keywords'
    },
    metaDescription: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'meta_description'
    },
    analyticsConfigurations: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'analytics_configurations'
    },
    webhookSecrets: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: "For validating webhook calls",
      field: 'webhook_secrets'
    },
    lastUpdatedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'professional_accounts',
        key: 'account_id'
      },
      onDelete: 'SET NULL',
      field: 'last_updated_by'
    }
  }, {
    tableName: 'site_configuration',
    timestamps: true,
    underscored: true
  });

  // Self-referencing relationship for categories
  ContentCategory.belongsTo(ContentCategory, {
    as: 'parent',
    foreignKey: 'parentCategoryId'
  });
  ContentCategory.hasMany(ContentCategory, {
    as: 'children',
    foreignKey: 'parentCategoryId'
  });

  return {
    ContentCategory,
    ContentTag,
    SiteConfiguration
  };
};
```

### Portfolio Projects

Let's implement the portfolio project models in `src/db/models/portfolio.js`:

```javascript
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PortfolioProject = sequelize.define('PortfolioProject', {
    projectId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      field: 'project_id'
    },
    accountId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'professional_accounts',
        key: 'account_id'
      },
      onDelete: 'CASCADE',
      field: 'account_id'
    },
    projectTitle: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'project_title'
    },
    projectSlug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: 'project_slug'
    },
    projectDescription: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'project_description'
    },
    completionDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'completion_date'
    },
    isFeatured: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_featured'
    },
    thumbnailImage: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'thumbnail_image'
    },
    publicationStatus: {
      type: DataTypes.ENUM('draft', 'published', 'archived'),
      allowNull: false,
      defaultValue: 'draft',
      field: 'publication_status'
    },
    projectOutcomes: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'project_outcomes'
    },
    businessImpact: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'business_impact'
    },
    implementationApproach: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'implementation_approach'
    }
  }, {
    tableName: 'portfolio_projects',
    timestamps: true,
    underscored: true,
    indexes: [
      { unique: true, fields: ['project_slug'] },
      { fields: ['account_id'] },
      { fields: ['publication_status'] },
      { fields: ['is_featured'] },
      { 
        fields: ['created_at', 'project_id'],
        where: { publication_status: 'published' }
      },
      { 
        fields: ['is_featured', 'created_at'],
        where: { publication_status: 'published' }
      }
    ]
  });

  const ProjectCategoryAssignment = sequelize.define('ProjectCategoryAssignment', {
    assignmentId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      field: 'assignment_id'
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
    categoryId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'content_categories',
        key: 'category_id'
      },
      onDelete: 'CASCADE',
      field: 'category_id'
    }
  }, {
    tableName: 'project_category_assignments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      { fields: ['project_id'] },
      { fields: ['category_id'] },
      { unique: true, fields: ['project_id', 'category_id'] }
    ]
  });

  // Association tables and relationships will be defined in associations.js

  return {
    PortfolioProject,
    ProjectCategoryAssignment
  };
};
```

## Step 2: Article Publication Models

Let's implement the article publication models in `src/db/models/article.js`:

```javascript
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ArticlePublication = sequelize.define('ArticlePublication', {
    articleId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      field: 'article_id'
    },
    authorId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'professional_accounts',
        key: 'account_id'
      },
      onDelete: 'CASCADE',
      field: 'author_id'
    },
    articleTitle: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'article_title'
    },
    articleSlug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: 'article_slug'
    },
    articleContent: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'article_content'
    },
    articleSummary: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'article_summary'
    },
    featuredImage: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'featured_image'
    },
    publicationStatus: {
      type: DataTypes.ENUM('draft', 'published', 'archived'),
      allowNull: false,
      defaultValue: 'draft',
      field: 'publication_status'
    },
    publicationDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'publication_date'
    }
  }, {
    tableName: 'article_publications',
    timestamps: true,
    underscored: true,
    indexes: [
      { unique: true, fields: ['article_slug'] },
      { fields: ['author_id'] },
      { fields: ['publication_status', 'publication_date'] },
      { 
        fields: ['publication_date', 'article_id'],
        where: { publication_status: 'published' }
      }
    ],
    hooks: {
      beforeUpdate: (article) => {
        // Set publication_date when status changes to published
        if (article.publicationStatus === 'published' && 
            article.changed('publicationStatus') && 
            article.previous('publicationStatus') !== 'published') {
          article.publicationDate = new Date();
        }
      }
    }
  });

  const ArticleCategoryAssignment = sequelize.define('ArticleCategoryAssignment', {
    assignmentId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      field: 'assignment_id'
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
    categoryId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'content_categories',
        key: 'category_id'
      },
      onDelete: 'CASCADE',
      field: 'category_id'
    }
  }, {
    tableName: 'article_category_assignments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      { fields: ['article_id'] },
      { fields: ['category_id'] },
      { unique: true, fields: ['article_id', 'category_id'] }
    ]
  });

  const ArticleTagAssignment = sequelize.define('ArticleTagAssignment', {
    assignmentId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      field: 'assignment_id'
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
    tagId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'content_tags',
        key: 'tag_id'
      },
      onDelete: 'CASCADE',
      field: 'tag_id'
    }
  }, {
    tableName: 'article_tag_assignments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      { fields: ['article_id'] },
      { fields: ['tag_id'] },
      { unique: true, fields: ['article_id', 'tag_id'] }
    ]
  });

  // Association tables and relationships will be defined in associations.js

  return {
    ArticlePublication,
    ArticleCategoryAssignment,
    ArticleTagAssignment
  };
};
```

## Step 3: Professional Services and Expertise Models

Let's implement the services and expertise models in `src/db/models/service.js` and `src/db/models/expertise.js`:

```javascript
// src/db/models/service.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ProfessionalService = sequelize.define('ProfessionalService', {
    serviceId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      field: 'service_id'
    },
    categoryId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'content_categories',
        key: 'category_id'
      },
      onDelete: 'RESTRICT',
      field: 'category_id'
    },
    serviceTitle: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'service_title'
    },
    serviceSlug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: 'service_slug'
    },
    serviceDescription: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'service_description'
    },
    serviceOverview: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'service_overview'
    },
    priceRange: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'price_range'
    },
    serviceFeatures: {
      type: DataTypes.JSONB,
      allowNull: false,
      field: 'service_features'
    },
    isFeatured: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_featured'
    },
    serviceIcon: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'service_icon'
    },
    serviceStatus: {
      type: DataTypes.ENUM('active', 'inactive', 'archived'),
      allowNull: false,
      defaultValue: 'active',
      field: 'service_status'
    }
  }, {
    tableName: 'professional_services',
    timestamps: true,
    underscored: true,
    indexes: [
      { unique: true, fields: ['service_slug'] },
      { fields: ['category_id'] },
      { fields: ['is_featured'] },
      { fields: ['service_status'] }
    ]
  });

  // Association tables and relationships will be defined in associations.js

  return {
    ProfessionalService
  };
};
```

```javascript
// src/db/models/expertise.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const TechnicalExpertise = sequelize.define('TechnicalExpertise', {
    expertiseId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      field: 'expertise_id'
    },
    expertiseName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'expertise_name'
    },
    expertiseSlug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: 'expertise_slug'
    },
    iconIdentifier: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'icon_identifier'
    }
  }, {
    tableName: 'technical_expertise',
    timestamps: true,
    underscored: true,
    indexes: [
      { unique: true, fields: ['expertise_slug'] }
    ]
  });

  const ProfessionalExpertise = sequelize.define('ProfessionalExpertise', {
    expertiseId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      field: 'expertise_id'
    },
    accountId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'professional_accounts',
        key: 'account_id'
      },
      onDelete: 'CASCADE',
      field: 'account_id'
    },
    categoryId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'content_categories',
        key: 'category_id'
      },
      onDelete: 'RESTRICT',
      field: 'category_id'
    },
    expertiseName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'expertise_name'
    },
    proficiencyLevel: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 100
      },
      field: 'proficiency_level'
    },
    expertiseIcon: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'expertise_icon'
    },
    isFeatured: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_featured'
    }
  }, {
    tableName: 'professional_expertise',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['account_id'] },
      { fields: ['category_id'] },
      { fields: ['is_featured'] }
    ]
  });

  const ProjectTechnologyAssignment = sequelize.define('ProjectTechnologyAssignment', {
    assignmentId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      field: 'assignment_id'
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
    expertiseId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'technical_expertise',
        key: 'expertise_id'
      },
      onDelete: 'CASCADE',
      field: 'expertise_id'
    }
  }, {
    tableName: 'project_technology_assignments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      { fields: ['project_id'] },
      { fields: ['expertise_id'] },
      { unique: true, fields: ['project_id', 'expertise_id'] }
    ]
  });

  // Association tables and relationships will be defined in associations.js

  return {
    TechnicalExpertise,
    ProfessionalExpertise,
    ProjectTechnologyAssignment
  };
};
```

We'll continue with the remaining models in the next section. 