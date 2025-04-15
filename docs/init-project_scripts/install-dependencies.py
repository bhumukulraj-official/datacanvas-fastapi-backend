#!/usr/bin/env python3
import subprocess
import sys
import time
from typing import List, Tuple

def check_dependency(command: str, name: str) -> bool:
    """Check if a dependency is installed."""
    try:
        subprocess.run(command, shell=True, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        print(f"✓ {name} is installed")
        return True
    except subprocess.CalledProcessError:
        print(f"✗ {name} is not installed")
        return False

def run_command(command: str, success_message: str) -> bool:
    """Run a command and print success message if successful."""
    try:
        subprocess.run(command, shell=True, check=True)
        print(f"✓ {success_message}")
        time.sleep(2)  # Add 2-second delay after successful installation
        return True
    except subprocess.CalledProcessError:
        print(f"✗ Failed to install: {success_message}")
        time.sleep(2)  # Add 2-second delay even after failed installation
        return False

def install_packages(packages: List[Tuple[str, str]], is_dev: bool = False) -> None:
    """Install a list of yarn packages."""
    for package, message in packages:
        command = f"yarn add {'--dev' if is_dev else ''} {package}"
        run_command(command, message)

def main():
    print("Checking dependencies...")
    
    # Check Node.js installation
    if not check_dependency("node --version", "Node.js"):
        print("\nPlease install Node.js first. You can download it from https://nodejs.org/")
        sys.exit(1)
    
    # Check Yarn installation
    if not check_dependency("yarn --version", "Yarn"):
        print("\nPlease install Yarn first. You can install it using npm: npm install -g yarn")
        sys.exit(1)

    print("\nStarting installation...")

    # Core packages
    print("\nInstalling core packages...")
    core_packages = [
        ("express@^4.18.2", "Express installed"),
        ("cors@^2.8.5", "CORS installed"),
        ("helmet@^7.1.0", "Helmet installed"),
        ("express-rate-limit@^7.1.5", "Express Rate Limit installed"),
        ("compression@^1.7.4", "Compression installed"),
        ("dotenv@^16.4.5", "Dotenv installed")
    ]
    install_packages(core_packages)

    # Database packages
    print("\nInstalling database packages...")
    db_packages = [
        ("pg@^8.11.3", "PostgreSQL client installed"),
        ("pg-hstore@^2.3.4", "PostgreSQL HStore installed"),
        ("sequelize@^6.37.1", "Sequelize installed"),
        ("sequelize-cli@^6.6.2", "Sequelize CLI installed")
    ]
    install_packages(db_packages)

    # Security packages
    print("\nInstalling security packages...")
    security_packages = [
        ("bcrypt@^5.1.1", "Bcrypt installed"),
        ("jsonwebtoken@^9.0.2", "JSON Web Token installed"),
        ("cookie-parser@^1.4.6", "Cookie Parser installed")
    ]
    install_packages(security_packages)

    # Utility packages
    print("\nInstalling utility packages...")
    utility_packages = [
        ("multer@^1.4.5-lts.1", "Multer installed"),
        ("sharp@^0.33.2", "Sharp installed"),
        ("redis@^4.6.13", "Redis installed"),
        ("nodemailer@^6.9.9", "Nodemailer installed"),
        ("joi@^17.12.2", "Joi installed"),
        ("winston@^3.11.0", "Winston installed"),
        ("swagger-ui-express@^5.0.0", "Swagger UI Express installed"),
        ("aws-sdk@^2.1564.0", "AWS SDK installed"),
        ("lodash@^4.17.21", "Lodash installed")
    ]
    install_packages(utility_packages)

    # Development packages
    print("\nInstalling development packages...")
    dev_packages = [
        ("nodemon@^3.0.3", "Nodemon installed"),
        ("eslint@^8.57.0", "ESLint installed"),
        ("jest@^29.7.0", "Jest installed"),
        ("supertest@^6.3.4", "Supertest installed")
    ]
    install_packages(dev_packages, is_dev=True)

    print("\nInstallation completed!")

if __name__ == "__main__":
    main() 