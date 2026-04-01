"""
Blog API Routes
FastAPI endpoints for blog management and n8n integration
"""

import os
import re
import unicodedata
from typing import Optional
from logging import getLogger
from dotenv import load_dotenv

from fastapi import APIRouter, HTTPException, Depends, Header, Query, File, UploadFile, Form
from fastapi.responses import JSONResponse

from .models import (
    PostCreate,
    PostUpdate,
    PostResponse,
    PostListResponse,
    PostStatus,
    N8NWebhookPayload,
    BulkOperationResponse,
    CategoryBase,
    CategoryResponse,
)
from .database import get_blog_service

# Load environment variables
load_dotenv()

logger = getLogger(__name__)
router = APIRouter()


def _slugify(value: str) -> str:
    """Create a URL-friendly slug from Turkish/Unicode text."""
    normalized = unicodedata.normalize("NFKD", value or "")
    ascii_text = normalized.encode("ascii", "ignore").decode("ascii")
    lowered = ascii_text.lower().strip()
    slug = re.sub(r"[^a-z0-9]+", "-", lowered).strip("-")
    return slug or "post"

# Configuration
API_KEY_HEADER = "X-API-KEY"
VALID_API_KEYS = [
    os.getenv("BLOG_ADMIN_KEY", "super-secret-admin-key-12345"),
    os.getenv("BLOG_N8N_KEY", "super-secret-n8n-key-67890"),
]


async def verify_api_key(x_api_key: Optional[str] = Header(None)) -> str:
    """Verify API key for protected endpoints"""
    if not x_api_key or x_api_key not in VALID_API_KEYS:
        logger.warning(f"Unauthorized API key attempt: {x_api_key}")
        raise HTTPException(status_code=401, detail="Invalid or missing API key")
    return x_api_key


# ============================================================================
# N8N Integration Endpoint
# ============================================================================


@router.post(
    "/ingest-post",
    response_model=PostResponse,
    summary="Ingest blog post from n8n",
    tags=["n8n Integration"],
)
async def ingest_post_from_n8n(
    payload: N8NWebhookPayload,
    api_key: str = Depends(verify_api_key),
) -> PostResponse:
    """
    Webhook endpoint for receiving blog posts from n8n automation.

    **Security**: Requires X-API-KEY header for authentication.

    **Request Body Example**:
    ```json
    {
      "title_tr": "Yapay Zeka Nedir?",
      "content_tr": "# Yapay Zeka Hakkında\n\nYapay zeka...",
      "title_en": "What is AI?",
      "content_en": "# About Artificial Intelligence\n\nAI is...",
      "slug": "yapay-zeka-nedir",
      "excerpt_tr": "Yapay zekanın açıklaması",
      "excerpt_en": "Explanation of AI",
      "featured_image_url": "https://example.com/image.jpg",
      "status": "draft",
      "auto_publish": false
    }
    ```
    """
    try:
        service = get_blog_service()

        # Create post data
        post_create = PostCreate(
            title_tr=payload.title_tr,
            content_tr=payload.content_tr,
            title_en=payload.title_en,
            content_en=payload.content_en,
            slug=payload.slug,
            status=payload.status,
            excerpt_tr=payload.excerpt_tr,
            excerpt_en=payload.excerpt_en,
            featured_image_url=payload.featured_image_url,
        )

        # Create post in database
        created_post = await service.create_post(post_create)

        # If auto_publish flag is set, publish the post
        if payload.auto_publish:
            created_post = await service.publish_post(created_post.id)
            logger.info(f"Post auto-published from n8n: {created_post.id}")

        logger.info(
            f"Post ingested from n8n successfully: {created_post.id} "
            f"(slug: {created_post.slug})"
        )

        return created_post

    except Exception as e:
        logger.error(f"Error ingesting post from n8n: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to ingest post: {str(e)}")


# ============================================================================
# Blog Post CRUD Endpoints
# ============================================================================


@router.post(
    "/posts",
    response_model=PostResponse,
    summary="Create a new blog post",
    tags=["Blog Posts"],
)
async def create_post(
    title_tr: str = Form(...),
    content_tr: str = Form(...),
    slug: str = Form(None),
    title_en: str = Form(None),
    content_en: str = Form(None),
    excerpt_tr: str = Form(None),
    excerpt_en: str = Form(None),
    category_id: str = Form(None),
    status: str = Form("draft"),
    featured_image: UploadFile = File(None),
    api_key: str = Depends(verify_api_key),
) -> PostResponse:
    """Create a new blog post with optional image upload (Admin only)"""
    try:
        service = get_blog_service()
        
        # Handle image upload if provided
        featured_image_url = None
        if featured_image:
            featured_image_url = await service.upload_image(featured_image)
            logger.info(f"Image uploaded: {featured_image_url}")

        safe_slug = _slugify(slug or title_tr)
        
        # Create post data
        post_data = PostCreate(
            title_tr=title_tr,
            content_tr=content_tr,
            title_en=title_en or title_tr,
            content_en=content_en or content_tr,
            slug=safe_slug,
            excerpt_tr=excerpt_tr or "",
            excerpt_en=excerpt_en or "",
            category_id=category_id if category_id else None,
            status=PostStatus(status) if status else PostStatus.DRAFT,
            featured_image_url=featured_image_url,
        )
        
        created_post = await service.create_post(post_data)
        logger.info(f"Post created via API: {created_post.id}")
        return created_post
    except Exception as e:
        logger.error(f"Error creating post: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create post: {str(e)}")


@router.get(
    "/posts",
    response_model=PostListResponse,
    summary="Get all posts with pagination",
    tags=["Blog Posts"],
)
async def get_posts(
    status: Optional[PostStatus] = Query(None, description="Filter by status"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
) -> PostListResponse:
    """Get all posts with optional filtering and pagination"""
    try:
        service = get_blog_service()
        result = await service.get_all_posts(status=status, page=page, page_size=page_size)
        return PostListResponse(**result)
    except Exception as e:
        logger.error(f"Error fetching posts: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch posts: {str(e)}")


@router.get(
    "/posts/slug/{slug}",
    response_model=PostResponse,
    summary="Get post by slug",
    tags=["Blog Posts"],
)
async def get_post_by_slug(slug: str) -> PostResponse:
    """Get a post by its URL slug and increment view count"""
    try:
        service = get_blog_service()
        post = await service.get_post_by_slug(slug)

        if not post:
            raise HTTPException(status_code=404, detail=f"Post not found: {slug}")

        # Increment view count if published
        if post.status == PostStatus.PUBLISHED:
            await service.increment_view_count(post.id)
            post.view_count += 1

        return post
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching post by slug: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch post: {str(e)}"
        )


@router.get(
    "/posts/{post_id}",
    response_model=PostResponse,
    summary="Get post by ID",
    tags=["Blog Posts"],
)
async def get_post(post_id: str) -> PostResponse:
    """Get a specific post by ID"""
    try:
        service = get_blog_service()
        post = await service.get_post_by_id(post_id)

        if not post:
            raise HTTPException(status_code=404, detail=f"Post not found: {post_id}")

        # Increment view count if published
        if post.status == PostStatus.PUBLISHED:
            await service.increment_view_count(post.id)
            post.view_count += 1

        return post
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching post: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch post: {str(e)}"
        )


@router.put(
    "/posts/{post_id}",
    response_model=PostResponse,
    summary="Update a blog post",
    tags=["Blog Posts"],
)
async def update_post(
    post_id: str,
    post_data: PostUpdate,
    api_key: str = Depends(verify_api_key),
) -> PostResponse:
    """Update an existing blog post (Admin only)"""
    try:
        service = get_blog_service()

        # Check if post exists
        existing_post = await service.get_post_by_id(post_id)
        if not existing_post:
            raise HTTPException(status_code=404, detail=f"Post not found: {post_id}")

        updated_post = await service.update_post(post_id, post_data)
        logger.info(f"Post updated via API: {post_id}")
        return updated_post
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating post: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update post: {str(e)}")


@router.post(
    "/posts/{post_id}/publish",
    response_model=PostResponse,
    summary="Publish a draft post",
    tags=["Blog Posts"],
)
async def publish_post(
    post_id: str,
    api_key: str = Depends(verify_api_key),
) -> PostResponse:
    """Publish a draft post (Admin only)"""
    try:
        service = get_blog_service()

        # Check if post exists
        existing_post = await service.get_post_by_id(post_id)
        if not existing_post:
            raise HTTPException(status_code=404, detail=f"Post not found: {post_id}")

        if existing_post.status != PostStatus.DRAFT:
            raise HTTPException(
                status_code=400,
                detail=f"Only draft posts can be published. Current status: {existing_post.status}",
            )

        published_post = await service.publish_post(post_id)
        logger.info(f"Post published via API: {post_id}")
        return published_post
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error publishing post: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to publish post: {str(e)}")


@router.delete(
    "/posts/{post_id}",
    response_model=BulkOperationResponse,
    summary="Delete a blog post",
    tags=["Blog Posts"],
)
async def delete_post(
    post_id: str,
    api_key: str = Depends(verify_api_key),
) -> BulkOperationResponse:
    """Delete a blog post (Admin only)"""
    try:
        service = get_blog_service()

        # Check if post exists
        existing_post = await service.get_post_by_id(post_id)
        if not existing_post:
            raise HTTPException(status_code=404, detail=f"Post not found: {post_id}")

        await service.delete_post(post_id)
        logger.info(f"Post deleted via API: {post_id}")

        return BulkOperationResponse(
            success=True,
            message=f"Post deleted successfully: {post_id}",
            affected_rows=1,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting post: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete post: {str(e)}")


# ============================================================================
# Categories Endpoints
# ============================================================================


@router.get("/categories", response_model=list[CategoryResponse])
async def get_categories():
    """Get all blog categories"""
    try:
        service = get_blog_service()
        categories = await service.get_categories()
        return categories
    except Exception as e:
        logger.error(f"Error fetching categories: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch categories: {str(e)}")


@router.post("/categories", response_model=CategoryResponse)
async def create_category(
    category: CategoryBase,
    api_key: str = Depends(verify_api_key),
):
    """Create a new category (admin only)"""
    try:
        service = get_blog_service()
        new_category = await service.create_category(category)
        logger.info(f"Category created: {new_category.id}")
        return new_category
    except Exception as e:
        logger.error(f"Error creating category: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create category: {str(e)}")


@router.delete("/categories/{category_id}")
async def delete_category(
    category_id: str,
    api_key: str = Depends(verify_api_key),
):
    """Delete a category (admin only)"""
    try:
        service = get_blog_service()
        await service.delete_category(category_id)
        logger.info(f"Category deleted: {category_id}")
        return BulkOperationResponse(
            success=True,
            message=f"Category deleted successfully: {category_id}",
            affected_rows=1,
        )
    except Exception as e:
        logger.error(f"Error deleting category: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete category: {str(e)}")


# ============================================================================
# Search Endpoint
# ============================================================================


@router.get(
    "/posts/search",
    response_model=list[PostResponse],
    summary="Search posts",
    tags=["Blog Posts"],
)
async def search_posts(
    q: str = Query(..., min_length=2, description="Search query"),
) -> list[PostResponse]:
    """Search published posts by title or content"""
    try:
        service = get_blog_service()
        results = await service.search_posts(q)
        logger.info(f"Posts searched: {len(results)} results for '{q}'")
        return results
    except Exception as e:
        logger.error(f"Error searching posts: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")
