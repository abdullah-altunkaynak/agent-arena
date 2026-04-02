"""
Blog Models & Schemas
Pydantic models for blog posts validation
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime
from enum import Enum


class PostStatus(str, Enum):
    """Blog post status enumeration"""
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"


# ============================================================================
# CATEGORY MODELS
# ============================================================================

class CategoryBase(BaseModel):
    """Base model for blog categories"""
    name_tr: str = Field(..., min_length=3, max_length=100, description="Turkish category name")
    name_en: Optional[str] = Field(None, max_length=100, description="English category name")
    slug: str = Field(..., min_length=3, max_length=100, description="URL slug")
    description_tr: Optional[str] = Field(None, description="Turkish description")
    description_en: Optional[str] = Field(None, description="English description")
    icon: Optional[str] = Field(None, max_length=50, description="Emoji or icon")

    @field_validator("slug")
    @classmethod
    def validate_slug(cls, v):
        """Ensure slug is lowercase and contains only valid characters"""
        if v is None:
            raise ValueError("Slug is required")

        v = str(v).strip().lower()
        if not all(c.isalnum() or c in '-_' for c in v):
            raise ValueError("Slug can only contain alphanumeric characters, hyphens, and underscores")
        return v


class CategoryCreate(CategoryBase):
    """Schema for creating categories"""
    pass


class CategoryResponse(CategoryBase):
    """Schema for category responses"""
    id: str
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# POST MODELS
# ============================================================================

class PostBase(BaseModel):
    """Base model for blog posts"""
    title_tr: str = Field(..., min_length=5, max_length=255, description="Turkish title")
    content_tr: str = Field(..., min_length=10, description="Turkish content (markdown)")
    title_en: Optional[str] = Field(None, max_length=255, description="English title")
    content_en: Optional[str] = Field(None, description="English content (markdown)")
    slug: str = Field(..., min_length=3, max_length=255, description="URL slug")
    status: PostStatus = Field(default=PostStatus.DRAFT, description="Publication status")
    category_id: Optional[str] = Field(None, description="Category UUID")
    excerpt_tr: Optional[str] = Field(None, max_length=500, description="Turkish excerpt")
    excerpt_en: Optional[str] = Field(None, max_length=500, description="English excerpt")
    featured_image_url: Optional[str] = Field(None, max_length=500, description="Featured image URL")

    @field_validator("slug")
    @classmethod
    def validate_slug(cls, v):
        """Ensure slug is lowercase and contains only valid characters"""
        if v is None:
            raise ValueError("Slug is required")

        v = str(v).strip().lower()
        if not all(c.isalnum() or c in '-_' for c in v):
            raise ValueError("Slug can only contain alphanumeric characters, hyphens, and underscores")
        return v


class PostCreate(PostBase):
    """Schema for creating new posts (from n8n)"""
    pass


class PostUpdate(BaseModel):
    """Schema for updating existing posts"""
    title_tr: Optional[str] = Field(None, min_length=5, max_length=255)
    content_tr: Optional[str] = Field(None, min_length=10)
    title_en: Optional[str] = Field(None, max_length=255)
    content_en: Optional[str] = Field(None)
    slug: Optional[str] = Field(None, min_length=3, max_length=255)
    status: Optional[PostStatus] = None
    category_id: Optional[str] = None
    excerpt_tr: Optional[str] = Field(None, max_length=500)
    excerpt_en: Optional[str] = Field(None, max_length=500)
    featured_image_url: Optional[str] = Field(None, max_length=500)


class PostResponse(PostBase):
    """Schema for post responses"""
    id: str
    created_at: datetime
    updated_at: datetime
    published_at: Optional[datetime] = None
    author_id: Optional[str] = None
    view_count: int = 0

    class Config:
        from_attributes = True


class PostListResponse(BaseModel):
    """Schema for paginated post list responses"""
    items: List[PostResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class SlugResolutionResponse(BaseModel):
    """Response for current/legacy slug resolution."""
    found: bool
    redirect_to: Optional[str] = None
    post_id: Optional[str] = None


# ============================================================================
# VIEW TRACKING MODELS
# ============================================================================

class PostViewCreate(BaseModel):
    """Schema for recording post views"""
    post_id: str = Field(..., description="Post UUID")
    user_ip: Optional[str] = Field(None, description="User IP address")
    user_agent: Optional[str] = Field(None, description="User agent string")


class PostViewResponse(BaseModel):
    """Schema for view responses"""
    id: str
    post_id: str
    viewed_at: datetime
    user_ip: Optional[str] = None
    user_agent: Optional[str] = None

    class Config:
        from_attributes = True
    """Schema for n8n incoming webhook payload"""
    title_tr: str = Field(..., description="Turkish title")
    content_tr: str = Field(..., description="Turkish content")
    title_en: Optional[str] = None
    content_en: Optional[str] = None
    slug: str = Field(..., description="URL slug")
    excerpt_tr: Optional[str] = None
    excerpt_en: Optional[str] = None
    featured_image_url: Optional[str] = None
    status: PostStatus = Field(default=PostStatus.DRAFT)
    auto_publish: Optional[bool] = Field(default=False, description="Auto-publish after creation")


class BulkOperationResponse(BaseModel):
    """Schema for bulk operation responses"""
    success: bool
    message: str
    affected_rows: int


# ============================================================================
# N8N WEBHOOK MODELS
# ============================================================================

class N8NWebhookPayload(BaseModel):
    """Schema for n8n webhook payloads - supports bilingual content"""
    title_en: str = Field(..., description="English title")
    content_en: str = Field(..., description="English content (markdown)")
    title_tr: str = Field(..., description="Turkish title")
    content_tr: str = Field(..., description="Turkish content (markdown)")
    slug: str = Field(..., description="URL slug")
    excerpt_en: Optional[str] = None
    excerpt_tr: Optional[str] = None
    featured_image_url: Optional[str] = None
    author: Optional[str] = None
    category_id: Optional[str] = None
    category_name_tr: Optional[str] = None
    category_name: Optional[str] = None
    status: PostStatus = Field(default=PostStatus.DRAFT)
    auto_publish: Optional[bool] = Field(default=False, description="Auto-publish after creation")
    metadata: Optional[dict] = None
