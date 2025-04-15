require('dotenv').config();

module.exports = {
  host: process.env.EMAIL_HOST || 'smtp.example.com',
  port: parseInt(process.env.EMAIL_PORT || '587', 10),
  secure: process.env.EMAIL_SECURE === 'true',
  user: process.env.EMAIL_USER || 'user@example.com',
  password: process.env.EMAIL_PASSWORD || 'password',
  fromEmail: process.env.EMAIL_FROM || 'noreply@datacanvasdev.com',
  fromName: process.env.EMAIL_FROM_NAME || 'DataCanvasDev'
};
