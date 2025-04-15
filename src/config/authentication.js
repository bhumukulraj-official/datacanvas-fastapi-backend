require('dotenv').config();

module.exports = {
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
  tokenExpiration: process.env.JWT_EXPIRATION || '1h',
  extendedTokenExpiration: process.env.JWT_EXTENDED_EXPIRATION || '7d',
  refreshTokenExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
  refreshTokenExpirationDays: parseInt(process.env.JWT_REFRESH_EXPIRATION_DAYS || '7', 10),
  saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10),
  useCookies: process.env.USE_SECURE_COOKIES === 'true',
};
