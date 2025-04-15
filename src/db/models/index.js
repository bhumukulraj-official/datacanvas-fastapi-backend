const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const setupAssociations = require('./associations');
const config = require('../../config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(dbConfig.url, dbConfig);
const models = {};

// Import models
fs.readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== path.basename(__filename) &&
      file !== 'associations.js' &&
      file.slice(-3) === '.js'
    );
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize);
    Object.keys(model).forEach(modelName => {
      models[modelName] = model[modelName];
    });
  });

// Set up associations
setupAssociations(models);

module.exports = {
  sequelize,
  Sequelize,
  models
}; 