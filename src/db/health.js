const { sequelize } = require('./models');

/**
 * Check database health and connectivity
 * @returns {Promise<Object>} Health status
 */
async function checkDatabaseHealth() {
  try {
    await sequelize.authenticate();
    
    // Run basic query to test functionality
    const [result] = await sequelize.query('SELECT 1+1 as result');
    const isWorking = result[0].result === 2;
    
    return {
      status: 'healthy',
      connected: true,
      working: isWorking,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      connected: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = {
  checkDatabaseHealth
}; 