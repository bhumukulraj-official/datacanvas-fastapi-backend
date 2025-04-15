const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ClientInquiry = sequelize.define('ClientInquiry', {
    inquiryId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      field: 'inquiry_id'
    },
    clientName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'client_name'
    },
    clientEmail: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'client_email'
    },
    inquirySubject: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'inquiry_subject'
    },
    inquiryMessage: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'inquiry_message'
    },
    inquiryStatus: {
      type: DataTypes.ENUM('unread', 'read', 'replied', 'archived'),
      allowNull: false,
      defaultValue: 'unread',
      field: 'inquiry_status'
    }
  }, {
    tableName: 'client_inquiries',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['client_email'] },
      { fields: ['inquiry_status'] }
    ]
  });

  return {
    ClientInquiry
  };
}; 