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