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