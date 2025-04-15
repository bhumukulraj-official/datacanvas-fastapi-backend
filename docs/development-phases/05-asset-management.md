# Phase 5: Media Asset Management

This phase focuses on implementing a robust system for handling digital assets (images, documents, etc.) in the DataCanvasDev application. We'll create services for uploading, processing, and retrieving files using AWS S3 for storage.

## Step 1: AWS S3 Configuration

First, let's set up AWS S3 integration by creating a configuration file in `src/config/storage.js`:

```javascript
require('dotenv').config();

module.exports = {
  s3: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    bucket: process.env.AWS_STORAGE_BUCKET_NAME,
    region: process.env.AWS_REGION || 'us-east-1',
    cdnDomain: process.env.AWS_S3_CUSTOM_DOMAIN || null,
    urlProtocol: process.env.AWS_S3_URL_PROTOCOL || 'https:',
  },
  fileSettings: {
    maxSize: process.env.ASSET_MAX_SIZE || 10 * 1024 * 1024, // 10MB maximum file size
    allowedImageTypes: [
      'image/jpeg', 
      'image/png', 
      'image/gif', 
      'image/webp'
    ],
    allowedDocumentTypes: [
      'application/pdf', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
  }
};
```

## Step 2: Implement Storage Service

Let's create the storage service in `src/services/storageService.js`:

```javascript
const AWS = require('aws-sdk');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const config = require('../config/storage');
const logger = require('../utils/logger');

// Create S3 instance
const s3 = new AWS.S3({
  accessKeyId: config.s3.accessKeyId,
  secretAccessKey: config.s3.secretAccessKey,
  region: config.s3.region
});

/**
 * Service for managing file uploads to S3
 */
class StorageService {
  /**
   * Validate file size and content type
   * @param {Object} file - Express uploaded file object
   * @throws {Error} If file validation fails
   */
  validateFile(file) {
    // Check file size
    if (file.size > config.fileSettings.maxSize) {
      throw new Error(
        `File size exceeds maximum allowed size of ${config.fileSettings.maxSize / (1024 * 1024)}MB`
      );
    }

    // Check content type
    const contentType = file.mimetype;
    const allowedTypes = [
      ...config.fileSettings.allowedImageTypes,
      ...config.fileSettings.allowedDocumentTypes
    ];

    if (!allowedTypes.includes(contentType)) {
      throw new Error(
        `File type ${contentType} not allowed. Allowed types: ${allowedTypes.join(', ')}`
      );
    }
  }

  /**
   * Process an image to create optimized version and thumbnail
   * @param {Buffer} buffer - Image file buffer
   * @returns {Promise<Object>} Object containing optimized image, thumbnail, and dimensions
   */
  async processImage(buffer) {
    try {
      // Get image metadata
      const metadata = await sharp(buffer).metadata();

      // Create optimized version
      const optimized = await sharp(buffer)
        .rotate() // Auto-rotate based on EXIF data
        .toFormat('jpeg')
        .jpeg({ quality: 85, progressive: true })
        .toBuffer();

      // Create thumbnail
      const thumbnail = await sharp(buffer)
        .rotate() // Auto-rotate based on EXIF data
        .resize(300, 300, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .toFormat('jpeg')
        .jpeg({ quality: 75 })
        .toBuffer();

      return {
        optimized,
        thumbnail,
        dimensions: {
          width: metadata.width,
          height: metadata.height
        }
      };
    } catch (error) {
      logger.error('Error processing image:', error);
      throw new Error(`Error processing image: ${error.message}`);
    }
  }

  /**
   * Upload a file to S3
   * @param {Object} file - Express uploaded file object
   * @param {string} folder - Destination folder in S3 bucket
   * @returns {Promise<Object>} Uploaded file information
   */
  async uploadFile(file, folder = 'uploads') {
    try {
      // Validate file
      this.validateFile(file);

      // Generate a unique filename
      const filename = file.originalname;
      const fileExt = path.extname(filename).toLowerCase();
      const baseName = path.basename(filename, fileExt);
      const uniqueFilename = `${uuidv4()}${fileExt}`;
      const s3Key = `${folder}/${uniqueFilename}`;

      // Check if it's an image
      const isImage = config.fileSettings.allowedImageTypes.includes(file.mimetype);

      if (isImage) {
        // Process image
        const { optimized, thumbnail, dimensions } = await this.processImage(file.buffer);

        // Upload optimized image
        await s3.upload({
          Bucket: config.s3.bucket,
          Key: s3Key,
          Body: optimized,
          ContentType: 'image/jpeg',
          ACL: 'public-read'
        }).promise();

        // Upload thumbnail
        const thumbnailKey = `${folder}/thumbnails/${uniqueFilename}`;
        await s3.upload({
          Bucket: config.s3.bucket,
          Key: thumbnailKey,
          Body: thumbnail,
          ContentType: 'image/jpeg',
          ACL: 'public-read'
        }).promise();

        // Construct URLs
        const baseUrl = config.s3.cdnDomain
          ? `${config.s3.urlProtocol}//${config.s3.cdnDomain}`
          : `${config.s3.urlProtocol}//${config.s3.bucket}.s3.${config.s3.region}.amazonaws.com`;

        const fileUrl = `${baseUrl}/${s3Key}`;
        const thumbnailUrl = `${baseUrl}/${thumbnailKey}`;

        return {
          assetName: baseName,
          fileName: uniqueFilename,
          mimeType: 'image/jpeg',
          fileSize: optimized.length,
          filePath: fileUrl,
          thumbnailPath: thumbnailUrl,
          width: dimensions.width,
          height: dimensions.height
        };
      } else {
        // Upload regular file
        await s3.upload({
          Bucket: config.s3.bucket,
          Key: s3Key,
          Body: file.buffer,
          ContentType: file.mimetype,
          ACL: 'public-read'
        }).promise();

        // Construct URL
        const baseUrl = config.s3.cdnDomain
          ? `${config.s3.urlProtocol}//${config.s3.cdnDomain}`
          : `${config.s3.urlProtocol}//${config.s3.bucket}.s3.${config.s3.region}.amazonaws.com`;

        const fileUrl = `${baseUrl}/${s3Key}`;

        return {
          assetName: baseName,
          fileName: uniqueFilename,
          mimeType: file.mimetype,
          fileSize: file.size,
          filePath: fileUrl,
          thumbnailPath: null
        };
      }
    } catch (error) {
      logger.error('Error uploading file to S3:', error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  /**
   * Delete a file from S3
   * @param {string} fileUrl - Full URL of the file to delete
   * @returns {Promise<boolean>} True if the file was deleted
   */
  async deleteFile(fileUrl) {
    try {
      // Extract key from URL
      const baseUrl = config.s3.cdnDomain
        ? `${config.s3.urlProtocol}//${config.s3.cdnDomain}/`
        : `${config.s3.urlProtocol}//${config.s3.bucket}.s3.${config.s3.region}.amazonaws.com/`;

      const key = fileUrl.replace(baseUrl, '');

      // Delete file from S3
      await s3.deleteObject({
        Bucket: config.s3.bucket,
        Key: key
      }).promise();

      return true;
    } catch (error) {
      logger.error('Error deleting file from S3:', error);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }
}

module.exports = new StorageService();
```

## Step 3: Implement the Digital Asset Service

Let's create the digital asset service in `app/services/asset.py`:

```python
from typing import List, Optional, Dict, Any
from uuid import UUID

from fastapi import UploadFile, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.models.asset import (
    DigitalAsset, 
    ProjectAssetAssociation, 
    ArticleAssetAssociation, 
    ServiceAssetAssociation
)
from app.services.storage import get_storage_service


class AssetService:
    """Service for digital asset operations."""
    
    def __init__(self, db: Session):
        self.db = db
        self.storage_service = get_storage_service()
    
    async def upload_asset(self, file: UploadFile, uploader_id: UUID, alt_text: Optional[str] = None) -> DigitalAsset:
        """
        Upload a new digital asset.
        
        Args:
            file: Uploaded file
            uploader_id: ID of the user uploading the file
            alt_text: Alternative text for accessibility
            
        Returns:
            Created digital asset
        """
        # Upload file to S3
        file_info = await self.storage_service.upload_file(file)
        
        # Create asset record
        asset = DigitalAsset(
            uploadedBy=uploader_id,
            assetName=file_info["originalFileName"],
            fileName=file_info["fileName"],
            mimeType=file_info["mimeType"],
            fileSize=file_info["size"],
            filePath=file_info["filePath"],
            thumbnailPath=file_info.get("thumbnailPath"),
            alternativeText=alt_text or file_info["originalFileName"]
        )
        
        self.db.add(asset)
        self.db.commit()
        self.db.refresh(asset)
        
        return asset
    
    async def upload_multiple_assets(
        self, 
        files: List[UploadFile], 
        uploader_id: UUID,
        alt_texts: Optional[List[str]] = None
    ) -> List[DigitalAsset]:
        """
        Upload multiple digital assets.
        
        Args:
            files: List of uploaded files
            uploader_id: ID of the user uploading the files
            alt_texts: List of alternative texts for each file
            
        Returns:
            List of created digital assets
        """
        assets = []
        
        # Process each file
        for i, file in enumerate(files):
            alt_text = alt_texts[i] if alt_texts and i < len(alt_texts) else None
            asset = await self.upload_asset(file, uploader_id, alt_text)
            assets.append(asset)
        
        return assets
    
    def get_asset_by_id(self, asset_id: UUID) -> Optional[DigitalAsset]:
        """
        Get a digital asset by ID.
        
        Args:
            asset_id: Asset ID
            
        Returns:
            Digital asset or None if not found
        """
        asset = self.db.query(DigitalAsset).filter(
            DigitalAsset.assetId == asset_id
        ).first()
        
        return asset
    
    def delete_asset(self, asset_id: UUID) -> bool:
        """
        Delete a digital asset.
        
        Args:
            asset_id: Asset ID
            
        Returns:
            True if asset was deleted, False otherwise
        """
        asset = self.get_asset_by_id(asset_id)
        
        if not asset:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Asset not found"
            )
        
        # Delete file from storage
        if asset.filePath:
            self.storage_service.delete_file(asset.filePath)
        
        # Delete thumbnail if exists
        if asset.thumbnailPath:
            self.storage_service.delete_file(asset.thumbnailPath)
        
        # Delete database record
        self.db.delete(asset)
        self.db.commit()
        
        return True
    
    def associate_assets_with_project(
        self, 
        project_id: UUID, 
        asset_ids: List[UUID],
        display_orders: Optional[List[int]] = None
    ) -> List[ProjectAssetAssociation]:
        """
        Associate assets with a portfolio project.
        
        Args:
            project_id: Project ID
            asset_ids: List of asset IDs to associate
            display_orders: Optional list of display orders for each asset
            
        Returns:
            List of created associations
        """
        associations = []
        
        for i, asset_id in enumerate(asset_ids):
            # Check if asset exists
            asset = self.get_asset_by_id(asset_id)
            if not asset:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Asset with ID {asset_id} not found"
                )
            
            # Check if association already exists
            existing_assoc = self.db.query(ProjectAssetAssociation).filter(
                ProjectAssetAssociation.projectId == project_id,
                ProjectAssetAssociation.assetId == asset_id
            ).first()
            
            if existing_assoc:
                # Update display order if provided
                if display_orders and i < len(display_orders):
                    existing_assoc.displayOrder = display_orders[i]
                    self.db.add(existing_assoc)
                    associations.append(existing_assoc)
            else:
                # Create new association
                display_order = display_orders[i] if display_orders and i < len(display_orders) else i
                association = ProjectAssetAssociation(
                    projectId=project_id,
                    assetId=asset_id,
                    displayOrder=display_order
                )
                self.db.add(association)
                associations.append(association)
        
        self.db.commit()
        
        # Refresh associations
        for i, association in enumerate(associations):
            if isinstance(association, ProjectAssetAssociation):
                self.db.refresh(association)
        
        return associations
    
    def associate_assets_with_article(
        self, 
        article_id: UUID, 
        asset_ids: List[UUID],
        display_orders: Optional[List[int]] = None
    ) -> List[ArticleAssetAssociation]:
        """
        Associate assets with an article.
        
        Args:
            article_id: Article ID
            asset_ids: List of asset IDs to associate
            display_orders: Optional list of display orders for each asset
            
        Returns:
            List of created associations
        """
        associations = []
        
        for i, asset_id in enumerate(asset_ids):
            # Check if asset exists
            asset = self.get_asset_by_id(asset_id)
            if not asset:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Asset with ID {asset_id} not found"
                )
            
            # Check if association already exists
            existing_assoc = self.db.query(ArticleAssetAssociation).filter(
                ArticleAssetAssociation.articleId == article_id,
                ArticleAssetAssociation.assetId == asset_id
            ).first()
            
            if existing_assoc:
                # Update display order if provided
                if display_orders and i < len(display_orders):
                    existing_assoc.displayOrder = display_orders[i]
                    self.db.add(existing_assoc)
                    associations.append(existing_assoc)
            else:
                # Create new association
                display_order = display_orders[i] if display_orders and i < len(display_orders) else i
                association = ArticleAssetAssociation(
                    articleId=article_id,
                    assetId=asset_id,
                    displayOrder=display_order
                )
                self.db.add(association)
                associations.append(association)
        
        self.db.commit()
        
        # Refresh associations
        for i, association in enumerate(associations):
            if isinstance(association, ArticleAssetAssociation):
                self.db.refresh(association)
        
        return associations
    
    def associate_assets_with_service(
        self, 
        service_id: UUID, 
        asset_ids: List[UUID],
        display_orders: Optional[List[int]] = None
    ) -> List[ServiceAssetAssociation]:
        """
        Associate assets with a service.
        
        Args:
            service_id: Service ID
            asset_ids: List of asset IDs to associate
            display_orders: Optional list of display orders for each asset
            
        Returns:
            List of created associations
        """
        associations = []
        
        for i, asset_id in enumerate(asset_ids):
            # Check if asset exists
            asset = self.get_asset_by_id(asset_id)
            if not asset:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Asset with ID {asset_id} not found"
                )
            
            # Check if association already exists
            existing_assoc = self.db.query(ServiceAssetAssociation).filter(
                ServiceAssetAssociation.serviceId == service_id,
                ServiceAssetAssociation.assetId == asset_id
            ).first()
            
            if existing_assoc:
                # Update display order if provided
                if display_orders and i < len(display_orders):
                    existing_assoc.displayOrder = display_orders[i]
                    self.db.add(existing_assoc)
                    associations.append(existing_assoc)
            else:
                # Create new association
                display_order = display_orders[i] if display_orders and i < len(display_orders) else i
                association = ServiceAssetAssociation(
                    serviceId=service_id,
                    assetId=asset_id,
                    displayOrder=display_order
                )
                self.db.add(association)
                associations.append(association)
        
        self.db.commit()
        
        # Refresh associations
        for i, association in enumerate(associations):
            if isinstance(association, ServiceAssetAssociation):
                self.db.refresh(association)
        
        return associations


def get_asset_service(db: Session) -> AssetService:
    """
    Get asset service.
    
    Args:
        db: Database session
        
    Returns:
        Asset service
    """
    return AssetService(db)
```

## Step 4: Create Pydantic Models for Asset Endpoints

Create the following schemas in `app/schemas/asset.py`:

```python
from datetime import datetime
from typing import List, Optional, Dict, Any
from uuid import UUID

from pydantic import BaseModel, HttpUrl


class AssetBase(BaseModel):
    """Base model for digital asset data."""
    assetName: str
    alternativeText: Optional[str] = None


class AssetCreate(AssetBase):
    """Model for creating a new digital asset."""
    pass


class AssetResponse(AssetBase):
    """Model for digital asset response."""
    assetId: UUID
    fileName: str
    mimeType: str
    fileSize: int
    filePath: str
    thumbnailPath: Optional[str] = None
    createdAt: datetime
    updatedAt: datetime

    class Config:
        orm_mode = True


class AssetListResponse(BaseModel):
    """Model for digital asset list response."""
    assetId: UUID
    assetName: str
    mimeType: str
    fileSize: int
    filePath: str
    thumbnailPath: Optional[str] = None
    createdAt: datetime

    class Config:
        orm_mode = True


class AssetAssociation(BaseModel):
    """Model for asset association request."""
    assetIds: List[UUID]
    displayOrder: Optional[List[int]] = None


class AssetAssociationResponse(BaseModel):
    """Base model for asset association response."""
    associationId: UUID
    displayOrder: int
    createdAt: datetime
    asset: AssetResponse

    class Config:
        orm_mode = True


class ProjectAssetAssociationResponse(AssetAssociationResponse):
    """Model for project asset association response."""
    projectId: UUID

    class Config:
        orm_mode = True


class ArticleAssetAssociationResponse(AssetAssociationResponse):
    """Model for article asset association response."""
    articleId: UUID

    class Config:
        orm_mode = True


class ServiceAssetAssociationResponse(AssetAssociationResponse):
    """Model for service asset association response."""
    serviceId: UUID

    class Config:
        orm_mode = True
```

## Step 5: Implement Asset API Endpoints

Create the asset endpoints in `app/api/v1/endpoints/assets.py`:

```python
from typing import Any, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin_user, get_current_active_user
from app.db.session import get_db
from app.models.account import ProfessionalAccount
from app.schemas.asset import (
    AssetListResponse,
    AssetResponse,
    AssetAssociation,
    ProjectAssetAssociationResponse,
    ArticleAssetAssociationResponse,
    ServiceAssetAssociationResponse
)
from app.services.asset import AssetService, get_asset_service

router = APIRouter()


@router.post("/upload", response_model=AssetResponse, status_code=status.HTTP_201_CREATED)
async def upload_asset(
    file: UploadFile = File(...),
    alt_text: Optional[str] = Form(None),
    current_user: ProfessionalAccount = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
    asset_service: AssetService = Depends(get_asset_service)
) -> Any:
    """
    Upload a new digital asset.
    """
    asset = await asset_service.upload_asset(
        file=file,
        uploader_id=current_user.accountId,
        alt_text=alt_text
    )
    return asset


@router.post("/upload-multiple", response_model=List[AssetResponse], status_code=status.HTTP_201_CREATED)
async def upload_multiple_assets(
    files: List[UploadFile] = File(...),
    alt_texts: Optional[List[str]] = Form(None),
    current_user: ProfessionalAccount = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
    asset_service: AssetService = Depends(get_asset_service)
) -> Any:
    """
    Upload multiple digital assets.
    """
    assets = await asset_service.upload_multiple_assets(
        files=files,
        uploader_id=current_user.accountId,
        alt_texts=alt_texts
    )
    return assets


@router.delete("/{asset_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_asset(
    asset_id: UUID,
    current_user: ProfessionalAccount = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
    asset_service: AssetService = Depends(get_asset_service)
) -> None:
    """
    Delete a digital asset.
    """
    asset_service.delete_asset(asset_id=asset_id)


@router.post("/portfolio-projects/{project_id}/assets", response_model=List[ProjectAssetAssociationResponse])
def associate_assets_with_project(
    project_id: UUID,
    association: AssetAssociation,
    current_user: ProfessionalAccount = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
    asset_service: AssetService = Depends(get_asset_service)
) -> Any:
    """
    Associate assets with a portfolio project.
    """
    associations = asset_service.associate_assets_with_project(
        project_id=project_id,
        asset_ids=association.assetIds,
        display_orders=association.displayOrder
    )
    return associations


@router.post("/articles/{article_id}/assets", response_model=List[ArticleAssetAssociationResponse])
def associate_assets_with_article(
    article_id: UUID,
    association: AssetAssociation,
    current_user: ProfessionalAccount = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
    asset_service: AssetService = Depends(get_asset_service)
) -> Any:
    """
    Associate assets with an article.
    """
    associations = asset_service.associate_assets_with_article(
        article_id=article_id,
        asset_ids=association.assetIds,
        display_orders=association.displayOrder
    )
    return associations


@router.post("/services/{service_id}/assets", response_model=List[ServiceAssetAssociationResponse])
def associate_assets_with_service(
    service_id: UUID,
    association: AssetAssociation,
    current_user: ProfessionalAccount = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
    asset_service: AssetService = Depends(get_asset_service)
) -> Any:
    """
    Associate assets with a service.
    """
    associations = asset_service.associate_assets_with_service(
        service_id=service_id,
        asset_ids=association.assetIds,
        display_orders=association.displayOrder
    )
    return associations
```

## Step 6: Implement Background Tasks for Asset Cleanup

Create a background task to clean up orphaned assets in `app/tasks/cleanup.py`:

```python
import logging
from datetime import datetime, timedelta
from typing import List
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.asset import (
    DigitalAsset, 
    ProjectAssetAssociation,
    ArticleAssetAssociation,
    ServiceAssetAssociation
)
from app.services.storage import get_storage_service

logger = logging.getLogger(__name__)


def cleanup_orphaned_assets():
    """
    Delete digital assets that are not associated with any content
    and were created more than 24 hours ago.
    """
    logger.info("Starting orphaned asset cleanup task")
    
    db = SessionLocal()
    storage_service = get_storage_service()
    
    try:
        # Find assets created more than 24 hours ago
        cutoff_time = datetime.utcnow() - timedelta(hours=24)
        
        # Find orphaned assets - those without any associations
        orphaned_assets = db.query(DigitalAsset).filter(
            DigitalAsset.createdAt < cutoff_time,
            # No project associations
            ~DigitalAsset.assetId.in_(
                db.query(ProjectAssetAssociation.assetId)
            ),
            # No article associations
            ~DigitalAsset.assetId.in_(
                db.query(ArticleAssetAssociation.assetId)
            ),
            # No service associations
            ~DigitalAsset.assetId.in_(
                db.query(ServiceAssetAssociation.assetId)
            )
        ).all()
        
        logger.info(f"Found {len(orphaned_assets)} orphaned assets to clean up")
        
        # Delete each orphaned asset
        for asset in orphaned_assets:
            logger.info(f"Deleting orphaned asset: {asset.assetId} - {asset.assetName}")
            
            # Delete file from storage
            if asset.filePath:
                storage_service.delete_file(asset.filePath)
            
            # Delete thumbnail if exists
            if asset.thumbnailPath:
                storage_service.delete_file(asset.thumbnailPath)
            
            # Delete database record
            db.delete(asset)
        
        db.commit()
        logger.info("Orphaned asset cleanup completed successfully")
        
    except Exception as e:
        logger.error(f"Error during orphaned asset cleanup: {str(e)}")
        db.rollback()
    finally:
        db.close()
```

## Step 7: Update the API Router

Update `app/api/v1/api.py` to include the asset endpoints:

```python
from fastapi import APIRouter

from app.api.v1.endpoints import (
    authentication,
    portfolios,
    articles,
    services,
    expertise,
    assets,
    # ... other endpoints
)

api_router = APIRouter()

api_router.include_router(authentication.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(portfolios.router, prefix="/portfolio-projects", tags=["Portfolio Projects"])
api_router.include_router(articles.router, prefix="/articles", tags=["Articles"])
api_router.include_router(services.router, prefix="/services", tags=["Services"])
api_router.include_router(expertise.router, prefix="/expertise", tags=["Expertise"])
api_router.include_router(assets.router, prefix="/digital-assets", tags=["Digital Assets"])
# ... other routers
```

## Step 8: Add Celery Task for Scheduled Asset Cleanup

Let's update `app/tasks/worker.py` to include the scheduled asset cleanup task:

```python
import logging
from celery import Celery
from celery.schedules import crontab

from app.core.config import settings
from app.tasks.cleanup import cleanup_orphaned_assets

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
    """
    Celery task to clean up orphaned assets.
    """
    logger.info("Running scheduled orphaned asset cleanup task")
    cleanup_orphaned_assets()
    logger.info("Scheduled orphaned asset cleanup task completed")
```

This completes the implementation of digital asset management for our Express.js application. In the next phase, we'll focus on implementing advanced features like caching, background tasks, email integration, and webhooks. 