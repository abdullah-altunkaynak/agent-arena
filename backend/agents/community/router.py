"""
Communities and Categories API Routes
"""
from fastapi import APIRouter, HTTPException, status, Header, Depends, Query, Body
from pydantic import BaseModel, validator, Field
from typing import Optional, List
from sqlalchemy.orm import Session
from datetime import datetime
import uuid
import re

from engine.community_models import Community, Category, Thread, User, UserProfile
from auth.utils import JWTHandler
from blog.database import BlogDatabaseService

router = APIRouter(prefix="/api/community", tags=["community"])
db_client = BlogDatabaseService()


# Pydantic Models
class CategoryCreate(BaseModel):
    """Create category request"""
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    icon: Optional[str] = None
    color: Optional[str] = None

    @validator("name")
    def validate_name(cls, v):
        if not v.strip():
            raise ValueError("Name cannot be empty")
        return v.strip()

    @validator("color")
    def validate_color(cls, v):
        if v and not re.match(r"^#[0-9A-F]{6}$", v, re.IGNORECASE):
            raise ValueError("Invalid color format (use #RRGGBB)")
        return v


class ThreadCreate(BaseModel):
    """Create thread request"""
    title: str = Field(..., min_length=3, max_length=255)
    content: str = Field(..., min_length=10, max_length=10000)
    category_id: str

    @validator("title")
    def validate_title(cls, v):
        if not v.strip():
            raise ValueError("Title cannot be empty")
        return v.strip()

    @validator("content")
    def validate_content(cls, v):
        if not v.strip():
            raise ValueError("Content cannot be empty")
        return v.strip()


class ThreadUpdate(BaseModel):
    """Update thread request"""
    title: Optional[str] = Field(None, min_length=3, max_length=255)
    content: Optional[str] = Field(None, min_length=10, max_length=10000)
    is_pinned: Optional[bool] = None
    is_locked: Optional[bool] = None


class CommentCreate(BaseModel):
    """Create comment request"""
    content: str = Field(..., min_length=1, max_length=5000)
    thread_id: str
    parent_comment_id: Optional[str] = None

    @validator("content")
    def validate_content(cls, v):
        if not v.strip():
            raise ValueError("Content cannot be empty")
        return v.strip()


class CommentUpdate(BaseModel):
    """Update comment request"""
    content: str = Field(..., min_length=1, max_length=5000)

    @validator("content")
    def validate_content(cls, v):
        if not v.strip():
            raise ValueError("Content cannot be empty")
        return v.strip()


# Response Models
class CategoryResponse(BaseModel):
    """Category response"""
    id: str
    name: str
    description: Optional[str]
    slug: str
    icon: Optional[str]
    color: Optional[str]
    threads_count: int
    created_at: str


class ThreadResponse(BaseModel):
    """Thread response"""
    id: str
    title: str
    content: str
    slug: str
    author: dict
    category_id: str
    is_pinned: bool
    is_locked: bool
    views_count: int
    replies_count: int
    created_at: str
    updated_at: str
    last_reply_at: Optional[str]


class CommentResponse(BaseModel):
    """Comment response"""
    id: str
    content: str
    author: dict
    thread_id: str
    parent_comment_id: Optional[str]
    likes_count: int
    is_edited: bool
    created_at: str
    updated_at: str


class CommunityResponse(BaseModel):
    """Community response"""
    id: str
    name: str
    description: Optional[str]
    icon_url: Optional[str]
    banner_url: Optional[str]
    is_public: bool
    members_count: int
    threads_count: int
    created_at: str


# Helper function
def get_current_user_id(authorization: Optional[str] = Header(None)) -> str:
    """Extract and verify JWT token"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")

    token = authorization[7:]
    payload = JWTHandler.verify_token(token, token_type="access")

    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    return payload.get("sub")


def generate_slug(text: str) -> str:
    """Generate URL-friendly slug"""
    slug = re.sub(r"[^\w\s-]", "", text.lower())
    slug = re.sub(r"[-\s]+", "-", slug)
    return slug.strip("-")


# Community Routes

@router.get("/communities", response_model=List[CommunityResponse])
async def list_communities(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    is_public: Optional[bool] = None,
):
    """
    List all communities
    """
    try:
        query = db_client.client.table("communities").select("*")

        if is_public is not None:
            query = query.eq("is_public", is_public)

        result = query.range(skip, skip + limit - 1).order("created_at", desc=True).execute()

        return [
            CommunityResponse(
                id=c["id"],
                name=c["name"],
                description=c["description"],
                icon_url=c["icon_url"],
                banner_url=c["banner_url"],
                is_public=c["is_public"],
                members_count=c["members_count"],
                threads_count=c["threads_count"],
                created_at=c["created_at"],
            )
            for c in result.data
        ]

    except Exception as e:
        print(f"List communities error: {e}")
        raise HTTPException(status_code=500, detail="Failed to list communities")


@router.get("/communities/{community_id}", response_model=CommunityResponse)
async def get_community(community_id: str):
    """
    Get community details
    """
    try:
        result = db_client.client.table("communities").select("*").eq("id", community_id).execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="Community not found")

        c = result.data[0]

        return CommunityResponse(
            id=c["id"],
            name=c["name"],
            description=c["description"],
            icon_url=c["icon_url"],
            banner_url=c["banner_url"],
            is_public=c["is_public"],
            members_count=c["members_count"],
            threads_count=c["threads_count"],
            created_at=c["created_at"],
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Get community error: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve community")


@router.post("/communities", response_model=CommunityResponse, status_code=status.HTTP_201_CREATED)
async def create_community(
    name: str = Body(...),
    description: Optional[str] = Body(None),
    is_public: bool = Body(True),
    current_user_id: str = Depends(get_current_user_id),
):
    """
    Create new community (admin only)
    """
    try:
        # Check if user is admin
        user_result = db_client.client.table("users").select("role_id").eq("id", current_user_id).execute()
        
        if not user_result.data:
            raise HTTPException(status_code=404, detail="User not found")

        role_id = user_result.data[0]["role_id"]
        admin_role = db_client.client.table("roles").select("id").eq("name", "admin").execute()

        if not admin_role.data or role_id != admin_role.data[0]["id"]:
            raise HTTPException(status_code=403, detail="Only admins can create communities")

        community_data = {
            "id": str(uuid.uuid4()),
            "name": name,
            "description": description,
            "owner_id": current_user_id,
            "is_public": is_public,
            "members_count": 1,
            "threads_count": 0,
        }

        result = db_client.client.table("communities").insert(community_data).execute()

        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to create community")

        c = result.data[0]

        return CommunityResponse(
            id=c["id"],
            name=c["name"],
            description=c["description"],
            icon_url=c["icon_url"],
            banner_url=c["banner_url"],
            is_public=c["is_public"],
            members_count=c["members_count"],
            threads_count=c["threads_count"],
            created_at=c["created_at"],
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Create community error: {e}")
        raise HTTPException(status_code=500, detail="Failed to create community")


# Category Routes

@router.get("/communities/{community_id}/categories", response_model=List[CategoryResponse])
async def list_categories(community_id: str):
    """
    List categories in a community
    """
    try:
        result = (
            db_client.client.table("categories")
            .select("*")
            .eq("community_id", community_id)
            .order("order", asc=True)
            .execute()
        )

        return [
            CategoryResponse(
                id=c["id"],
                name=c["name"],
                description=c["description"],
                slug=c["slug"],
                icon=c["icon"],
                color=c["color"],
                threads_count=c["threads_count"],
                created_at=c["created_at"],
            )
            for c in result.data
        ]

    except Exception as e:
        print(f"List categories error: {e}")
        raise HTTPException(status_code=500, detail="Failed to list categories")


@router.post("/communities/{community_id}/categories", response_model=CategoryResponse, 
             status_code=status.HTTP_201_CREATED)
async def create_category(
    community_id: str,
    request: CategoryCreate,
    current_user_id: str = Depends(get_current_user_id),
):
    """
    Create category in community (moderator+)
    """
    try:
        # Check if user is moderator or admin
        user_result = db_client.client.table("users").select("role_id").eq("id", current_user_id).execute()
        
        if not user_result.data:
            raise HTTPException(status_code=404, detail="User not found")

        role_id = user_result.data[0]["role_id"]
        mod_roles = db_client.client.table("roles").select("id").in_("name", ["admin", "moderator"]).execute()
        mod_role_ids = [r["id"] for r in mod_roles.data]

        if role_id not in mod_role_ids:
            raise HTTPException(status_code=403, detail="Only moderators can create categories")

        slug = generate_slug(request.name)

        category_data = {
            "id": str(uuid.uuid4()),
            "community_id": community_id,
            "name": request.name,
            "description": request.description,
            "slug": slug,
            "icon": request.icon,
            "color": request.color,
            "created_by": current_user_id,
            "threads_count": 0,
        }

        result = db_client.client.table("categories").insert(category_data).execute()

        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to create category")

        c = result.data[0]

        return CategoryResponse(
            id=c["id"],
            name=c["name"],
            description=c["description"],
            slug=c["slug"],
            icon=c["icon"],
            color=c["color"],
            threads_count=c["threads_count"],
            created_at=c["created_at"],
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Create category error: {e}")
        raise HTTPException(status_code=500, detail="Failed to create category")


# Batch endpoints for frontend
@router.get("/threads/trending", response_model=List[ThreadResponse])
async def get_trending_threads(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=50),
):
    """
    Get trending threads (most viewed)
    """
    try:
        result = (
            db_client.client.table("threads")
            .select("*")
            .eq("is_locked", False)
            .range(skip, skip + limit - 1)
            .order("views_count", desc=True)
            .execute()
        )

        threads = []
        for t in result.data:
            author_result = db_client.client.table("users").select("username, full_name, avatar_url").eq("id", t["author_id"]).execute()
            author = author_result.data[0] if author_result.data else {}

            threads.append(
                ThreadResponse(
                    id=t["id"],
                    title=t["title"],
                    content=t["content"][:200],  # Summary
                    slug=t["slug"],
                    author=author,
                    category_id=t["category_id"],
                    is_pinned=t["is_pinned"],
                    is_locked=t["is_locked"],
                    views_count=t["views_count"],
                    replies_count=t["replies_count"],
                    created_at=t["created_at"],
                    updated_at=t["updated_at"],
                    last_reply_at=t["last_reply_at"],
                )
            )

        return threads

    except Exception as e:
        print(f"Get trending threads error: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve trending threads")


@router.get("/threads/recent", response_model=List[ThreadResponse])
async def get_recent_threads(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=50),
):
    """
    Get recent threads
    """
    try:
        result = (
            db_client.client.table("threads")
            .select("*")
            .range(skip, skip + limit - 1)
            .order("created_at", desc=True)
            .execute()
        )

        threads = []
        for t in result.data:
            author_result = db_client.client.table("users").select("username, full_name, avatar_url").eq("id", t["author_id"]).execute()
            author = author_result.data[0] if author_result.data else {}

            threads.append(
                ThreadResponse(
                    id=t["id"],
                    title=t["title"],
                    content=t["content"][:200],
                    slug=t["slug"],
                    author=author,
                    category_id=t["category_id"],
                    is_pinned=t["is_pinned"],
                    is_locked=t["is_locked"],
                    views_count=t["views_count"],
                    replies_count=t["replies_count"],
                    created_at=t["created_at"],
                    updated_at=t["updated_at"],
                    last_reply_at=t["last_reply_at"],
                )
            )

        return threads

    except Exception as e:
        print(f"Get recent threads error: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve recent threads")
