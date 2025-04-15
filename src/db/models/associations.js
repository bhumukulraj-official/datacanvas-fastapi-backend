const { ProfessionalAccount, AuthenticationToken, PasswordRecoveryRequest } = require('./account');
const { ContentCategory, ContentTag, SiteConfiguration } = require('./configuration');
const { PortfolioProject, ProjectCategoryAssignment } = require('./portfolio');
const { ArticlePublication, ArticleCategoryAssignment, ArticleTagAssignment } = require('./article');
const { ProfessionalService } = require('./service');
const { TechnicalExpertise, ProfessionalExpertise, ProjectTechnologyAssignment } = require('./expertise');

module.exports = (sequelize) => {
  // Account associations
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

  // Category associations
  ContentCategory.belongsTo(ContentCategory, {
    as: 'parent',
    foreignKey: 'parentCategoryId'
  });
  ContentCategory.hasMany(ContentCategory, {
    as: 'children',
    foreignKey: 'parentCategoryId'
  });

  // Portfolio associations
  PortfolioProject.belongsTo(ProfessionalAccount, {
    foreignKey: 'accountId',
    as: 'account'
  });
  ProfessionalAccount.hasMany(PortfolioProject, {
    foreignKey: 'accountId',
    as: 'portfolioProjects'
  });

  PortfolioProject.belongsToMany(ContentCategory, {
    through: ProjectCategoryAssignment,
    foreignKey: 'projectId',
    otherKey: 'categoryId',
    as: 'categories'
  });
  ContentCategory.belongsToMany(PortfolioProject, {
    through: ProjectCategoryAssignment,
    foreignKey: 'categoryId',
    otherKey: 'projectId',
    as: 'projects'
  });

  // Article associations
  ArticlePublication.belongsTo(ProfessionalAccount, {
    foreignKey: 'authorId',
    as: 'author'
  });
  ProfessionalAccount.hasMany(ArticlePublication, {
    foreignKey: 'authorId',
    as: 'articles'
  });

  ArticlePublication.belongsToMany(ContentCategory, {
    through: ArticleCategoryAssignment,
    foreignKey: 'articleId',
    otherKey: 'categoryId',
    as: 'categories'
  });
  ContentCategory.belongsToMany(ArticlePublication, {
    through: ArticleCategoryAssignment,
    foreignKey: 'categoryId',
    otherKey: 'articleId',
    as: 'articles'
  });

  ArticlePublication.belongsToMany(ContentTag, {
    through: ArticleTagAssignment,
    foreignKey: 'articleId',
    otherKey: 'tagId',
    as: 'tags'
  });
  ContentTag.belongsToMany(ArticlePublication, {
    through: ArticleTagAssignment,
    foreignKey: 'tagId',
    otherKey: 'articleId',
    as: 'articles'
  });

  // Service associations
  ProfessionalService.belongsTo(ContentCategory, {
    foreignKey: 'categoryId',
    as: 'category'
  });
  ContentCategory.hasMany(ProfessionalService, {
    foreignKey: 'categoryId',
    as: 'services'
  });

  // Expertise associations
  ProfessionalExpertise.belongsTo(ProfessionalAccount, {
    foreignKey: 'accountId',
    as: 'account'
  });
  ProfessionalAccount.hasMany(ProfessionalExpertise, {
    foreignKey: 'accountId',
    as: 'expertise'
  });

  ProfessionalExpertise.belongsTo(ContentCategory, {
    foreignKey: 'categoryId',
    as: 'category'
  });
  ContentCategory.hasMany(ProfessionalExpertise, {
    foreignKey: 'categoryId',
    as: 'expertise'
  });

  PortfolioProject.belongsToMany(TechnicalExpertise, {
    through: ProjectTechnologyAssignment,
    foreignKey: 'projectId',
    otherKey: 'expertiseId',
    as: 'technologies'
  });
  TechnicalExpertise.belongsToMany(PortfolioProject, {
    through: ProjectTechnologyAssignment,
    foreignKey: 'expertiseId',
    otherKey: 'projectId',
    as: 'projects'
  });

  // Site configuration associations
  SiteConfiguration.belongsTo(ProfessionalAccount, {
    foreignKey: 'lastUpdatedBy',
    as: 'lastUpdatedByAccount'
  });
  ProfessionalAccount.hasMany(SiteConfiguration, {
    foreignKey: 'lastUpdatedBy',
    as: 'updatedConfigurations'
  });
}; 