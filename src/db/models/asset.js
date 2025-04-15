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