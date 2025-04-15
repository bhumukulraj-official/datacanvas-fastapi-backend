#!/bin/bash
# Install all necessary dependencies for the DataCanvasDev backend

echo "Starting installation..."

# Core packages
npm install express@^4.18.2
npm install cors@^2.8.5
npm install helmet@^7.1.0
npm install express-rate-limit@^7.1.5
npm install compression@^1.7.4
npm install dotenv@^16.4.5

# Database packages
npm install pg@^8.11.3
npm install pg-hstore@^2.3.4
npm install sequelize@^6.37.1
npm install sequelize-cli@^6.6.2

# Security packages
npm install bcrypt@^5.1.1
npm install jsonwebtoken@^9.0.2
npm install cookie-parser@^1.4.6

# Utility packages
npm install multer@^1.4.5-lts.1
npm install sharp@^0.33.2
npm install redis@^4.6.13
npm install nodemailer@^6.9.9
npm install joi@^17.12.2
npm install winston@^3.11.0
npm install swagger-ui-express@^5.0.0

# Development packages
npm install --save-dev nodemon@^3.0.3
npm install --save-dev eslint@^8.57.0
npm install --save-dev jest@^29.7.0
npm install --save-dev supertest@^6.3.4

echo "Installation completed!"
echo "To install AWS SDK, run: npm install aws-sdk@^2.1564.0" 