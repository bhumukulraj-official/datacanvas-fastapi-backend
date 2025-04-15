#!/bin/bash
# Install all necessary dependencies for the DataCanvasDev backend

echo "Installing dependencies for DataCanvasDev backend..."

# Install Express and core packages
echo "Installing Express and core packages..."
npm install express cors helmet express-rate-limit compression dotenv

# Install database packages
echo "Installing database packages..."
npm install pg pg-hstore sequelize sequelize-cli

# Install security packages
echo "Installing security packages..."
npm install bcrypt jsonwebtoken cookie-parser

# Install utility packages
echo "Installing utility packages..."
npm install multer sharp aws-sdk redis nodemailer joi winston swagger-ui-express

# Install development dependencies
echo "Installing development dependencies..."
npm install --save-dev nodemon eslint jest supertest

echo "All dependencies installed successfully!" 