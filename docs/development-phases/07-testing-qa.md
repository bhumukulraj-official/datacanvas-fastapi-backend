# Phase 7: Testing and Quality Assurance

In this phase, we'll implement testing strategies and quality assurance measures to ensure the reliability and robustness of our DataCanvasDev API.

## Step 1: Setting Up Testing Environment

First, let's configure our testing environment. We'll use Jest as our testing framework and Supertest for HTTP assertions:

```bash
npm install --save-dev jest supertest cross-env
```

Update your `package.json` to include test scripts:

```json
"scripts": {
  "test": "cross-env NODE_ENV=test jest --forceExit --detectOpenHandles",
  "test:watch": "cross-env NODE_ENV=test jest --watch",
  "test:coverage": "cross-env NODE_ENV=test jest --coverage"
}
```

Let's create a test configuration file in `jest.config.js`:

```javascript
module.exports = {
  testEnvironment: 'node',
  coveragePathIgnorePatterns: [
    '/node_modules/'
  ],
  coverageReporters: [
    'text',
    'lcov',
    'clover'
  ],
  testMatch: [
    '**/tests/**/*.test.js'
  ],
  verbose: true
};
```

## Step 2: Creating Test Database Config

Create a test database configuration in `src/config/database.js` (if not already present):

```javascript
// Test database configuration
test: {
  url: process.env.DATABASE_TEST_URL,
  dialect: 'postgres',
  logging: false,
  define: {
    timestamps: true,
    underscored: true,
    underscoredAll: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
}
```

## Step 3: Creating Test Helper Functions

Create a test utility file in `tests/utils/testUtils.js`:

```javascript
const { sequelize } = require('../../src/db/models');

/**
 * Setup database for testing
 */
const setupTestDB = async () => {
  // Recreate tables
  await sequelize.sync({ force: true });
};

/**
 * Generate test JWT token
 * @param {Object} user - User object
 * @returns {string} JWT token
 */
const generateTestToken = (user) => {
  const jwt = require('jsonwebtoken');
  const config = require('../../src/config');
  
  return jwt.sign(
    { 
      sub: user.accountId,
      role: user.accountRole,
      type: 'access'
    },
    config.auth.jwtSecret,
    { expiresIn: '1h' }
  );
};

module.exports = {
  setupTestDB,
  generateTestToken
};
```

## Step 4: Unit Testing Core Services

Let's write a unit test for our authentication service in `tests/services/test_authentication.py`:

```python
import pytest
from datetime import datetime

from app.services.authentication import AuthenticationService
from app.models.account import ProfessionalAccount, AuthenticationToken
from app.core.security import get_password_hash


def test_authenticate_user_success(db):
    """Test successful user authentication."""
    # Create a test user
    user = ProfessionalAccount(
        username="authuser",
        emailAddress="auth@example.com",
        passwordHash=get_password_hash("securepass"),
        accountRole="user",
        isAccountActive=True
    )
    db.add(user)
    db.commit()
    
    # Test authentication with email
    auth_service = AuthenticationService(db)
    authenticated_user = auth_service.authenticate_user("auth@example.com", "securepass")
    
    # Verify authentication succeeded
    assert authenticated_user is not None
    assert authenticated_user.accountId == user.accountId
    assert authenticated_user.username == "authuser"
    
    # Test authentication with username
    authenticated_user = auth_service.authenticate_user("authuser", "securepass")
    assert authenticated_user is not None
    
    # Verify last login time was updated
    assert authenticated_user.lastLoginTime is not None


def test_authenticate_user_failure(db):
    """Test failed user authentication."""
    # Create a test user
    user = ProfessionalAccount(
        username="failuser",
        emailAddress="fail@example.com",
        passwordHash=get_password_hash("securepass"),
        accountRole="user",
        isAccountActive=True
    )
    db.add(user)
    db.commit()
    
    # Test with wrong password
    auth_service = AuthenticationService(db)
    authenticated_user = auth_service.authenticate_user("fail@example.com", "wrongpass")
    assert authenticated_user is None
    
    # Test with non-existent user
    authenticated_user = auth_service.authenticate_user("nonexistent@example.com", "securepass")
    assert authenticated_user is None


def test_create_user_tokens(db, test_user):
    """Test creating access and refresh tokens."""
    auth_service = AuthenticationService(db)
    tokens = auth_service.create_user_tokens(test_user["id"])
    
    # Verify tokens were created
    assert "accessToken" in tokens
    assert "refreshToken" in tokens
    assert tokens["tokenType"] == "bearer"
    
    # Verify refresh token was stored in database
    db_token = db.query(AuthenticationToken).filter(
        AuthenticationToken.accountId == test_user["id"],
        AuthenticationToken.tokenValue == tokens["refreshToken"]
    ).first()
    
    assert db_token is not None
    assert db_token.expirationDate > datetime.utcnow()
```

## Step 5: Integration Testing of API Endpoints

Let's create an integration test for authentication endpoints in `tests/api/v1/test_authentication.py`:

```python
def test_login(client, test_user):
    """Test user login endpoint."""
    # Test valid login with email
    response = client.post(
        "/api/auth/login",
        data={
            "username": test_user["email"],
            "password": test_user["password"]
        }
    )
    
    # Verify response
    assert response.status_code == 200
    data = response.json()
    assert "accessToken" in data
    assert "refreshToken" in data
    assert data["tokenType"] == "bearer"
    
    # Test valid login with username
    response = client.post(
        "/api/auth/login",
        data={
            "username": test_user["username"],
            "password": test_user["password"]
        }
    )
    assert response.status_code == 200
    
    # Test invalid login (wrong password)
    response = client.post(
        "/api/auth/login",
        data={
            "username": test_user["email"],
            "password": "wrongpassword"
        }
    )
    assert response.status_code == 401
    
    # Test invalid login (non-existent user)
    response = client.post(
        "/api/auth/login",
        data={
            "username": "nonexistent@example.com",
            "password": test_user["password"]
        }
    )
    assert response.status_code == 401


def test_refresh_token(client, test_user):
    """Test refresh token endpoint."""
    # Login to get tokens
    response = client.post(
        "/api/auth/login",
        data={
            "username": test_user["email"],
            "password": test_user["password"]
        }
    )
    
    initial_tokens = response.json()
    
    # Refresh token
    response = client.post(
        "/api/auth/refresh-token",
        json={"refreshToken": initial_tokens["refreshToken"]}
    )
    
    # Verify response
    assert response.status_code == 200
    new_tokens = response.json()
    assert "accessToken" in new_tokens
    assert "refreshToken" in new_tokens
    
    # Verify new tokens are different
    assert new_tokens["accessToken"] != initial_tokens["accessToken"]
    assert new_tokens["refreshToken"] != initial_tokens["refreshToken"]
    
    # Test with invalid refresh token
    response = client.post(
        "/api/auth/refresh-token",
        json={"refreshToken": "invalid-token"}
    )
    assert response.status_code == 401
```

## Step 6: Creating Portfolio Project API Tests

Let's create tests for the portfolio project endpoints in `tests/api/v1/test_portfolios.py`:

```python
import pytest
from uuid import UUID

from app.models.configuration import ContentCategory


@pytest.fixture
def create_test_categories(db):
    """Create test categories for projects."""
    category1 = ContentCategory(
        categoryName="Web Development",
        categorySlug="web-development",
        categoryType="project"
    )
    category2 = ContentCategory(
        categoryName="Mobile Apps",
        categorySlug="mobile-apps",
        categoryType="project"
    )
    db.add(category1)
    db.add(category2)
    db.commit()
    db.refresh(category1)
    db.refresh(category2)
    
    return [category1, category2]


def test_create_portfolio_project(client, admin_auth_header, create_test_categories):
    """Test creating a portfolio project."""
    categories = create_test_categories
    
    # Create project
    response = client.post(
        "/api/portfolio-projects/",
        json={
            "projectTitle": "Test API Project",
            "projectDescription": "Project created through API",
            "thumbnailImage": "https://example.com/test.jpg",
            "publicationStatus": "draft",
            "categories": [str(categories[0].categoryId)]
        },
        headers=admin_auth_header
    )
    
    # Verify response
    assert response.status_code == 201
    data = response.json()
    assert data["projectTitle"] == "Test API Project"
    assert data["projectDescription"] == "Project created through API"
    assert len(data["categories"]) == 1
    
    # Store project ID for later tests
    pytest.test_project_id = data["projectId"]


def test_update_portfolio_project(client, admin_auth_header, create_test_categories):
    """Test updating a portfolio project."""
    categories = create_test_categories
    
    # Update project
    response = client.put(
        f"/api/portfolio-projects/{pytest.test_project_id}",
        json={
            "projectTitle": "Updated API Project",
            "projectDescription": "Updated project description",
            "isFeatured": True,
            "publicationStatus": "published",
            "categories": [str(categories[0].categoryId), str(categories[1].categoryId)]
        },
        headers=admin_auth_header
    )
    
    # Verify response
    assert response.status_code == 200
    data = response.json()
    assert data["projectTitle"] == "Updated API Project"
    assert data["projectDescription"] == "Updated project description"
    assert data["isFeatured"] is True
    assert data["publicationStatus"] == "published"
    assert len(data["categories"]) == 2


def test_get_portfolio_projects(client):
    """Test getting portfolio projects."""
    # Get all projects
    response = client.get("/api/portfolio-projects/")
    
    # Verify response
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["projectId"] == pytest.test_project_id


def test_get_portfolio_project_by_slug(client):
    """Test getting a portfolio project by slug."""
    # Get project by slug
    response = client.get("/api/portfolio-projects/by-slug/updated-api-project")
    
    # Verify response
    assert response.status_code == 200
    data = response.json()
    assert data["projectId"] == pytest.test_project_id
    assert data["projectTitle"] == "Updated API Project"


def test_delete_portfolio_project(client, admin_auth_header):
    """Test deleting a portfolio project."""
    # Delete project
    response = client.delete(
        f"/api/portfolio-projects/{pytest.test_project_id}",
        headers=admin_auth_header
    )
    
    # Verify response
    assert response.status_code == 204
    
    # Try to get deleted project
    response = client.get(f"/api/portfolio-projects/{pytest.test_project_id}")
    
    # Verify project was deleted
    assert response.status_code == 404
```

## Step 7: Setting Up Code Quality Tools

### Create pyproject.toml for Tools Configuration

```toml
[tool.black]
line-length = 100
target-version = ['py39']
include = '\.pyi?$'
exclude = '''
/(
    \.git
  | \.hg
  | \.mypy_cache
  | \.tox
  | \.venv
  | _build
  | buck-out
  | build
  | dist
)/
'''

[tool.isort]
profile = "black"
line_length = 100
multi_line_output = 3

[tool.mypy]
python_version = "3.9"
warn_return_any = true
warn_unused_configs = true
disallow_untyped_defs = true
disallow_incomplete_defs = true

[[tool.mypy.overrides]]
module = "tests.*"
disallow_untyped_defs = false
disallow_incomplete_defs = false

[tool.pytest.ini_options]
testpaths = ["tests"]
filterwarnings = [
    "ignore::DeprecationWarning"
]
```

### Create .flake8 Configuration

```ini
[flake8]
max-line-length = 100
exclude = .git,__pycache__,build,dist,venv
ignore = E203, W503
```

## Step 8: Setting Up Pre-commit Hooks

Create a `.pre-commit-config.yaml` file:

```yaml
repos:
-   repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.4.0
    hooks:
    -   id: trailing-whitespace
    -   id: end-of-file-fixer
    -   id: check-yaml
    -   id: check-added-large-files
    -   id: debug-statements

-   repo: https://github.com/psf/black
    rev: 23.3.0
    hooks:
    -   id: black

-   repo: https://github.com/pycqa/isort
    rev: 5.12.0
    hooks:
    -   id: isort

-   repo: https://github.com/pycqa/flake8
    rev: 6.0.0
    hooks:
    -   id: flake8

-   repo: https://github.com/pre-commit/mirrors-mypy
    rev: v1.3.0
    hooks:
    -   id: mypy
        additional_dependencies: [
            "types-requests",
            "types-redis",
            "types-PyYAML",
            "sqlalchemy-stubs",
        ]
```

## Step 9: Creating a Makefile for Common Tasks

```makefile
.PHONY: setup dev test lint format clean migrate

# Set up development environment
setup:
	pip install -r requirements.txt
	pip install -r requirements-dev.txt
	pre-commit install

# Run development server
dev:
	uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Run tests
test:
	pytest -v tests

# Run code quality checks
lint:
	flake8 app tests
	mypy app
	black --check app tests
	isort --check app tests

# Format code
format:
	black app tests
	isort app tests

# Clean up Python cache files
clean:
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	find . -type d -name ".pytest_cache" -exec rm -rf {} +

# Run database migrations
migrate:
	alembic upgrade head

# Create a new database migration
migration:
	alembic revision --autogenerate -m "$(message)"

# Initialize database
init-db:
	python -m scripts.init_db
```

## Step 10: GitHub Actions CI/CD Workflow

Create a GitHub Actions workflow file in `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:14-alpine
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_datacanvas
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:alpine
        ports:
          - 6379:6379

    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.9'
        cache: 'pip'
    
    - name: Install dependencies
      run: |
        python -m pip install --upgrade pip
        pip install -r requirements.txt
        pip install -r requirements-dev.txt
    
    - name: Lint with flake8
      run: |
        flake8 app tests
    
    - name: Check formatting with black
      run: |
        black --check app tests
    
    - name: Type check with mypy
      run: |
        mypy app
    
    - name: Test with pytest
      env:
        TEST_DATABASE_URL: postgresql://postgres:postgres@localhost/test_datacanvas
        SECRET_KEY: test_secret_key
        ENVIRONMENT: test
      run: |
        pytest --cov=app --cov-report=xml
    
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage.xml
        fail_ci_if_error: true
```

## Step 11: Create requirements-dev.txt for Development Dependencies

```
# Testing
pytest==7.3.1
pytest-cov==4.1.0
httpx==0.24.0

# Linting and formatting
black==23.3.0
flake8==6.0.0
isort==5.12.0
mypy==1.3.0

# Type stubs
types-requests==2.30.0.0
types-redis==4.5.5.0
types-PyYAML==6.0.12.10
sqlalchemy-stubs==0.4

# Pre-commit
pre-commit==3.3.2
```

## Step 12: Running the Tests

```bash
# Install development dependencies
pip install -r requirements-dev.txt

# Run tests
pytest

# Run tests with coverage
pytest --cov=app

# Run specific test file
pytest tests/services/test_authentication.py

# Run specific test function
pytest tests/services/test_authentication.py::test_authenticate_user_success
```

With comprehensive tests in place, we can be confident in our application's reliability and robustness. In the next phase, we'll focus on documentation to ensure our API is well-documented and easy to use. 