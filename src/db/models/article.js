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