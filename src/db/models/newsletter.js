const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const NewsletterSubscription = sequelize.define('NewsletterSubscription', {
    subscriptionId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      field: 'subscription_id'
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active'
    },
    subscriptionDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'subscription_date'
    },
    unsubscribeDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'unsubscribe_date'
    }
  }, {
    tableName: 'newsletter_subscriptions',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['email'] },
      { fields: ['is_active'] }
    ]
  });

  return {
    NewsletterSubscription
  };
}; 