#!/bin/bash
# Install all necessary dependencies for the DataCanvasDev backend

echo "Installing dependencies for DataCanvasDev backend..."

# Function to install a single package
install_package() {
    local package=$1
    echo "Installing $package..."
    if npm install $package; then
        echo "✅ Successfully installed $package"
        return 0
    else
        echo "❌ Failed to install $package"
        return 1
    fi
}

# Function to install multiple packages one by one
install_packages() {
    local category=$1
    shift
    local packages=("$@")
    local total=${#packages[@]}
    local success=0
    local failed=()
    
    echo "Installing $category packages..."
    for package in "${packages[@]}"; do
        if install_package $package; then
            ((success++))
        else
            failed+=("$package")
        fi
    done
    
    echo "Installed $success/$total $category packages"
    if [ ${#failed[@]} -gt 0 ]; then
        echo "Failed packages: ${failed[*]}"
    fi
}

# Core packages
core_packages=("express" "cors" "helmet" "express-rate-limit" "compression" "dotenv")
install_packages "core" "${core_packages[@]}"

# Database packages
db_packages=("pg" "pg-hstore" "sequelize" "sequelize-cli")
install_packages "database" "${db_packages[@]}"

# Security packages
security_packages=("bcrypt" "jsonwebtoken" "cookie-parser")
install_packages "security" "${security_packages[@]}"

# Utility packages
utility_packages=("multer" "sharp" "redis" "nodemailer" "joi" "winston" "swagger-ui-express")
# aws-sdk is excluded as it takes too long to install
install_packages "utility" "${utility_packages[@]}"

# Development dependencies
dev_packages=("nodemon" "eslint" "jest" "supertest")
for package in "${dev_packages[@]}"; do
    echo "Installing dev dependency $package..."
    if npm install --save-dev $package; then
        echo "✅ Successfully installed $package"
    else
        echo "❌ Failed to install $package"
    fi
done

echo "All dependency installation attempts completed!"
echo "Please check the output for any failed installations."
echo "NOTE: aws-sdk was excluded from automatic installation as it takes too long."
echo "Please install aws-sdk manually using: npm install aws-sdk" 