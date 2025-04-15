const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ProfessionalAccount = sequelize.define('ProfessionalAccount', {
    accountId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      field: 'account_id'
    },
    username: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      field: 'username'
    },
    emailAddress: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: {
        isEmail: true
      },
      field: 'email_address'
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'password_hash'
    },
    accountRole: {
      type: DataTypes.ENUM('admin', 'user'),
      allowNull: false,
      defaultValue: 'user',
      field: 'account_role'
    },
    professionalBio: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'professional_bio'
    },
    profileImage: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'profile_image'
    },
    socialMediaProfiles: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'social_media_profiles'
    },
    isAccountActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_account_active'
    },
    lastLoginTime: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_login_time'
    }
  }, {
    tableName: 'professional_accounts',
    timestamps: true,
    underscored: true,
    indexes: [
      { unique: true, fields: ['username'] },
      { unique: true, fields: ['email_address'] },
      { fields: ['account_role'] }
    ]
  });

  const AuthenticationToken = sequelize.define('AuthenticationToken', {
    tokenId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      field: 'token_id'
    },
    accountId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'professional_accounts',
        key: 'account_id'
      },
      onDelete: 'CASCADE',
      field: 'account_id'
    },
    tokenValue: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: 'token_value'
    },
    expirationDate: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'expiration_date'
    }
  }, {
    tableName: 'authentication_tokens',
    timestamps: true,
    underscored: true,
    indexes: [
      { unique: true, fields: ['token_value'] },
      { fields: ['account_id'] }
    ]
  });

  const PasswordRecoveryRequest = sequelize.define('PasswordRecoveryRequest', {
    requestId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      field: 'request_id'
    },
    accountId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'professional_accounts',
        key: 'account_id'
      },
      onDelete: 'CASCADE',
      field: 'account_id'
    },
    recoveryToken: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: 'recovery_token'
    },
    expirationDate: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'expiration_date'
    },
    isUsed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_used'
    }
  }, {
    tableName: 'password_recovery_requests',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      { unique: true, fields: ['recovery_token'] },
      { fields: ['account_id'] }
    ]
  });

  // Define associations
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

  return {
    ProfessionalAccount,
    AuthenticationToken,
    PasswordRecoveryRequest
  };
}; 