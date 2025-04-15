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