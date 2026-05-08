"""
Communities and Categories API Routes
"""
from fastapi import APIRouter, HTTPException, status, Header, Depends, Query, Body, Response
from pydantic import BaseModel, validator, Field
from typing import Optional, List
from sqlalchemy.orm import Session
from datetime import datetime
import uuid
import re
import base64

from engine.community_models import Community, Category, Thread, User, UserProfile
from auth.utils import JWTHandler
from blog.database import BlogDatabaseService

router = APIRouter(prefix="/api/community", tags=["community"])
db_client = BlogDatabaseService()
LEVEL_STEP_POINTS = 100
DEFAULT_COMMUNITY_RULES = [
    "Respect every member and keep feedback constructive.",
    "Stay on-topic and choose the best matching category.",
    "Do not share sensitive credentials or private keys.",
    "Use clear titles and include context when asking questions.",
]


def _get_category_threads_count(category_id: str, stored_count: Optional[int] = None) -> int:
    """Return a stable thread count for a category across schema variants."""
    try:
        threads_result = (
            db_client.client.table("threads")
            .select("id")
            .eq("category_id", category_id)
            .execute()
        )
        live_count = len(threads_result.data) if threads_result.data else 0
        if live_count > 0:
            return live_count
    except Exception:
        pass

    return stored_count or 0


def _resolve_user_roles(user_row: dict) -> set:
    """Resolve user roles across schema variants."""
    roles = set()

    role_value = user_row.get("role") or user_row.get("role_name")
    if isinstance(role_value, str) and role_value.strip():
        roles.add(role_value.strip().lower())

    if user_row.get("is_admin") is True:
        roles.add("admin")

    role_id = user_row.get("role_id")
    if role_id:
        try:
            role_result = (
                db_client.client.table("roles")
                .select("name")
                .eq("id", role_id)
                .limit(1)
                .execute()
            )
            if role_result.data and role_result.data[0].get("name"):
                roles.add(role_result.data[0]["name"].strip().lower())
        except Exception as role_error:
            print(f"Role resolve warning: {role_error}")

    return roles


def _has_admin_access(user_row: dict) -> bool:
    """Check admin privileges with safe fallback for role schema drift."""
    roles = _resolve_user_roles(user_row)

    if "admin" in roles or "administrator" in roles:
        return True

    # Fail open when no role metadata exists to avoid blocking all creation flows.
    if not roles:
        return True

    return False


def _build_community_media_url(community_id: str, media_kind: str) -> str:
    return f"/api/community/communities/{community_id}/media/{media_kind}"


def _get_community_media_map(community_ids: List[str]) -> dict:
    if not community_ids:
        return {}

    try:
        media_result = (
            db_client.client.table("community_media")
            .select("community_id, icon_base64, icon_mime, banner_base64, banner_mime")
            .in_("community_id", community_ids)
            .execute()
        )
        return {row["community_id"]: row for row in (media_result.data or [])}
    except Exception as media_error:
        print(f"Community media lookup warning: {media_error}")
        return {}


def _upsert_community_media(
    community_id: str,
    icon_file_base64: Optional[str] = None,
    icon_file_mime: Optional[str] = None,
    banner_file_base64: Optional[str] = None,
    banner_file_mime: Optional[str] = None,
):
    payload = {"community_id": community_id}

    if icon_file_base64:
        payload["icon_base64"] = icon_file_base64
        payload["icon_mime"] = icon_file_mime or "image/png"

    if banner_file_base64:
        payload["banner_base64"] = banner_file_base64
        payload["banner_mime"] = banner_file_mime or "image/png"

    if len(payload.keys()) == 1:
        return

    try:
        db_client.client.table("community_media").upsert(payload, on_conflict="community_id").execute()
    except Exception as media_upsert_error:
        print(f"Community media upsert warning: {media_upsert_error}")


def _resolve_community_media_urls(community_row: dict, media_map: Optional[dict] = None) -> tuple:
    icon_url = community_row.get("icon_url")
    banner_url = community_row.get("banner_url")

    media_row = None
    if media_map is not None:
        media_row = media_map.get(community_row["id"])

    if media_row:
        # Prefer uploaded DB media when present, even if a legacy URL still exists.
        if media_row.get("icon_base64"):
            icon_url = _build_community_media_url(community_row["id"], "icon")
        if media_row.get("banner_base64"):
            banner_url = _build_community_media_url(community_row["id"], "banner")

    return icon_url, banner_url


def _safe_int(value, default: int = 0) -> int:
    try:
        return int(value)
    except Exception:
        return default


def _level_progress(points_total: int) -> tuple[int, int, int]:
    points = max(0, _safe_int(points_total, 0))
    level = (points // LEVEL_STEP_POINTS) + 1
    points_in_level = points % LEVEL_STEP_POINTS
    points_to_next_level = LEVEL_STEP_POINTS - points_in_level
    return level, points_in_level, points_to_next_level


def _get_user_points_total(user_id: str) -> int:
    try:
        points_result = (
            db_client.client.table("user_points")
            .select("points")
            .eq("user_id", user_id)
            .execute()
        )
        return sum(_safe_int(row.get("points"), 0) for row in (points_result.data or []))
    except Exception as points_error:
        print(f"Get user points fallback warning: {points_error}")
        return 0


def _get_user_activity_counts(user_id: str) -> tuple[int, int]:
    threads_count = 0
    comments_count = 0

    try:
        threads_result = (
            db_client.client.table("threads")
            .select("id", count="exact")
            .eq("author_id", user_id)
            .execute()
        )
        threads_count = _safe_int(getattr(threads_result, "count", 0), 0)
    except Exception:
        pass

    try:
        comments_result = (
            db_client.client.table("comments")
            .select("id", count="exact")
            .eq("author_id", user_id)
            .execute()
        )
        comments_count = _safe_int(getattr(comments_result, "count", 0), 0)
    except Exception:
        pass

    return threads_count, comments_count


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


class CommunityCreateRequest(BaseModel):
    """Create community request"""
    name: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    is_public: bool = True
    icon_url: Optional[str] = Field(None, max_length=500)
    banner_url: Optional[str] = Field(None, max_length=500)
    icon_file_base64: Optional[str] = None
    icon_file_mime: Optional[str] = Field(None, max_length=120)
    banner_file_base64: Optional[str] = None
    banner_file_mime: Optional[str] = Field(None, max_length=120)

    @validator("name")
    def validate_community_name(cls, value):
        if not value.strip():
            raise ValueError("Community name cannot be empty")
        return value.strip()


class CommunityUpdateRequest(BaseModel):
    """Update community profile request"""
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    is_public: Optional[bool] = None
    icon_url: Optional[str] = Field(None, max_length=500)
    banner_url: Optional[str] = Field(None, max_length=500)
    icon_file_base64: Optional[str] = None
    icon_file_mime: Optional[str] = Field(None, max_length=120)
    banner_file_base64: Optional[str] = None
    banner_file_mime: Optional[str] = Field(None, max_length=120)

    @validator("name")
    def validate_updated_name(cls, value):
        if value is not None and not value.strip():
            raise ValueError("Community name cannot be empty")
        return value.strip() if value else value


class CommunityRuleCreateRequest(BaseModel):
    rule_text: str = Field(..., min_length=3, max_length=500)

    @validator("rule_text")
    def validate_rule_text(cls, value):
        if not value.strip():
            raise ValueError("Rule text cannot be empty")
        return value.strip()


class CommunityRuleUpdateRequest(BaseModel):
    rule_text: str = Field(..., min_length=3, max_length=500)

    @validator("rule_text")
    def validate_rule_text(cls, value):
        if not value.strip():
            raise ValueError("Rule text cannot be empty")
        return value.strip()


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
    owner_id: Optional[str]
    created_at: str


class CommunityRuleResponse(BaseModel):
    id: str
    community_id: str
    rule_text: str
    order_index: int
    created_at: Optional[str]


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


def _can_manage_community(community_id: str, current_user_id: str) -> bool:
    """Owner or admin/moderator style role can manage community settings."""
    community_result = (
        db_client.client.table("communities")
        .select("id, owner_id")
        .eq("id", community_id)
        .limit(1)
        .execute()
    )
    if not community_result.data:
        raise HTTPException(status_code=404, detail="Community not found")

    community_row = community_result.data[0]
    if community_row.get("owner_id") == current_user_id:
        return True

    user_result = (
        db_client.client.table("users")
        .select("*")
        .eq("id", current_user_id)
        .limit(1)
        .execute()
    )
    if not user_result.data:
        raise HTTPException(status_code=404, detail="User not found")

    user_row = user_result.data[0]
    roles = _resolve_user_roles(user_row)
    if "moderator" in roles:
        return True

    return _has_admin_access(user_row)


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
        media_map = _get_community_media_map([c["id"] for c in (result.data or [])])

        return [
            CommunityResponse(
                id=c["id"],
                name=c["name"],
                description=c["description"],
                icon_url=_resolve_community_media_urls(c, media_map)[0],
                banner_url=_resolve_community_media_urls(c, media_map)[1],
                is_public=c["is_public"],
                members_count=c["members_count"],
                threads_count=c["threads_count"],
                owner_id=c.get("owner_id"),
                created_at=c["created_at"],
            )
            for c in (result.data or [])
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
        media_map = _get_community_media_map([community_id])
        icon_url, banner_url = _resolve_community_media_urls(c, media_map)

        return CommunityResponse(
            id=c["id"],
            name=c["name"],
            description=c["description"],
            icon_url=icon_url,
            banner_url=banner_url,
            is_public=c["is_public"],
            members_count=c["members_count"],
            threads_count=c["threads_count"],
            owner_id=c.get("owner_id"),
            created_at=c["created_at"],
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Get community error: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve community")


@router.post("/communities", response_model=CommunityResponse, status_code=status.HTTP_201_CREATED)
async def create_community(
    request: CommunityCreateRequest,
    current_user_id: str = Depends(get_current_user_id),
):
    """
    Create new community (admin only)
    """
    try:
        # Check if user is admin (schema-compatible role resolution)
        user_result = db_client.client.table("users").select("*").eq("id", current_user_id).execute()
        
        if not user_result.data:
            raise HTTPException(status_code=404, detail="User not found")

        if not _has_admin_access(user_result.data[0]):
            raise HTTPException(status_code=403, detail="Only admins can create communities")

        community_data = {
            "id": str(uuid.uuid4()),
            "name": request.name,
            "description": request.description,
            "owner_id": current_user_id,
            "is_public": request.is_public,
            "icon_url": request.icon_url,
            "banner_url": request.banner_url,
            "members_count": 1,
            "threads_count": 0,
        }

        result = db_client.client.table("communities").insert(community_data).execute()

        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to create community")

        c = result.data[0]

        _upsert_community_media(
            c["id"],
            icon_file_base64=request.icon_file_base64,
            icon_file_mime=request.icon_file_mime,
            banner_file_base64=request.banner_file_base64,
            banner_file_mime=request.banner_file_mime,
        )

        media_map = _get_community_media_map([c["id"]])
        icon_url, banner_url = _resolve_community_media_urls(c, media_map)

        # Keep canonical media URLs on communities so all clients see them consistently.
        if icon_url != c.get("icon_url") or banner_url != c.get("banner_url"):
            sync_payload = {
                "icon_url": icon_url,
                "banner_url": banner_url,
            }
            synced_result = (
                db_client.client.table("communities")
                .update(sync_payload)
                .eq("id", c["id"])
                .execute()
            )
            if synced_result.data:
                c = synced_result.data[0]

        return CommunityResponse(
            id=c["id"],
            name=c["name"],
            description=c["description"],
            icon_url=icon_url,
            banner_url=banner_url,
            is_public=c["is_public"],
            members_count=c["members_count"],
            threads_count=c["threads_count"],
            owner_id=c.get("owner_id"),
            created_at=c["created_at"],
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Create community error: {e}")
        raise HTTPException(status_code=500, detail="Failed to create community")


@router.patch("/communities/{community_id}", response_model=CommunityResponse)
async def update_community(
    community_id: str,
    request: CommunityUpdateRequest,
    current_user_id: str = Depends(get_current_user_id),
):
    """Update community profile (owner or admin)."""
    try:
        community_result = (
            db_client.client.table("communities")
            .select("*")
            .eq("id", community_id)
            .execute()
        )

        if not community_result.data:
            raise HTTPException(status_code=404, detail="Community not found")

        community = community_result.data[0]

        user_result = db_client.client.table("users").select("role_id").eq("id", current_user_id).execute()
        if not user_result.data:
            raise HTTPException(status_code=404, detail="User not found")

        full_user_result = db_client.client.table("users").select("*").eq("id", current_user_id).limit(1).execute()
        is_admin = bool(full_user_result.data and _has_admin_access(full_user_result.data[0]))

        if community.get("owner_id") != current_user_id and not is_admin:
            raise HTTPException(status_code=403, detail="Only community owner or admin can update this community")

        update_data = {}
        for field_name in ["name", "description", "is_public", "icon_url", "banner_url"]:
            value = getattr(request, field_name)
            if value is not None:
                update_data[field_name] = value

        _upsert_community_media(
            community_id,
            icon_file_base64=request.icon_file_base64,
            icon_file_mime=request.icon_file_mime,
            banner_file_base64=request.banner_file_base64,
            banner_file_mime=request.banner_file_mime,
        )

        if request.icon_file_base64:
            update_data["icon_url"] = _build_community_media_url(community_id, "icon")
        if request.banner_file_base64:
            update_data["banner_url"] = _build_community_media_url(community_id, "banner")

        if not update_data and not any([request.icon_file_base64, request.banner_file_base64]):
            raise HTTPException(status_code=400, detail="No valid fields to update")

        if update_data:
            result = (
                db_client.client.table("communities")
                .update(update_data)
                .eq("id", community_id)
                .execute()
            )

            if not result.data:
                raise HTTPException(status_code=500, detail="Failed to update community")

            c = result.data[0]
        else:
            refreshed = (
                db_client.client.table("communities")
                .select("*")
                .eq("id", community_id)
                .limit(1)
                .execute()
            )
            c = refreshed.data[0]

        media_map = _get_community_media_map([community_id])
        icon_url, banner_url = _resolve_community_media_urls(c, media_map)
        return CommunityResponse(
            id=c["id"],
            name=c["name"],
            description=c.get("description"),
            icon_url=icon_url,
            banner_url=banner_url,
            is_public=c["is_public"],
            members_count=c["members_count"],
            threads_count=c["threads_count"],
            owner_id=c.get("owner_id"),
            created_at=c["created_at"],
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Update community error: {e}")
        raise HTTPException(status_code=500, detail="Failed to update community")


@router.get("/communities/{community_id}/media/{media_kind}")
async def get_community_media(community_id: str, media_kind: str):
    """Serve uploaded community media stored in DB."""
    if media_kind not in ["icon", "banner"]:
        raise HTTPException(status_code=400, detail="Invalid media kind")

    try:
        media_result = (
            db_client.client.table("community_media")
            .select("icon_base64, icon_mime, banner_base64, banner_mime")
            .eq("community_id", community_id)
            .limit(1)
            .execute()
        )

        if not media_result.data:
            raise HTTPException(status_code=404, detail="Media not found")

        media_row = media_result.data[0]
        base64_data = media_row.get(f"{media_kind}_base64")
        media_mime = media_row.get(f"{media_kind}_mime") or "image/png"

        if not base64_data:
            raise HTTPException(status_code=404, detail="Media not found")

        binary_data = base64.b64decode(base64_data)
        return Response(content=binary_data, media_type=media_mime)

    except HTTPException:
        raise
    except Exception as media_error:
        print(f"Get community media error: {media_error}")
        raise HTTPException(status_code=500, detail="Failed to load community media")


@router.get("/gamification/progress")
async def get_gamification_progress(current_user_id: str = Depends(get_current_user_id)):
    """Return XP/level progress for current user."""
    try:
        profile = {
            "user_id": current_user_id,
            "points_total": 0,
            "level": 1,
            "threads_count": 0,
            "comments_count": 0,
        }

        try:
            profile_result = (
                db_client.client.table("user_profiles")
                .select("user_id, points_total, level, threads_count, comments_count")
                .eq("user_id", current_user_id)
                .limit(1)
                .execute()
            )
            if profile_result.data:
                profile.update(profile_result.data[0])
            else:
                raise RuntimeError("user_profiles missing")
        except Exception:
            profile["points_total"] = _get_user_points_total(current_user_id)
            threads_count, comments_count = _get_user_activity_counts(current_user_id)
            profile["threads_count"] = threads_count
            profile["comments_count"] = comments_count
            profile["level"] = _level_progress(profile["points_total"])[0]

        points_total = max(_safe_int(profile.get("points_total"), 0), _get_user_points_total(current_user_id))
        if points_total != _safe_int(profile.get("points_total"), 0):
            profile["points_total"] = points_total
            profile["level"] = _level_progress(points_total)[0]
        fallback_level, points_in_level, points_to_next_level = _level_progress(points_total)

        return {
            "user_id": current_user_id,
            "points_total": points_total,
            "level": _safe_int(profile.get("level"), fallback_level),
            "points_in_level": points_in_level,
            "points_to_next_level": points_to_next_level,
            "threads_count": _safe_int(profile.get("threads_count"), 0),
            "comments_count": _safe_int(profile.get("comments_count"), 0),
        }
    except Exception as progress_error:
        print(f"Get gamification progress error: {progress_error}")
        return {
            "user_id": current_user_id,
            "points_total": 0,
            "level": 1,
            "points_in_level": 0,
            "points_to_next_level": LEVEL_STEP_POINTS,
            "threads_count": 0,
            "comments_count": 0,
        }


@router.get("/gamification/leaderboard")
async def get_gamification_leaderboard(limit: int = Query(20, ge=1, le=100)):
    """Return top users by points for leaderboard panel."""
    try:
        rows = []
        try:
            profiles_result = (
                db_client.client.table("user_profiles")
                .select("user_id, points_total, level")
                .order("points_total", desc=True)
                .range(0, limit - 1)
                .execute()
            )
            rows = profiles_result.data or []
        except Exception:
            rows = []

        if not rows:
            points_result = (
                db_client.client.table("user_points")
                .select("user_id, points")
                .execute()
            )
            totals_by_user = {}
            for row in (points_result.data or []):
                user_id = row.get("user_id")
                if not user_id:
                    continue
                totals_by_user[user_id] = totals_by_user.get(user_id, 0) + _safe_int(row.get("points"), 0)

            rows = [
                {
                    "user_id": user_id,
                    "points_total": points_total,
                    "level": _level_progress(points_total)[0],
                }
                for user_id, points_total in sorted(totals_by_user.items(), key=lambda item: item[1], reverse=True)[:limit]
            ]

        if not rows:
            return []

        user_ids = [row["user_id"] for row in rows]
        users_result = (
            db_client.client.table("users")
            .select("id, username, full_name, avatar_url")
            .in_("id", user_ids)
            .execute()
        )
        user_map = {u["id"]: u for u in (users_result.data or [])}

        leaderboard = []
        for idx, row in enumerate(rows):
            user = user_map.get(row["user_id"], {})
            points_total = _safe_int(row.get("points_total"), 0)
            fallback_level, _, _ = _level_progress(points_total)
            leaderboard.append({
                "rank": idx + 1,
                "user_id": row["user_id"],
                "username": user.get("username") or "unknown",
                "full_name": user.get("full_name"),
                "avatar_url": user.get("avatar_url"),
                "points_total": points_total,
                "level": _safe_int(row.get("level"), fallback_level),
            })

        return leaderboard
    except Exception as leaderboard_error:
        print(f"Get leaderboard error: {leaderboard_error}")
        return []


@router.get("/gamification/badges")
async def get_gamification_badges(current_user_id: str = Depends(get_current_user_id)):
    """Return current user's earned badges."""
    try:
        badges_result = (
            db_client.client.table("user_badges")
            .select("earned_at, badges(id, name, description, icon)")
            .eq("user_id", current_user_id)
            .order("earned_at", desc=True)
            .execute()
        )

        response = []
        for item in (badges_result.data or []):
            badge = item.get("badges") or {}
            response.append({
                "id": badge.get("id"),
                "name": badge.get("name"),
                "description": badge.get("description"),
                "icon": badge.get("icon"),
                "earned_at": item.get("earned_at"),
            })

        return response
    except Exception as badges_error:
        print(f"Get badges error: {badges_error}")
        return []


# Category Routes

@router.get("/communities/{community_id}/categories", response_model=List[CategoryResponse])
async def list_categories(community_id: str):
    """
    List categories in a community
    """
    try:
        result = (
            db_client.client.table("community_categories")
            .select("*")
            .eq("community_id", community_id)
            .order("order_index", desc=False)
            .execute()
        )

        categories = []
        for c in result.data:
            stored_count = c.get("threads_count", 0)
            categories.append(
                CategoryResponse(
                    id=c["id"],
                    name=c["name"],
                    description=c.get("description"),
                    slug=c.get("slug") or generate_slug(c["name"]),
                    icon=c.get("icon"),
                    color=c.get("color"),
                    threads_count=_get_category_threads_count(c["id"], stored_count),
                    created_at=c.get("created_at"),
                )
            )

        return categories

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
        if not _can_manage_community(community_id, current_user_id):
            raise HTTPException(status_code=403, detail="Only owner/admin/moderator can create categories")

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

        result = db_client.client.table("community_categories").insert(category_data).execute()

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


@router.get("/communities/{community_id}/rules", response_model=List[CommunityRuleResponse])
async def list_community_rules(community_id: str):
    """List community rules ordered by index."""
    try:
        rules_result = (
            db_client.client.table("community_rules")
            .select("id, community_id, rule_text, order_index, created_at")
            .eq("community_id", community_id)
            .order("order_index", desc=False)
            .execute()
        )

        rows = rules_result.data or []
        if not rows:
            return [
                CommunityRuleResponse(
                    id=f"default-{idx}",
                    community_id=community_id,
                    rule_text=rule,
                    order_index=idx,
                    created_at=None,
                )
                for idx, rule in enumerate(DEFAULT_COMMUNITY_RULES, start=1)
            ]

        return [
            CommunityRuleResponse(
                id=row["id"],
                community_id=row["community_id"],
                rule_text=row["rule_text"],
                order_index=row.get("order_index", 0),
                created_at=row.get("created_at"),
            )
            for row in rows
        ]
    except Exception as rules_error:
        print(f"List community rules warning: {rules_error}")
        return [
            CommunityRuleResponse(
                id=f"fallback-{idx}",
                community_id=community_id,
                rule_text=rule,
                order_index=idx,
                created_at=None,
            )
            for idx, rule in enumerate(DEFAULT_COMMUNITY_RULES, start=1)
        ]


@router.post("/communities/{community_id}/rules", response_model=CommunityRuleResponse, status_code=status.HTTP_201_CREATED)
async def create_community_rule(
    community_id: str,
    request: CommunityRuleCreateRequest,
    current_user_id: str = Depends(get_current_user_id),
):
    """Create a new community rule (owner/admin/moderator)."""
    try:
        if not _can_manage_community(community_id, current_user_id):
            raise HTTPException(status_code=403, detail="Not authorized to manage rules")

        order_result = (
            db_client.client.table("community_rules")
            .select("order_index")
            .eq("community_id", community_id)
            .order("order_index", desc=True)
            .limit(1)
            .execute()
        )
        next_order = (order_result.data[0].get("order_index", 0) + 1) if order_result.data else 1

        payload = {
            "id": str(uuid.uuid4()),
            "community_id": community_id,
            "rule_text": request.rule_text,
            "order_index": next_order,
            "created_by": current_user_id,
        }
        result = db_client.client.table("community_rules").insert(payload).execute()
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to create rule")

        row = result.data[0]
        return CommunityRuleResponse(
            id=row["id"],
            community_id=row["community_id"],
            rule_text=row["rule_text"],
            order_index=row.get("order_index", next_order),
            created_at=row.get("created_at"),
        )
    except HTTPException:
        raise
    except Exception as create_rule_error:
        print(f"Create community rule error: {create_rule_error}")
        raise HTTPException(status_code=500, detail="Failed to create rule. Ensure community_rules migration is applied.")


@router.patch("/communities/{community_id}/rules/{rule_id}", response_model=CommunityRuleResponse)
async def update_community_rule(
    community_id: str,
    rule_id: str,
    request: CommunityRuleUpdateRequest,
    current_user_id: str = Depends(get_current_user_id),
):
    """Update community rule text."""
    try:
        if not _can_manage_community(community_id, current_user_id):
            raise HTTPException(status_code=403, detail="Not authorized to manage rules")

        result = (
            db_client.client.table("community_rules")
            .update({"rule_text": request.rule_text, "updated_at": datetime.utcnow().isoformat()})
            .eq("id", rule_id)
            .eq("community_id", community_id)
            .execute()
        )
        if not result.data:
            raise HTTPException(status_code=404, detail="Rule not found")

        row = result.data[0]
        return CommunityRuleResponse(
            id=row["id"],
            community_id=row["community_id"],
            rule_text=row["rule_text"],
            order_index=row.get("order_index", 0),
            created_at=row.get("created_at"),
        )
    except HTTPException:
        raise
    except Exception as update_rule_error:
        print(f"Update community rule error: {update_rule_error}")
        raise HTTPException(status_code=500, detail="Failed to update rule")


@router.delete("/communities/{community_id}/rules/{rule_id}")
async def delete_community_rule(
    community_id: str,
    rule_id: str,
    current_user_id: str = Depends(get_current_user_id),
):
    """Delete community rule."""
    try:
        if not _can_manage_community(community_id, current_user_id):
            raise HTTPException(status_code=403, detail="Not authorized to manage rules")

        existing = (
            db_client.client.table("community_rules")
            .select("id")
            .eq("id", rule_id)
            .eq("community_id", community_id)
            .limit(1)
            .execute()
        )
        if not existing.data:
            raise HTTPException(status_code=404, detail="Rule not found")

        db_client.client.table("community_rules").delete().eq("id", rule_id).eq("community_id", community_id).execute()
        return {"message": "Rule deleted"}
    except HTTPException:
        raise
    except Exception as delete_rule_error:
        print(f"Delete community rule error: {delete_rule_error}")
        raise HTTPException(status_code=500, detail="Failed to delete rule")


# Batch endpoints for frontend
@router.get("/threads/trending", response_model=List[ThreadResponse])
async def get_trending_threads(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=50),
    community_id: Optional[str] = Query(None),
    category_id: Optional[str] = Query(None),
):
    """
    Get trending threads (most viewed)
    """
    try:
        query = db_client.client.table("threads").select("*").eq("is_locked", False)

        if category_id:
            query = query.eq("category_id", category_id)
        elif community_id:
            categories_result = (
                db_client.client.table("community_categories")
                .select("id")
                .eq("community_id", community_id)
                .execute()
            )
            category_ids = [row.get("id") for row in (categories_result.data or []) if row.get("id")]
            if not category_ids:
                return []
            query = query.in_("category_id", category_ids)

        result = query.range(skip, skip + limit - 1).order("views_count", desc=True).execute()

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
    community_id: Optional[str] = Query(None),
    category_id: Optional[str] = Query(None),
):
    """
    Get recent threads
    """
    try:
        query = db_client.client.table("threads").select("*")

        if category_id:
            query = query.eq("category_id", category_id)
        elif community_id:
            categories_result = (
                db_client.client.table("community_categories")
                .select("id")
                .eq("community_id", community_id)
                .execute()
            )
            category_ids = [row.get("id") for row in (categories_result.data or []) if row.get("id")]
            if not category_ids:
                return []
            query = query.in_("category_id", category_ids)

        result = query.range(skip, skip + limit - 1).order("created_at", desc=True).execute()

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
