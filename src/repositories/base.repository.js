class BaseRepository {
  /**
   * Base repository for CRUD operations.
   * @param {Object} model - Sequelize model
   */
  constructor(model) {
    this.model = model;
  }

  /**
   * Get a record by ID.
   * @param {string} id - Record ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Found record or null
   */
  async findById(id, options = {}) {
    return this.model.findByPk(id, options);
  }

  /**
   * Get multiple records with pagination.
   * @param {Object} options - Query options
   * @param {number} page - Page number
   * @param {number} limit - Records per page
   * @returns {Promise<Object>} Paginated results
   */
  async findAll(options = {}, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    
    const { count, rows } = await this.model.findAndCountAll({
      ...options,
      offset,
      limit
    });

    return {
      data: rows,
      pagination: {
        total: count,
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        limit
      }
    };
  }

  /**
   * Create a new record.
   * @param {Object} data - Record data
   * @param {Object} options - Create options
   * @returns {Promise<Object>} Created record
   */
  async create(data, options = {}) {
    return this.model.create(data, options);
  }

  /**
   * Update a record.
   * @param {string} id - Record ID
   * @param {Object} data - Update data
   * @param {Object} options - Update options
   * @returns {Promise<Object>} Updated record
   */
  async update(id, data, options = {}) {
    const [updated] = await this.model.update(data, {
      where: { id },
      ...options
    });

    if (!updated) {
      throw new Error('Record not found');
    }

    return this.findById(id);
  }

  /**
   * Delete a record.
   * @param {string} id - Record ID
   * @param {Object} options - Delete options
   * @returns {Promise<boolean>} Success indicator
   */
  async delete(id, options = {}) {
    const deleted = await this.model.destroy({
      where: { id },
      ...options
    });

    return Boolean(deleted);
  }

  /**
   * Find one record by criteria.
   * @param {Object} criteria - Search criteria
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Found record or null
   */
  async findOne(criteria, options = {}) {
    return this.model.findOne({
      where: criteria,
      ...options
    });
  }

  /**
   * Count records by criteria.
   * @param {Object} criteria - Count criteria
   * @returns {Promise<number>} Record count
   */
  async count(criteria = {}) {
    return this.model.count({
      where: criteria
    });
  }
}

module.exports = BaseRepository; 