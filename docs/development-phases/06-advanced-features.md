# Phase 6: Advanced Features

In this phase, we'll implement several advanced features to enhance our DataCanvasDev application, including caching for improved performance, background tasks for asynchronous operations, and email integration for user communication.

## Step 1: Redis Cache Implementation

First, let's set up Redis caching to improve API response times. Add the necessary configuration in `app/core/config.py`:

```python
# Add these settings to your existing config.py
class Settings(BaseSettings):
    # ... existing settings ...
    
    # Redis Settings
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    REDIS_PASSWORD: Optional[str] = None
    
    # Cache Settings
    CACHE_EXPIRATION_SECONDS: int = 300  # 5 minutes default cache expiration
    CACHE_ENABLED: bool = True
```

Now, let's implement the cache service in `app/services/cache.py`:

```python
import json
import logging
from typing import Any, Dict, Optional, Union, List
from uuid import UUID

import redis
from fastapi import Depends

from app.core.config import settings

logger = logging.getLogger(__name__)


class UUIDEncoder(json.JSONEncoder):
    """Custom JSON encoder for UUID objects."""
    def default(self, obj):
        if isinstance(obj, UUID):
            return str(obj)
        return json.JSONEncoder.default(self, obj)


class CacheService:
    """Service for Redis caching."""
    
    def __init__(self):
        """Initialize the Redis client."""
        self.enabled = settings.CACHE_ENABLED
        
        if self.enabled:
            try:
                self.redis = redis.Redis(
                    host=settings.REDIS_HOST,
                    port=settings.REDIS_PORT,
                    db=settings.REDIS_DB,
                    password=settings.REDIS_PASSWORD,
                    decode_responses=True
                )
                self.default_expiration = settings.CACHE_EXPIRATION_SECONDS
                logger.info("Redis cache initialized successfully")
            except redis.RedisError as e:
                logger.error(f"Redis connection error: {str(e)}")
                self.enabled = False
    
    def _format_key(self, key: str) -> str:
        """
        Format a cache key with prefix.
        
        Args:
            key: Cache key
            
        Returns:
            Formatted cache key
        """
        return f"datacanvas:{key}"
    
    def get(self, key: str) -> Optional[Any]:
        """
        Get a value from cache.
        
        Args:
            key: Cache key
            
        Returns:
            Cached value or None if not found
        """
        if not self.enabled:
            return None
        
        formatted_key = self._format_key(key)
        
        try:
            data = self.redis.get(formatted_key)
            if data:
                return json.loads(data)
            return None
        except Exception as e:
            logger.error(f"Error retrieving from cache: {str(e)}")
            return None
    
    def set(self, key: str, value: Any, expiration: Optional[int] = None) -> bool:
        """
        Set a value in cache.
        
        Args:
            key: Cache key
            value: Value to cache
            expiration: Optional expiration time in seconds
            
        Returns:
            True if successful, False otherwise
        """
        if not self.enabled:
            return False
        
        formatted_key = self._format_key(key)
        
        try:
            self.redis.set(
                formatted_key,
                json.dumps(value, cls=UUIDEncoder),
                ex=expiration or self.default_expiration
            )
            return True
        except Exception as e:
            logger.error(f"Error setting cache value: {str(e)}")
            return False
    
    def delete(self, key: str) -> bool:
        """
        Delete a value from cache.
        
        Args:
            key: Cache key
            
        Returns:
            True if successful, False otherwise
        """
        if not self.enabled:
            return False
        
        formatted_key = self._format_key(key)
        
        try:
            self.redis.delete(formatted_key)
            return True
        except Exception as e:
            logger.error(f"Error deleting cache key: {str(e)}")
            return False
    
    def invalidate_pattern(self, pattern: str) -> bool:
        """
        Invalidate all keys matching a pattern.
        
        Args:
            pattern: Key pattern to match
            
        Returns:
            True if successful, False otherwise
        """
        if not self.enabled:
            return False
        
        formatted_pattern = self._format_key(pattern)
        
        try:
            cursor = "0"
            while cursor != 0:
                cursor, keys = self.redis.scan(cursor=cursor, match=formatted_pattern)
                if keys:
                    self.redis.delete(*keys)
            return True
        except Exception as e:
            logger.error(f"Error invalidating cache pattern: {str(e)}")
            return False


# Singleton instance
cache_service = CacheService()


def get_cache_service() -> CacheService:
    """
    Get cache service singleton.
    
    Returns:
        Cache service instance
    """
    return cache_service
```

## Step 2: Implement Cache Middleware

Let's create a cache middleware to automatically cache API responses in `app/middleware/cache.py`:

```python
from typing import Callable, Optional
import hashlib
import time
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

from app.core.config import settings
from app.services.cache import get_cache_service


class CacheMiddleware(BaseHTTPMiddleware):
    """Middleware for caching API responses."""
    
    def __init__(
        self,
        app: ASGIApp,
        exclude_paths: Optional[list] = None,
        exclude_methods: Optional[list] = None
    ):
        """
        Initialize the cache middleware.
        
        Args:
            app: ASGI application
            exclude_paths: List of path prefixes to exclude from caching
            exclude_methods: List of HTTP methods to exclude from caching
        """
        super().__init__(app)
        self.cache_service = get_cache_service()
        self.exclude_paths = exclude_paths or ["/api/auth/"]
        self.exclude_methods = exclude_methods or ["POST", "PUT", "PATCH", "DELETE"]
    
    def _should_cache(self, request: Request) -> bool:
        """
        Determine if a request should be cached.
        
        Args:
            request: HTTP request
            
        Returns:
            True if request should be cached, False otherwise
        """
        # Check if caching is enabled
        if not settings.CACHE_ENABLED:
            return False
        
        # Don't cache excluded methods
        if request.method in self.exclude_methods:
            return False
        
        # Don't cache excluded paths
        for path in self.exclude_paths:
            if request.url.path.startswith(path):
                return False
        
        return True
    
    def _generate_cache_key(self, request: Request) -> str:
        """
        Generate a cache key for a request.
        
        Args:
            request: HTTP request
            
        Returns:
            Cache key string
        """
        # Generate a cache key based on path and query parameters
        key_parts = [
            request.method,
            request.url.path
        ]
        
        # Add query parameters
        query_params = sorted(request.query_params.items())
        if query_params:
            key_parts.extend([f"{k}={v}" for k, v in query_params])
        
        # Add authorization if present (to cache different responses per user)
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            # Don't use the actual token, just a hash of it
            token_hash = hashlib.md5(auth_header.encode()).hexdigest()
            key_parts.append(f"auth={token_hash}")
        
        return ":".join(key_parts)
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """
        Process a request and handle caching.
        
        Args:
            request: HTTP request
            call_next: Next middleware in chain
            
        Returns:
            HTTP response
        """
        # Check if request should be cached
        if not self._should_cache(request):
            return await call_next(request)
        
        # Generate cache key
        cache_key = self._generate_cache_key(request)
        
        # Try to get from cache
        cached_response = self.cache_service.get(cache_key)
        if cached_response:
            # Return cached response
            content = cached_response.get("content")
            status_code = cached_response.get("status_code")
            content_type = cached_response.get("content_type")
            
            response = Response(
                content=content,
                status_code=status_code,
                media_type=content_type
            )
            response.headers["X-Cache"] = "Hit"
            return response
        
        # Process request
        start_time = time.time()
        response = await call_next(request)
        
        # Only cache successful responses
        if 200 <= response.status_code < 400:
            # Get response content
            response_body = b""
            async for chunk in response.body_iterator:
                response_body += chunk
            
            # Cache response
            response_data = {
                "content": response_body.decode(),
                "status_code": response.status_code,
                "content_type": response.headers.get("Content-Type")
            }
            self.cache_service.set(cache_key, response_data)
            
            # Create a new response with the body we read
            new_response = Response(
                content=response_body,
                status_code=response.status_code,
                headers=dict(response.headers),
                media_type=response.media_type
            )
            new_response.headers["X-Cache"] = "Miss"
            new_response.headers["X-Cache-Time"] = str(round((time.time() - start_time) * 1000)) + "ms"
            
            return new_response
        
        return response
```

## Step 3: Implement Celery for Background Tasks

First, update the Celery configuration by adding these settings to `app/core/config.py`:

```python
# Add these settings to your existing config.py
class Settings(BaseSettings):
    # ... existing settings ...
    
    # Celery Settings
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/1"
```

Now, let's expand our worker implementation in `app/tasks/worker.py`:

```python
import logging
from celery import Celery
from celery.schedules import crontab

from app.core.config import settings

logger = logging.getLogger(__name__)

# Initialize Celery app
celery_app = Celery(
    "worker",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND
)

# Configure Celery
celery_app.conf.task_routes = {
    "app.tasks.worker.cleanup_orphaned_assets_task": "cleanup",
    "app.tasks.worker.send_email_task": "emails",
    "app.tasks.worker.revalidate_cache_task": "cache",
}

# Configure periodic tasks
celery_app.conf.beat_schedule = {
    "cleanup-orphaned-assets-daily": {
        "task": "app.tasks.worker.cleanup_orphaned_assets_task",
        "schedule": crontab(hour=3, minute=0),  # Run at 3:00 AM every day
    },
}


@celery_app.task
def cleanup_orphaned_assets_task():
    """Celery task to clean up orphaned assets."""
    from app.tasks.cleanup import cleanup_orphaned_assets
    logger.info("Running scheduled orphaned asset cleanup task")
    cleanup_orphaned_assets()
    logger.info("Scheduled orphaned asset cleanup task completed")


@celery_app.task
def send_email_task(
    email_to: str,
    subject: str,
    html_template: str,
    environment: dict
):
    """
    Celery task to send email asynchronously.
    
    Args:
        email_to: Recipient email address
        subject: Email subject
        html_template: HTML template content
        environment: Template variables
    """
    from app.services.email import send_email
    logger.info(f"Sending email to {email_to}")
    send_email(email_to, subject, html_template, environment)
    logger.info(f"Email sent to {email_to}")


@celery_app.task
def revalidate_cache_task(pattern: str):
    """
    Celery task to invalidate cache matching a pattern.
    
    Args:
        pattern: Cache key pattern to invalidate
    """
    from app.services.cache import get_cache_service
    logger.info(f"Invalidating cache pattern: {pattern}")
    cache_service = get_cache_service()
    cache_service.invalidate_pattern(pattern)
    logger.info(f"Cache invalidated for pattern: {pattern}")
```

## Step 4: Enhanced Email Service

Let's expand our email service in `app/services/email.py` to support templates and asynchronous sending:

```python
import logging
import os
from pathlib import Path
from typing import Any, Dict, List, Optional

import emails
from emails.template import JinjaTemplate
from fastapi import BackgroundTasks

from app.core.config import settings
from app.tasks.worker import send_email_task

logger = logging.getLogger(__name__)


def send_email(
    email_to: str,
    subject: str,
    html_template: str,
    environment: Dict[str, Any]
) -> None:
    """
    Send an email using the configured email provider.
    
    Args:
        email_to: Recipient email address
        subject: Email subject
        html_template: HTML template content
        environment: Template variables
    """
    message = emails.Message(
        subject=subject,
        html=JinjaTemplate(html_template),
        mail_from=(settings.EMAILS_FROM_NAME, settings.EMAILS_FROM_EMAIL),
    )
    
    # Attempt to send email
    try:
        response = message.send(
            to=email_to,
            render=environment,
            smtp={
                "host": settings.SMTP_HOST,
                "port": settings.SMTP_PORT,
                "tls": settings.SMTP_TLS,
                "user": settings.SMTP_USER,
                "password": settings.SMTP_PASSWORD,
            }
        )
        
        if response.status_code not in (250, 200, 201, 202):
            logger.error(f"Error sending email: {response}")
            logger.error(f"Email subject: {subject}")
            return
        
        logger.info(f"Email sent successfully to {email_to}")
    except Exception as e:
        logger.exception(f"Failed to send email to {email_to}: {e}")


def send_email_async(
    email_to: str,
    subject: str,
    html_template: str,
    environment: Dict[str, Any]
) -> None:
    """
    Send an email asynchronously using Celery.
    
    Args:
        email_to: Recipient email address
        subject: Email subject
        html_template: HTML template content
        environment: Template variables
    """
    send_email_task.delay(
        email_to=email_to,
        subject=subject,
        html_template=html_template,
        environment=environment
    )


def send_email_background(
    background_tasks: BackgroundTasks,
    email_to: str,
    subject: str,
    html_template: str,
    environment: Dict[str, Any]
) -> None:
    """
    Send an email using FastAPI background tasks.
    
    Args:
        background_tasks: FastAPI background tasks
        email_to: Recipient email address
        subject: Email subject
        html_template: HTML template content
        environment: Template variables
    """
    background_tasks.add_task(
        send_email,
        email_to=email_to,
        subject=subject,
        html_template=html_template,
        environment=environment
    )


def send_test_email(email_to: str) -> None:
    """
    Send a test email.
    
    Args:
        email_to: Recipient email address
    """
    subject = f"{settings.APP_NAME} - Test Email"
    
    html_template = """
    <div>
        <h1>Test Email</h1>
        <p>This is a test email from {{ app_name }}.</p>
        <p>If you received this email, it means your email configuration is working correctly.</p>
        <p>Regards,<br>{{ app_name }} Team</p>
    </div>
    """
    
    environment = {
        "app_name": settings.APP_NAME
    }
    
    send_email_async(email_to, subject, html_template, environment)


def send_newsletter_email(
    email_to: str,
    subscriber_name: Optional[str],
    subject: str,
    content: str,
    unsubscribe_token: str
) -> None:
    """
    Send a newsletter email.
    
    Args:
        email_to: Recipient email address
        subscriber_name: Subscriber name
        subject: Email subject
        content: Newsletter content
        unsubscribe_token: Unsubscribe token
    """
    html_template = """
    <div>
        <h1>{{ subject }}</h1>
        {% if subscriber_name %}
        <p>Hello {{ subscriber_name }},</p>
        {% else %}
        <p>Hello,</p>
        {% endif %}
        
        <div>{{ content | safe }}</div>
        
        <p>
            <small>
                If you no longer wish to receive these emails, you can 
                <a href="{{ unsubscribe_url }}">unsubscribe here</a>.
            </small>
        </p>
        
        <p>Regards,<br>{{ app_name }} Team</p>
    </div>
    """
    
    environment = {
        "subject": subject,
        "subscriber_name": subscriber_name,
        "content": content,
        "unsubscribe_url": f"{settings.FRONTEND_URL}/newsletter/unsubscribe/{unsubscribe_token}",
        "app_name": settings.APP_NAME
    }
    
    send_email_async(email_to, subject, html_template, environment)


def send_inquiry_notification(
    admin_email: str,
    client_name: str,
    client_email: str,
    subject: str,
    message: str
) -> None:
    """
    Send a notification about a new client inquiry.
    
    Args:
        admin_email: Admin email address
        client_name: Client name
        client_email: Client email
        subject: Inquiry subject
        message: Inquiry message
    """
    email_subject = f"{settings.APP_NAME} - New Inquiry: {subject}"
    
    html_template = """
    <div>
        <h1>New Client Inquiry</h1>
        <p>You have received a new inquiry from a potential client:</p>
        
        <p><strong>Client Name:</strong> {{ client_name }}</p>
        <p><strong>Client Email:</strong> {{ client_email }}</p>
        <p><strong>Subject:</strong> {{ subject }}</p>
        
        <h2>Message:</h2>
        <p>{{ message }}</p>
        
        <p>You can respond to this inquiry directly by replying to the client's email.</p>
        <p>Regards,<br>{{ app_name }} System</p>
    </div>
    """
    
    environment = {
        "client_name": client_name,
        "client_email": client_email,
        "subject": subject,
        "message": message,
        "app_name": settings.APP_NAME
    }
    
    send_email_async(admin_email, email_subject, html_template, environment)
```

## Step 5: Implement Webhooks for Content Revalidation

Let's create a webhook service for content revalidation. First, add these settings to `app/core/config.py`:

```python
# Add these settings to your existing config.py
class Settings(BaseSettings):
    # ... existing settings ...
    
    # Webhook Settings
    WEBHOOK_SECRET_KEY: str = "your-webhook-secret-key"
```

Now, let's implement the webhook endpoints in `app/api/v1/endpoints/webhooks.py`:

```python
from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Header

from app.core.config import settings
from app.services.cache import get_cache_service
from app.tasks.worker import revalidate_cache_task

router = APIRouter()


@router.post("/revalidate-content", status_code=status.HTTP_200_OK)
async def revalidate_content(
    payload: Dict[str, Any],
    background_tasks: BackgroundTasks,
    x_webhook_secret: str = Header(None)
) -> Dict[str, Any]:
    """
    Webhook endpoint to revalidate cached content.
    
    Args:
        payload: Webhook payload
        background_tasks: FastAPI background tasks
        x_webhook_secret: Webhook secret key header
        
    Returns:
        Response indicating revalidation status
    """
    # Verify webhook secret
    if not x_webhook_secret or x_webhook_secret != settings.WEBHOOK_SECRET_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid webhook secret"
        )
    
    # Get content path from payload
    content_path = payload.get("contentPath")
    if not content_path:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing contentPath in payload"
        )
    
    # Convert content path to cache pattern
    cache_pattern = f"*{content_path}*"
    
    # Revalidate cache in background
    background_tasks.add_task(
        revalidate_cache_task.delay,
        pattern=cache_pattern
    )
    
    return {
        "revalidated": True,
        "path": content_path
    }
```

## Step 6: Implement Newsletter Service

Let's create a newsletter service in `app/services/newsletter.py`:

```python
import uuid
from typing import List, Optional
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.newsletter import NewsletterSubscriber
from app.services.email import send_newsletter_email


class NewsletterService:
    """Service for newsletter operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def subscribe(self, email: str, name: Optional[str] = None) -> NewsletterSubscriber:
        """
        Subscribe to the newsletter.
        
        Args:
            email: Subscriber email address
            name: Optional subscriber name
            
        Returns:
            Created newsletter subscriber
        """
        # Check if email is already subscribed
        existing_subscriber = self.db.query(NewsletterSubscriber).filter(
            NewsletterSubscriber.emailAddress == email
        ).first()
        
        if existing_subscriber:
            # If already active, return existing subscriber
            if existing_subscriber.subscriptionStatus == "active":
                return existing_subscriber
            
            # Otherwise, reactivate subscription
            existing_subscriber.subscriptionStatus = "active"
            self.db.add(existing_subscriber)
            self.db.commit()
            self.db.refresh(existing_subscriber)
            return existing_subscriber
        
        # Create new subscriber
        unsubscribe_token = uuid.uuid4().hex
        subscriber = NewsletterSubscriber(
            emailAddress=email,
            subscriberName=name,
            unsubscribeToken=unsubscribe_token,
            subscriptionStatus="active"
        )
        
        self.db.add(subscriber)
        self.db.commit()
        self.db.refresh(subscriber)
        
        return subscriber
    
    def unsubscribe(self, token: str) -> bool:
        """
        Unsubscribe from the newsletter.
        
        Args:
            token: Unsubscribe token
            
        Returns:
            True if unsubscribed successfully, False otherwise
        """
        # Find subscriber by token
        subscriber = self.db.query(NewsletterSubscriber).filter(
            NewsletterSubscriber.unsubscribeToken == token
        ).first()
        
        if not subscriber:
            return False
        
        # Update subscription status
        subscriber.subscriptionStatus = "unsubscribed"
        self.db.add(subscriber)
        self.db.commit()
        
        return True
    
    def send_newsletter(self, subject: str, content: str) -> int:
        """
        Send newsletter to all active subscribers.
        
        Args:
            subject: Newsletter subject
            content: Newsletter content
            
        Returns:
            Number of recipients
        """
        # Get all active subscribers
        subscribers = self.db.query(NewsletterSubscriber).filter(
            NewsletterSubscriber.subscriptionStatus == "active"
        ).all()
        
        # Send newsletter to each subscriber
        for subscriber in subscribers:
            send_newsletter_email(
                email_to=subscriber.emailAddress,
                subscriber_name=subscriber.subscriberName,
                subject=subject,
                content=content,
                unsubscribe_token=subscriber.unsubscribeToken
            )
        
        return len(subscribers)


def get_newsletter_service(db: Session) -> NewsletterService:
    """
    Get newsletter service.
    
    Args:
        db: Database session
        
    Returns:
        Newsletter service
    """
    return NewsletterService(db)
```

## Step 7: Implement Client Inquiry Service

Let's create a client inquiry service in `app/services/inquiry.py`:

```python
from typing import List, Optional
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.inquiry import ClientInquiry
from app.services.email import send_inquiry_notification
from app.core.config import settings


class InquiryService:
    """Service for client inquiry operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def submit_inquiry(
        self, 
        name: str, 
        email: str, 
        subject: str, 
        message: str
    ) -> ClientInquiry:
        """
        Submit a client inquiry.
        
        Args:
            name: Client name
            email: Client email
            subject: Inquiry subject
            message: Inquiry message
            
        Returns:
            Created client inquiry
        """
        # Create inquiry record
        inquiry = ClientInquiry(
            clientName=name,
            clientEmail=email,
            inquirySubject=subject,
            inquiryMessage=message,
            inquiryStatus="unread"
        )
        
        self.db.add(inquiry)
        self.db.commit()
        self.db.refresh(inquiry)
        
        # Send notification to admin
        send_inquiry_notification(
            admin_email=settings.ADMIN_EMAIL,
            client_name=name,
            client_email=email,
            subject=subject,
            message=message
        )
        
        return inquiry
    
    def get_inquiries(
        self, 
        skip: int = 0, 
        limit: int = 10, 
        status: Optional[str] = None
    ) -> List[ClientInquiry]:
        """
        Get client inquiries with optional filtering.
        
        Args:
            skip: Number of records to skip
            limit: Maximum number of records to return
            status: Optional status filter
            
        Returns:
            List of client inquiries
        """
        query = self.db.query(ClientInquiry)
        
        # Apply status filter
        if status:
            query = query.filter(ClientInquiry.inquiryStatus == status)
        
        # Apply pagination and ordering
        inquiries = query.order_by(
            ClientInquiry.createdAt.desc()
        ).offset(skip).limit(limit).all()
        
        return inquiries
    
    def get_inquiry_by_id(self, inquiry_id: UUID) -> Optional[ClientInquiry]:
        """
        Get a client inquiry by ID.
        
        Args:
            inquiry_id: Inquiry ID
            
        Returns:
            Client inquiry or None if not found
        """
        inquiry = self.db.query(ClientInquiry).filter(
            ClientInquiry.inquiryId == inquiry_id
        ).first()
        
        return inquiry
    
    def update_inquiry_status(self, inquiry_id: UUID, status: str) -> ClientInquiry:
        """
        Update the status of a client inquiry.
        
        Args:
            inquiry_id: Inquiry ID
            status: New status
            
        Returns:
            Updated client inquiry
        """
        # Check if status is valid
        valid_statuses = ["unread", "read", "replied", "archived"]
        if status not in valid_statuses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
            )
        
        # Get inquiry
        inquiry = self.get_inquiry_by_id(inquiry_id)
        
        if not inquiry:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Inquiry not found"
            )
        
        # Update status
        inquiry.inquiryStatus = status
        self.db.add(inquiry)
        self.db.commit()
        self.db.refresh(inquiry)
        
        return inquiry
    
    def delete_inquiry(self, inquiry_id: UUID) -> bool:
        """
        Delete a client inquiry.
        
        Args:
            inquiry_id: Inquiry ID
            
        Returns:
            True if inquiry was deleted, False otherwise
        """
        inquiry = self.get_inquiry_by_id(inquiry_id)
        
        if not inquiry:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Inquiry not found"
            )
        
        self.db.delete(inquiry)
        self.db.commit()
        
        return True


def get_inquiry_service(db: Session) -> InquiryService:
    """
    Get inquiry service.
    
    Args:
        db: Database session
        
    Returns:
        Inquiry service
    """
    return InquiryService(db)
```

## Step 8: Register All Advanced Services

Update `src/app.js` to register our advanced features:

```javascript
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const winston = require('./utils/logger');
const cacheMiddleware = require('./middleware/cacheMiddleware');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./docs/swagger');

// Import routes
const authenticationRoutes = require('./api/authentication');
const portfolioRoutes = require('./api/portfolio');
const articlesRoutes = require('./api/articles');
const servicesRoutes = require('./api/services');
const expertiseRoutes = require('./api/expertise');
const inquiriesRoutes = require('./api/client-inquiries');
const newsletterRoutes = require('./api/newsletter');
const assetsRoutes = require('./api/digital-assets');
const configurationRoutes = require('./api/site-configuration');
const webhooksRoutes = require('./api/webhooks');

// Import middleware
const errorHandler = require('./middleware/errorHandling');

// Create Express app
const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(helmet());
app.use(compression());
app.use(morgan('combined', { stream: { write: message => winston.info(message.trim()) } }));

// Add cache middleware to API routes (excluding certain paths and methods)
app.use('/api', cacheMiddleware(
  [
    '/api/authentication/',
    '/api/digital-assets/upload',
    '/api/client-inquiries/submit',
    '/api/newsletter/subscribe',
    '/api/newsletter/unsubscribe/',
    '/api/webhooks/'
  ],
  ['POST', 'PUT', 'PATCH', 'DELETE']
));

// API routes
app.use('/api/authentication', authenticationRoutes);
app.use('/api/portfolio-projects', portfolioRoutes);
app.use('/api/articles', articlesRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/expertise', expertiseRoutes);
app.use('/api/client-inquiries', inquiriesRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/digital-assets', assetsRoutes);
app.use('/api/site-configuration', configurationRoutes);
app.use('/api/webhooks', webhooksRoutes);

// Swagger documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));
app.get('/api/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpecs);
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: `Welcome to ${process.env.APP_NAME || 'DataCanvasDev'} API`,
    documentation: '/api/docs',
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Error handling middleware (should be last)
app.use(errorHandler);

// Setup event listeners for graceful shutdown
process.on('SIGTERM', () => {
  winston.info('SIGTERM received, shutting down gracefully');
  // Close database connections, Redis, etc.
  process.exit(0);
});

process.on('SIGINT', () => {
  winston.info('SIGINT received, shutting down gracefully');
  // Close database connections, Redis, etc.
  process.exit(0);
});

// Export the app for server.js to use
module.exports = app;
```

This completes the implementation of advanced features for our DataCanvasDev application. In the next phase, we'll focus on testing and quality assurance to ensure the reliability and robustness of our API. 