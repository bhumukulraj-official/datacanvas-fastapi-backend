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