'use strict';

/** @type {import('sequelize-cli').Migration} */
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

    // Authentication tokens table
    await queryInterface.createTable('authentication_tokens', {
      token_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      account_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'professional_accounts',
          key: 'account_id'
        },
        onDelete: 'CASCADE'
      },
      token_value: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      expiration_date: {
        type: Sequelize.DATE,
        allowNull: false
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

    // Password recovery requests table
    await queryInterface.createTable('password_recovery_requests', {
      request_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      account_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'professional_accounts',
          key: 'account_id'
        },
        onDelete: 'CASCADE'
      },
      recovery_token: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      expiration_date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      is_used: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
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

    // Tags table
    await queryInterface.createTable('content_tags', {
      tag_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      tag_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      tag_slug: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
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

    // Site configuration table
    await queryInterface.createTable('site_configuration', {
      config_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      site_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      site_description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      logo_path: {
        type: Sequelize.STRING,
        allowNull: true
      },
      favicon_path: {
        type: Sequelize.STRING,
        allowNull: true
      },
      social_media_links: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      contact_information: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      meta_keywords: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      meta_description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      analytics_configurations: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      webhook_secrets: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      last_updated_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'professional_accounts',
          key: 'account_id'
        },
        onDelete: 'SET NULL'
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

    // Portfolio projects table
    await queryInterface.createTable('portfolio_projects', {
      project_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      account_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'professional_accounts',
          key: 'account_id'
        },
        onDelete: 'CASCADE'
      },
      project_title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      project_slug: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      project_description: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      completion_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      is_featured: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      thumbnail_image: {
        type: Sequelize.STRING,
        allowNull: false
      },
      publication_status: {
        type: Sequelize.ENUM('draft', 'published', 'archived'),
        allowNull: false,
        defaultValue: 'draft'
      },
      publication_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      project_outcomes: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      business_impact: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      implementation_approach: {
        type: Sequelize.JSONB,
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

    // Project category assignments
    await queryInterface.createTable('project_category_assignments', {
      assignment_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      project_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'portfolio_projects',
          key: 'project_id'
        },
        onDelete: 'CASCADE'
      },
      category_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'content_categories',
          key: 'category_id'
        },
        onDelete: 'CASCADE'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Article publications
    await queryInterface.createTable('article_publications', {
      article_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      author_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'professional_accounts',
          key: 'account_id'
        },
        onDelete: 'CASCADE'
      },
      article_title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      article_slug: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      article_content: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      article_summary: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      featured_image: {
        type: Sequelize.STRING,
        allowNull: false
      },
      publication_status: {
        type: Sequelize.ENUM('draft', 'published', 'archived'),
        allowNull: false,
        defaultValue: 'draft'
      },
      publication_date: {
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

    // Article category assignments
    await queryInterface.createTable('article_category_assignments', {
      assignment_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      article_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'article_publications',
          key: 'article_id'
        },
        onDelete: 'CASCADE'
      },
      category_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'content_categories',
          key: 'category_id'
        },
        onDelete: 'CASCADE'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Article tag assignments
    await queryInterface.createTable('article_tag_assignments', {
      assignment_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      article_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'article_publications',
          key: 'article_id'
        },
        onDelete: 'CASCADE'
      },
      tag_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'content_tags',
          key: 'tag_id'
        },
        onDelete: 'CASCADE'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Technical expertise
    await queryInterface.createTable('technical_expertise', {
      expertise_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      expertise_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      expertise_slug: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      icon_identifier: {
        type: Sequelize.STRING,
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

    // Professional expertise
    await queryInterface.createTable('professional_expertise', {
      expertise_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      account_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'professional_accounts',
          key: 'account_id'
        },
        onDelete: 'CASCADE'
      },
      category_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'content_categories',
          key: 'category_id'
        },
        onDelete: 'RESTRICT'
      },
      expertise_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      proficiency_level: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 100
        }
      },
      expertise_icon: {
        type: Sequelize.STRING,
        allowNull: true
      },
      is_featured: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
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

    // Project technology assignments
    await queryInterface.createTable('project_technology_assignments', {
      assignment_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      project_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'portfolio_projects',
          key: 'project_id'
        },
        onDelete: 'CASCADE'
      },
      expertise_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'technical_expertise',
          key: 'expertise_id'
        },
        onDelete: 'CASCADE'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Professional services
    await queryInterface.createTable('professional_services', {
      service_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      category_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'content_categories',
          key: 'category_id'
        },
        onDelete: 'RESTRICT'
      },
      service_title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      service_slug: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      service_description: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      service_overview: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      price_range: {
        type: Sequelize.STRING,
        allowNull: false
      },
      service_features: {
        type: Sequelize.JSONB,
        allowNull: false
      },
      is_featured: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      service_icon: {
        type: Sequelize.STRING,
        allowNull: false
      },
      service_status: {
        type: Sequelize.ENUM('active', 'inactive', 'archived'),
        allowNull: false,
        defaultValue: 'active'
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

    // Digital assets
    await queryInterface.createTable('digital_assets', {
      asset_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      uploaded_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'professional_accounts',
          key: 'account_id'
        },
        onDelete: 'CASCADE'
      },
      asset_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      file_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      mime_type: {
        type: Sequelize.STRING,
        allowNull: false
      },
      file_size: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      file_path: {
        type: Sequelize.STRING,
        allowNull: false
      },
      thumbnail_path: {
        type: Sequelize.STRING,
        allowNull: true
      },
      alternative_text: {
        type: Sequelize.STRING,
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

    // Project asset associations
    await queryInterface.createTable('project_asset_associations', {
      association_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      project_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'portfolio_projects',
          key: 'project_id'
        },
        onDelete: 'CASCADE'
      },
      asset_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'digital_assets',
          key: 'asset_id'
        },
        onDelete: 'CASCADE'
      },
      display_order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Article asset associations
    await queryInterface.createTable('article_asset_associations', {
      association_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      article_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'article_publications',
          key: 'article_id'
        },
        onDelete: 'CASCADE'
      },
      asset_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'digital_assets',
          key: 'asset_id'
        },
        onDelete: 'CASCADE'
      },
      display_order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Service asset associations
    await queryInterface.createTable('service_asset_associations', {
      association_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      service_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'professional_services',
          key: 'service_id'
        },
        onDelete: 'CASCADE'
      },
      asset_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'digital_assets',
          key: 'asset_id'
        },
        onDelete: 'CASCADE'
      },
      display_order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Client inquiries
    await queryInterface.createTable('client_inquiries', {
      inquiry_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      client_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      client_email: {
        type: Sequelize.STRING,
        allowNull: false
      },
      inquiry_subject: {
        type: Sequelize.STRING,
        allowNull: false
      },
      inquiry_message: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      inquiry_status: {
        type: Sequelize.ENUM('unread', 'read', 'replied', 'archived'),
        allowNull: false,
        defaultValue: 'unread'
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

    // Newsletter subscribers
    await queryInterface.createTable('newsletter_subscribers', {
      subscriber_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      email_address: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      subscriber_name: {
        type: Sequelize.STRING,
        allowNull: true
      },
      unsubscribe_token: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      subscription_status: {
        type: Sequelize.ENUM('active', 'inactive', 'unsubscribed'),
        allowNull: false,
        defaultValue: 'active'
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

    // Create indexes for performance
    await queryInterface.addIndex('professional_accounts', ['username']);
    await queryInterface.addIndex('professional_accounts', ['email_address']);
    await queryInterface.addIndex('professional_accounts', ['account_role']);
    
    await queryInterface.addIndex('authentication_tokens', ['token_value']);
    await queryInterface.addIndex('authentication_tokens', ['account_id']);
    
    await queryInterface.addIndex('password_recovery_requests', ['recovery_token']);
    await queryInterface.addIndex('password_recovery_requests', ['account_id']);
    
    await queryInterface.addIndex('content_categories', ['category_slug']);
    await queryInterface.addIndex('content_categories', ['parent_category_id']);
    await queryInterface.addIndex('content_categories', ['category_type']);
    
    await queryInterface.addIndex('content_tags', ['tag_slug']);
    
    await queryInterface.addIndex('portfolio_projects', ['project_slug']);
    await queryInterface.addIndex('portfolio_projects', ['account_id']);
    await queryInterface.addIndex('portfolio_projects', ['publication_status']);
    await queryInterface.addIndex('portfolio_projects', ['is_featured']);
    
    await queryInterface.addIndex('project_category_assignments', ['project_id']);
    await queryInterface.addIndex('project_category_assignments', ['category_id']);
    
    await queryInterface.addIndex('article_publications', ['article_slug']);
    await queryInterface.addIndex('article_publications', ['author_id']);
    await queryInterface.addIndex('article_publications', ['publication_status', 'publication_date']);
    
    await queryInterface.addIndex('article_category_assignments', ['article_id']);
    await queryInterface.addIndex('article_category_assignments', ['category_id']);
    
    await queryInterface.addIndex('article_tag_assignments', ['article_id']);
    await queryInterface.addIndex('article_tag_assignments', ['tag_id']);
    
    await queryInterface.addIndex('technical_expertise', ['expertise_slug']);
    
    await queryInterface.addIndex('professional_expertise', ['account_id']);
    await queryInterface.addIndex('professional_expertise', ['category_id']);
    await queryInterface.addIndex('professional_expertise', ['is_featured']);
    
    await queryInterface.addIndex('project_technology_assignments', ['project_id']);
    await queryInterface.addIndex('project_technology_assignments', ['expertise_id']);
    
    await queryInterface.addIndex('professional_services', ['service_slug']);
    await queryInterface.addIndex('professional_services', ['category_id']);
    await queryInterface.addIndex('professional_services', ['service_status']);
    await queryInterface.addIndex('professional_services', ['is_featured']);
    
    await queryInterface.addIndex('digital_assets', ['uploaded_by']);
    await queryInterface.addIndex('digital_assets', ['mime_type']);
    
    await queryInterface.addIndex('project_asset_associations', ['project_id']);
    await queryInterface.addIndex('project_asset_associations', ['asset_id']);
    
    await queryInterface.addIndex('article_asset_associations', ['article_id']);
    await queryInterface.addIndex('article_asset_associations', ['asset_id']);
    
    await queryInterface.addIndex('service_asset_associations', ['service_id']);
    await queryInterface.addIndex('service_asset_associations', ['asset_id']);
    
    await queryInterface.addIndex('client_inquiries', ['client_email']);
    await queryInterface.addIndex('client_inquiries', ['inquiry_status']);
    
    await queryInterface.addIndex('newsletter_subscribers', ['email_address']);
    await queryInterface.addIndex('newsletter_subscribers', ['unsubscribe_token']);
    await queryInterface.addIndex('newsletter_subscribers', ['subscription_status']);
  },

  async down(queryInterface, Sequelize) {
    // Drop tables in reverse order to respect foreign key constraints
    await queryInterface.dropTable('newsletter_subscribers');
    await queryInterface.dropTable('client_inquiries');
    await queryInterface.dropTable('service_asset_associations');
    await queryInterface.dropTable('article_asset_associations');
    await queryInterface.dropTable('project_asset_associations');
    await queryInterface.dropTable('digital_assets');
    await queryInterface.dropTable('professional_services');
    await queryInterface.dropTable('project_technology_assignments');
    await queryInterface.dropTable('professional_expertise');
    await queryInterface.dropTable('technical_expertise');
    await queryInterface.dropTable('article_tag_assignments');
    await queryInterface.dropTable('article_category_assignments');
    await queryInterface.dropTable('article_publications');
    await queryInterface.dropTable('project_category_assignments');
    await queryInterface.dropTable('portfolio_projects');
    await queryInterface.dropTable('site_configuration');
    await queryInterface.dropTable('content_tags');
    await queryInterface.dropTable('content_categories');
    await queryInterface.dropTable('password_recovery_requests');
    await queryInterface.dropTable('authentication_tokens');
    await queryInterface.dropTable('professional_accounts');
  }
};
