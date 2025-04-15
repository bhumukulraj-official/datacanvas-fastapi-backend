const { DataTypes } = require('sequelize');
const { sequelize } = require('./models');

/**
 * Create database functions for optimized operations
 */
async function createDatabaseFunctions() {
  // Function to generate slugs
  await sequelize.query(`
    CREATE OR REPLACE FUNCTION generate_slug(title text)
    RETURNS text AS $$
    DECLARE
      slug text;
      base_slug text;
      counter integer := 0;
      slug_exists boolean;
    BEGIN
      -- Convert to lowercase, replace spaces with hyphens, remove special chars
      base_slug := lower(regexp_replace(title, '[^a-zA-Z0-9\\s-]', '', 'g'));
      base_slug := regexp_replace(base_slug, '\\s+', '-', 'g');
      
      slug := base_slug;
      
      -- Check if slug exists and append counter if needed
      LOOP
        EXECUTE format('SELECT EXISTS(SELECT 1 FROM %I WHERE %I = $1)', TG_TABLE_NAME, TG_ARGV[0])
        INTO slug_exists
        USING slug;
        
        EXIT WHEN NOT slug_exists;
        
        counter := counter + 1;
        slug := base_slug || '-' || counter;
      END LOOP;
      
      RETURN slug;
    END;
    $$ LANGUAGE plpgsql;
  `);
  
  // Function to update timestamp fields
  await sequelize.query(`
    CREATE OR REPLACE FUNCTION update_timestamp()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = CURRENT_TIMESTAMP;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);
  
  // Function for category depth calculation
  await sequelize.query(`
    CREATE OR REPLACE FUNCTION calculate_category_depth()
    RETURNS TRIGGER AS $$
    DECLARE
      parent_depth integer;
    BEGIN
      IF NEW.parent_category_id IS NULL THEN
        NEW.hierarchy_level = 0;
      ELSE
        SELECT hierarchy_level INTO parent_depth FROM content_categories WHERE category_id = NEW.parent_category_id;
        NEW.hierarchy_level = parent_depth + 1;
        
        -- Check for circular references
        IF NEW.hierarchy_level > 10 THEN
          RAISE EXCEPTION 'Category depth limit exceeded - possible circular reference';
        END IF;
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);
  
  // Function to set publication date
  await sequelize.query(`
    CREATE OR REPLACE FUNCTION set_publication_date()
    RETURNS TRIGGER AS $$
    BEGIN
      IF NEW.publication_status = 'published' AND (OLD.publication_status != 'published' OR OLD.publication_status IS NULL) THEN
        NEW.publication_date = CURRENT_TIMESTAMP;
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);
  
  // Create triggers
  
  // Update timestamp trigger for professional_accounts
  await sequelize.query(`
    CREATE TRIGGER update_timestamp_professional_accounts
    BEFORE UPDATE ON professional_accounts
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();
  `);
  
  // Category depth trigger
  await sequelize.query(`
    CREATE TRIGGER update_category_depth
    BEFORE INSERT OR UPDATE ON content_categories
    FOR EACH ROW EXECUTE FUNCTION calculate_category_depth();
  `);
  
  // Publication date trigger for articles
  await sequelize.query(`
    CREATE TRIGGER set_publication_date_articles
    BEFORE UPDATE ON article_publications
    FOR EACH ROW EXECUTE FUNCTION set_publication_date();
  `);
  
  // Similar trigger for projects
  await sequelize.query(`
    CREATE TRIGGER set_publication_date_projects
    BEFORE UPDATE ON portfolio_projects
    FOR EACH ROW EXECUTE FUNCTION set_publication_date();
  `);
}

module.exports = {
  createDatabaseFunctions
}; 