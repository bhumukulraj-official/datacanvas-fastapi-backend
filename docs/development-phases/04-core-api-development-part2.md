# Phase 4: Core API Development (Part 2)

In this part, we'll continue implementing our core API endpoints, focusing on articles, professional services, and expertise.

## Step 4: Implementing API Service for Articles

Let's implement the service for articles in `app/services/article.py`:

```python
from typing import List, Optional
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.models.content import (
    Article, 
    ArticleCategoryAssignment, 
    ArticleTagAssignment
)
from app.models.configuration import ContentCategory, ContentTag
from app.schemas.article import ArticleCreate, ArticleUpdate


class ArticleService:
    """Service for article operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_articles(
        self, 
        skip: int = 0, 
        limit: int = 10, 
        category_id: Optional[UUID] = None,
        tag_id: Optional[UUID] = None
    ) -> List[Article]:
        """
        Get published articles.
        
        Args:
            skip: Number of records to skip
            limit: Maximum number of records to return
            category_id: Filter by category ID
            tag_id: Filter by tag ID
            
        Returns:
            List of articles
        """
        query = self.db.query(Article).filter(
            Article.publicationStatus == "published"
        )
        
        # Apply category filter
        if category_id:
            query = query.join(
                ArticleCategoryAssignment, 
                Article.articleId == ArticleCategoryAssignment.articleId
            ).filter(
                ArticleCategoryAssignment.categoryId == category_id
            )
        
        # Apply tag filter
        if tag_id:
            query = query.join(
                ArticleTagAssignment, 
                Article.articleId == ArticleTagAssignment.articleId
            ).filter(
                ArticleTagAssignment.tagId == tag_id
            )
        
        # Load relationships
        query = query.options(
            joinedload(Article.category_assignments).joinedload(ArticleCategoryAssignment.category),
            joinedload(Article.tag_assignments).joinedload(ArticleTagAssignment.tag)
        )
        
        # Apply pagination and ordering
        articles = query.order_by(
            Article.publicationDate.desc()
        ).offset(skip).limit(limit).all()
        
        return articles
    
    def get_article_by_id(self, article_id: UUID) -> Optional[Article]:
        """
        Get an article by ID.
        
        Args:
            article_id: Article ID
            
        Returns:
            Article or None if not found
        """
        article = self.db.query(Article).filter(
            Article.articleId == article_id
        ).options(
            joinedload(Article.category_assignments).joinedload(ArticleCategoryAssignment.category),
            joinedload(Article.tag_assignments).joinedload(ArticleTagAssignment.tag)
        ).first()
        
        return article
    
    def get_article_by_slug(self, article_slug: str) -> Optional[Article]:
        """
        Get an article by slug.
        
        Args:
            article_slug: Article slug
            
        Returns:
            Article or None if not found
        """
        article = self.db.query(Article).filter(
            Article.articleSlug == article_slug
        ).options(
            joinedload(Article.category_assignments).joinedload(ArticleCategoryAssignment.category),
            joinedload(Article.tag_assignments).joinedload(ArticleTagAssignment.tag)
        ).first()
        
        return article
    
    def create_article(
        self, 
        account_id: UUID, 
        article_in: ArticleCreate
    ) -> Article:
        """
        Create a new article.
        
        Args:
            account_id: Owner account ID
            article_in: Article data
            
        Returns:
            Created article
        """
        # Check if categories exist
        for category_id in article_in.categories:
            category = self.db.query(ContentCategory).filter(
                ContentCategory.categoryId == category_id,
                ContentCategory.categoryType == "article"
            ).first()
            
            if not category:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Category with ID {category_id} not found or is not an article category"
                )
        
        # Check if tags exist
        if article_in.tags:
            for tag_id in article_in.tags:
                tag = self.db.query(ContentTag).filter(
                    ContentTag.tagId == tag_id
                ).first()
                
                if not tag:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Tag with ID {tag_id} not found"
                    )
        
        # Create article
        article_data = article_in.dict(exclude={"categories", "tags"})
        article = Article(accountId=account_id, **article_data)
        
        self.db.add(article)
        self.db.commit()
        self.db.refresh(article)
        
        # Add categories
        for category_id in article_in.categories:
            category_assignment = ArticleCategoryAssignment(
                articleId=article.articleId,
                categoryId=category_id
            )
            self.db.add(category_assignment)
        
        # Add tags
        if article_in.tags:
            for tag_id in article_in.tags:
                tag_assignment = ArticleTagAssignment(
                    articleId=article.articleId,
                    tagId=tag_id
                )
                self.db.add(tag_assignment)
        
        self.db.commit()
        self.db.refresh(article)
        
        return article
    
    def update_article(
        self, 
        article_id: UUID, 
        article_in: ArticleUpdate
    ) -> Article:
        """
        Update an article.
        
        Args:
            article_id: Article ID
            article_in: Article data
            
        Returns:
            Updated article
        """
        article = self.get_article_by_id(article_id)
        
        if not article:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Article not found"
            )
        
        # Update article fields
        update_data = article_in.dict(exclude_unset=True, exclude={"categories", "tags"})
        
        for field, value in update_data.items():
            setattr(article, field, value)
        
        # Update categories if provided
        if article_in.categories is not None:
            # Check if categories exist
            for category_id in article_in.categories:
                category = self.db.query(ContentCategory).filter(
                    ContentCategory.categoryId == category_id,
                    ContentCategory.categoryType == "article"
                ).first()
                
                if not category:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Category with ID {category_id} not found or is not an article category"
                    )
            
            # Delete existing category assignments
            self.db.query(ArticleCategoryAssignment).filter(
                ArticleCategoryAssignment.articleId == article.articleId
            ).delete()
            
            # Create new category assignments
            for category_id in article_in.categories:
                category_assignment = ArticleCategoryAssignment(
                    articleId=article.articleId,
                    categoryId=category_id
                )
                self.db.add(category_assignment)
        
        # Update tags if provided
        if article_in.tags is not None:
            # Check if tags exist
            for tag_id in article_in.tags:
                tag = self.db.query(ContentTag).filter(
                    ContentTag.tagId == tag_id
                ).first()
                
                if not tag:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Tag with ID {tag_id} not found"
                    )
            
            # Delete existing tag assignments
            self.db.query(ArticleTagAssignment).filter(
                ArticleTagAssignment.articleId == article.articleId
            ).delete()
            
            # Create new tag assignments
            for tag_id in article_in.tags:
                tag_assignment = ArticleTagAssignment(
                    articleId=article.articleId,
                    tagId=tag_id
                )
                self.db.add(tag_assignment)
        
        self.db.add(article)
        self.db.commit()
        self.db.refresh(article)
        
        return article
    
    def delete_article(self, article_id: UUID) -> bool:
        """
        Delete an article.
        
        Args:
            article_id: Article ID
            
        Returns:
            True if article was deleted, False otherwise
        """
        article = self.get_article_by_id(article_id)
        
        if not article:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Article not found"
            )
        
        self.db.delete(article)
        self.db.commit()
        
        return True


def get_article_service(db: Session) -> ArticleService:
    """
    Get article service.
    
    Args:
        db: Database session
        
    Returns:
        Article service
    """
    return ArticleService(db)
```

## Step 5: Implementing API Endpoints for Articles

Now, let's implement the API endpoints for articles in `app/api/v1/endpoints/articles.py`:

```python
from typing import Any, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin_user
from app.db.session import get_db
from app.models.account import ProfessionalAccount
from app.schemas.article import (
    ArticleCreate,
    ArticleUpdate,
    ArticleResponse,
    ArticleListResponse
)
from app.services.article import ArticleService, get_article_service

router = APIRouter()


@router.get("/", response_model=List[ArticleListResponse])
def list_articles(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 10,
    category_id: Optional[UUID] = None,
    tag_id: Optional[UUID] = None,
    article_service: ArticleService = Depends(get_article_service)
) -> Any:
    """
    Retrieve published articles.
    """
    articles = article_service.get_articles(
        skip=skip, 
        limit=limit, 
        category_id=category_id,
        tag_id=tag_id
    )
    return articles


@router.get("/{article_id}", response_model=ArticleResponse)
def get_article(
    article_id: UUID,
    article_service: ArticleService = Depends(get_article_service)
) -> Any:
    """
    Retrieve a specific article by ID.
    """
    article = article_service.get_article_by_id(article_id)
    
    if not article or article.publicationStatus != "published":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Article not found"
        )
    
    return article


@router.get("/by-slug/{article_slug}", response_model=ArticleResponse)
def get_article_by_slug(
    article_slug: str,
    article_service: ArticleService = Depends(get_article_service)
) -> Any:
    """
    Retrieve a specific article by slug.
    """
    article = article_service.get_article_by_slug(article_slug)
    
    if not article or article.publicationStatus != "published":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Article not found"
        )
    
    return article


@router.post("/", response_model=ArticleResponse, status_code=status.HTTP_201_CREATED)
def create_article(
    article_in: ArticleCreate,
    current_user: ProfessionalAccount = Depends(get_current_admin_user),
    article_service: ArticleService = Depends(get_article_service)
) -> Any:
    """
    Create a new article.
    """
    article = article_service.create_article(
        account_id=current_user.accountId,
        article_in=article_in
    )
    return article


@router.put("/{article_id}", response_model=ArticleResponse)
def update_article(
    article_id: UUID,
    article_in: ArticleUpdate,
    current_user: ProfessionalAccount = Depends(get_current_admin_user),
    article_service: ArticleService = Depends(get_article_service)
) -> Any:
    """
    Update an article.
    """
    article = article_service.update_article(
        article_id=article_id,
        article_in=article_in
    )
    return article


@router.delete("/{article_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_article(
    article_id: UUID,
    current_user: ProfessionalAccount = Depends(get_current_admin_user),
    article_service: ArticleService = Depends(get_article_service)
) -> None:
    """
    Delete an article.
    """
    article_service.delete_article(article_id=article_id)
```

## Step 6: Implementing API Service for Professional Services

Let's implement the service for professional services in `app/services/service.py`:

```python
from typing import List, Optional
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.models.service import ProfessionalService
from app.models.configuration import ContentCategory
from app.schemas.service import ServiceCreate, ServiceUpdate


class ServiceService:
    """Service for professional service operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_services(
        self, 
        skip: int = 0, 
        limit: int = 10, 
        category_id: Optional[UUID] = None,
        featured_only: bool = False
    ) -> List[ProfessionalService]:
        """
        Get active professional services.
        
        Args:
            skip: Number of records to skip
            limit: Maximum number of records to return
            category_id: Filter by category ID
            featured_only: Filter by featured flag
            
        Returns:
            List of professional services
        """
        query = self.db.query(ProfessionalService).filter(
            ProfessionalService.serviceStatus == "active"
        )
        
        # Apply category filter
        if category_id:
            query = query.filter(ProfessionalService.categoryId == category_id)
        
        # Apply featured filter
        if featured_only:
            query = query.filter(ProfessionalService.isFeatured == True)
        
        # Load relationships
        query = query.options(joinedload(ProfessionalService.category))
        
        # Apply pagination and ordering
        services = query.order_by(
            ProfessionalService.isFeatured.desc(),
            ProfessionalService.createdAt.desc()
        ).offset(skip).limit(limit).all()
        
        return services
    
    def get_service_by_id(self, service_id: UUID) -> Optional[ProfessionalService]:
        """
        Get a service by ID.
        
        Args:
            service_id: Service ID
            
        Returns:
            Professional service or None if not found
        """
        service = self.db.query(ProfessionalService).filter(
            ProfessionalService.serviceId == service_id
        ).options(
            joinedload(ProfessionalService.category)
        ).first()
        
        return service
    
    def get_service_by_slug(self, service_slug: str) -> Optional[ProfessionalService]:
        """
        Get a service by slug.
        
        Args:
            service_slug: Service slug
            
        Returns:
            Professional service or None if not found
        """
        service = self.db.query(ProfessionalService).filter(
            ProfessionalService.serviceSlug == service_slug
        ).options(
            joinedload(ProfessionalService.category)
        ).first()
        
        return service
    
    def create_service(
        self, 
        account_id: UUID, 
        service_in: ServiceCreate
    ) -> ProfessionalService:
        """
        Create a new professional service.
        
        Args:
            account_id: Owner account ID
            service_in: Service data
            
        Returns:
            Created professional service
        """
        # Check if category exists
        category = self.db.query(ContentCategory).filter(
            ContentCategory.categoryId == service_in.categoryId,
            ContentCategory.categoryType == "service"
        ).first()
        
        if not category:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Category with ID {service_in.categoryId} not found or is not a service category"
            )
        
        # Create service
        service_data = service_in.dict()
        service = ProfessionalService(accountId=account_id, **service_data)
        
        self.db.add(service)
        self.db.commit()
        self.db.refresh(service)
        
        return service
    
    def update_service(
        self, 
        service_id: UUID, 
        service_in: ServiceUpdate
    ) -> ProfessionalService:
        """
        Update a professional service.
        
        Args:
            service_id: Service ID
            service_in: Service data
            
        Returns:
            Updated professional service
        """
        service = self.get_service_by_id(service_id)
        
        if not service:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Professional service not found"
            )
        
        # Check if category exists if provided
        if service_in.categoryId is not None:
            category = self.db.query(ContentCategory).filter(
                ContentCategory.categoryId == service_in.categoryId,
                ContentCategory.categoryType == "service"
            ).first()
            
            if not category:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Category with ID {service_in.categoryId} not found or is not a service category"
                )
        
        # Update service fields
        update_data = service_in.dict(exclude_unset=True)
        
        for field, value in update_data.items():
            setattr(service, field, value)
        
        self.db.add(service)
        self.db.commit()
        self.db.refresh(service)
        
        return service
    
    def delete_service(self, service_id: UUID) -> bool:
        """
        Delete a professional service.
        
        Args:
            service_id: Service ID
            
        Returns:
            True if service was deleted, False otherwise
        """
        service = self.get_service_by_id(service_id)
        
        if not service:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Professional service not found"
            )
        
        self.db.delete(service)
        self.db.commit()
        
        return True


def get_service_service(db: Session) -> ServiceService:
    """
    Get professional service service.
    
    Args:
        db: Database session
        
    Returns:
        Professional service service
    """
    return ServiceService(db)
```

## Step 7: Implementing API Endpoints for Professional Services

Now, let's implement the API endpoints for professional services in `app/api/v1/endpoints/services.py`:

```python
from typing import Any, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin_user
from app.db.session import get_db
from app.models.account import ProfessionalAccount
from app.schemas.service import (
    ServiceCreate,
    ServiceUpdate,
    ServiceResponse,
    ServiceListResponse
)
from app.services.service import ServiceService, get_service_service

router = APIRouter()


@router.get("/", response_model=List[ServiceListResponse])
def list_services(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 10,
    category_id: Optional[UUID] = None,
    featured_only: bool = False,
    service_service: ServiceService = Depends(get_service_service)
) -> Any:
    """
    Retrieve active services.
    """
    services = service_service.get_services(
        skip=skip, 
        limit=limit, 
        category_id=category_id,
        featured_only=featured_only
    )
    return services


@router.get("/{service_id}", response_model=ServiceResponse)
def get_service(
    service_id: UUID,
    service_service: ServiceService = Depends(get_service_service)
) -> Any:
    """
    Retrieve a specific service by ID.
    """
    service = service_service.get_service_by_id(service_id)
    
    if not service or service.serviceStatus != "active":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Professional service not found"
        )
    
    return service


@router.get("/by-slug/{service_slug}", response_model=ServiceResponse)
def get_service_by_slug(
    service_slug: str,
    service_service: ServiceService = Depends(get_service_service)
) -> Any:
    """
    Retrieve a specific service by slug.
    """
    service = service_service.get_service_by_slug(service_slug)
    
    if not service or service.serviceStatus != "active":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Professional service not found"
        )
    
    return service


@router.post("/", response_model=ServiceResponse, status_code=status.HTTP_201_CREATED)
def create_service(
    service_in: ServiceCreate,
    current_user: ProfessionalAccount = Depends(get_current_admin_user),
    service_service: ServiceService = Depends(get_service_service)
) -> Any:
    """
    Create a new professional service.
    """
    service = service_service.create_service(
        account_id=current_user.accountId,
        service_in=service_in
    )
    return service


@router.put("/{service_id}", response_model=ServiceResponse)
def update_service(
    service_id: UUID,
    service_in: ServiceUpdate,
    current_user: ProfessionalAccount = Depends(get_current_admin_user),
    service_service: ServiceService = Depends(get_service_service)
) -> Any:
    """
    Update a professional service.
    """
    service = service_service.update_service(
        service_id=service_id,
        service_in=service_in
    )
    return service


@router.delete("/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_service(
    service_id: UUID,
    current_user: ProfessionalAccount = Depends(get_current_admin_user),
    service_service: ServiceService = Depends(get_service_service)
) -> None:
    """
    Delete a professional service.
    """
    service_service.delete_service(service_id=service_id)
```

## Step 8: Implementing API Router Configuration

Finally, we need to configure our API router to include all the endpoints we've created. Update the `app/api/v1/api.py` file:

```python
from fastapi import APIRouter

from app.api.v1.endpoints import (
    authentication, 
    portfolios, 
    articles, 
    services, 
    categories,
    tags,
    expertise,
    configuration,
    inquiries,
    uploads
)

api_router = APIRouter()

# Authentication routes
api_router.include_router(
    authentication.router, 
    prefix="/auth", 
    tags=["authentication"]
)

# Portfolio project routes
api_router.include_router(
    portfolios.router, 
    prefix="/portfolios", 
    tags=["portfolios"]
)

# Article routes
api_router.include_router(
    articles.router, 
    prefix="/articles", 
    tags=["articles"]
)

# Professional service routes
api_router.include_router(
    services.router, 
    prefix="/services", 
    tags=["services"]
)

# Category routes
api_router.include_router(
    categories.router, 
    prefix="/categories", 
    tags=["categories"]
)

# Tag routes
api_router.include_router(
    tags.router, 
    prefix="/tags", 
    tags=["tags"]
)

# Expertise routes
api_router.include_router(
    expertise.router, 
    prefix="/expertise", 
    tags=["expertise"]
)

# Site configuration routes
api_router.include_router(
    configuration.router, 
    prefix="/configuration", 
    tags=["configuration"]
)

# Client inquiry routes
api_router.include_router(
    inquiries.router, 
    prefix="/inquiries", 
    tags=["inquiries"]
)

# File upload routes
api_router.include_router(
    uploads.router, 
    prefix="/uploads", 
    tags=["uploads"]
)
```

This completes the implementation of our core API services and endpoints for articles, professional services, and the API router configuration. In the next part, we'll implement the remaining API endpoints for categories, tags, expertise, configuration, inquiries, and file uploads. 