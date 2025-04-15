const { sequelize } = require('./models');
const { models } = require('./models');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

async function initializeDatabase() {
  console.log('Initializing database...');
  
  try {
    // Create admin user if it doesn't exist
    const adminUser = await models.ProfessionalAccount.findOne({
      where: { username: 'admin' }
    });
    
    if (!adminUser) {
      console.log('Creating initial admin user');
      await models.ProfessionalAccount.create({
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
      const existingCategory = await models.ContentCategory.findOne({
        where: { categorySlug: category.slug }
      });
      
      if (!existingCategory) {
        console.log(`Creating category: ${category.name}`);
        await models.ContentCategory.create({
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