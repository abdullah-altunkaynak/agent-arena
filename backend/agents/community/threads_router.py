"""
Thread and Comment Management API Routes
"""
from fastapi import APIRouter, HTTPException, status, Header, Depends, Query, Body
from pydantic import BaseModel, validator, Field
from typing import Optional, List
from datetime import datetime
import uuid
import re

from engine.community_models import Thread, Comment, User
from auth.utils import JWTHandler
from blog.database import BlogDatabaseService

router = APIRouter(prefix="/api/threads", tags=["threads"])
db_client = BlogDatabaseService()

LEVEL_STEP_POINTS = 100

DEFAULT_BADGES = [
    {
        "name": "First Thread",
        "description": "Created your first discussion thread.",
        "icon": "🧵",
        "points_threshold": None,
    },
    {
        "name": "First Comment",
        "description": "Posted your first comment.",
        "icon": "💬",
        "points_threshold": None,
    },
    {
        "name": "Contributor",
        "description": "Reached 100 total points.",
        "icon": "🌟",
        "points_threshold": 100,
    },
    {
        "name": "Expert",
        "description": "Reached 500 total points.",
        "icon": "🏆",
        "points_threshold": 500,
    },
]


# Pydantic Models for responses
class ThreadDetailResponse(BaseModel):
    """Detailed thread response"""
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
    likes_count: int
    created_at: str
    updated_at: str
    last_reply_at: Optional[str]


class CommentDetailResponse(BaseModel):
    """Detailed comment response"""
    id: str
    content: str
    author: dict
    thread_id: str
    parent_comment_id: Optional[str]
    likes_count: int
    is_edited: bool
    created_at: str
    updated_at: str


class ThreadListItem(BaseModel):
    """Thread list item"""
    id: str
    title: str
    slug: str
    author: dict
    category_id: str
    is_pinned: bool
    views_count: int
    replies_count: int
    created_at: str
    last_reply_at: Optional[str]


# Pydantic Models for requests
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
    return slug.strip("-")[:100]


def get_user_info(user_id: str) -> dict:
    """Get user info for response"""
    try:
        result = db_client.client.table("users").select(
            "id, username, full_name, avatar_url"
        ).eq("id", user_id).execute()
        
        if result.data:
            user = result.data[0]
            level = 1
            points_total = 0
            status_badges = []

            try:
                profile_result = (
                    db_client.client.table("user_profiles")
                    .select("level, points_total")
                    .eq("user_id", user_id)
                    .limit(1)
                    .execute()
                )
                if profile_result.data:
                    level = _safe_int(profile_result.data[0].get("level"), 1)
                    points_total = _safe_int(profile_result.data[0].get("points_total"), 0)
            except Exception:
                pass

            try:
                user_badges_result = (
                    db_client.client.table("user_badges")
                    .select("badge_id")
                    .eq("user_id", user_id)
                    .limit(3)
                    .execute()
                )
                badge_ids = [row.get("badge_id") for row in (user_badges_result.data or []) if row.get("badge_id")]

                if badge_ids:
                    badges_result = (
                        db_client.client.table("badges")
                        .select("id, name, icon")
                        .in_("id", badge_ids)
                        .execute()
                    )
                    badges_by_id = {badge["id"]: badge for badge in (badges_result.data or [])}
                    status_badges = [badges_by_id[badge_id] for badge_id in badge_ids if badge_id in badges_by_id]
            except Exception:
                pass

            return {
                "id": user["id"],
                "username": user["username"],
                "full_name": user["full_name"],
                "avatar_url": user["avatar_url"],
                "level": level,
                "points_total": points_total,
                "status_badges": status_badges,
            }
    except:
        pass
    
    return {
        "id": user_id,
        "username": "Unknown",
        "full_name": None,
        "avatar_url": None,
        "level": 1,
        "points_total": 0,
        "status_badges": [],
    }


def _normalize_thread_row(thread: dict) -> dict:
    """Fill missing fields so legacy and current thread schemas both work."""
    normalized = dict(thread)
    normalized.setdefault("views_count", 0)
    normalized.setdefault("replies_count", 0)
    normalized.setdefault("likes_count", 0)
    normalized.setdefault("is_pinned", False)
    normalized.setdefault("is_locked", False)
    normalized.setdefault("updated_at", normalized.get("created_at"))
    normalized.setdefault("last_reply_at", None)
    return normalized


def _count_thread_likes(thread_id: str) -> int:
    """Count thread likes without depending on a schema-specific likes_count column."""
    try:
        likes_result = (
            db_client.client.table("likes")
            .select("id")
            .eq("thread_id", thread_id)
            .execute()
        )
        return len(likes_result.data) if likes_result.data else 0
    except Exception:
        return 0


def _safe_int(value, default: int = 0) -> int:
    try:
        return int(value)
    except Exception:
        return default


def _calculate_level(points_total: int) -> int:
    return max(1, (points_total // LEVEL_STEP_POINTS) + 1)


def _ensure_user_profile(user_id: str) -> dict:
    profile_result = (
        db_client.client.table("user_profiles")
        .select("*")
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )

    if profile_result.data:
        return profile_result.data[0]

    create_result = db_client.client.table("user_profiles").insert({
        "user_id": user_id,
        "points_total": 0,
        "level": 1,
        "threads_count": 0,
        "comments_count": 0,
        "followers_count": 0,
        "following_count": 0,
    }).execute()

    if create_result.data:
        return create_result.data[0]

    refreshed = (
        db_client.client.table("user_profiles")
        .select("*")
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    if refreshed.data:
        return refreshed.data[0]

    raise HTTPException(status_code=500, detail="Failed to initialize user profile")


def _award_points(
    user_id: str,
    action_type: str,
    points: int,
    reference_id: Optional[str] = None,
    increment_threads: bool = False,
    increment_comments: bool = False,
):
    if not user_id or points <= 0:
        return

    try:
        log_payload = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "action_type": action_type,
            "points": points,
            "reason": reference_id or action_type,
        }
        db_client.client.table("user_points").insert(log_payload).execute()
    except Exception as points_log_error:
        print(f"Points log warning: {points_log_error}")

    try:
        profile = _ensure_user_profile(user_id)
        current_points = _safe_int(profile.get("points_total"), 0)
        current_threads = _safe_int(profile.get("threads_count"), 0)
        current_comments = _safe_int(profile.get("comments_count"), 0)

        updated_points = current_points + points
        update_payload = {
            "points_total": updated_points,
            "level": _calculate_level(updated_points),
            "last_active": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }

        if increment_threads:
            update_payload["threads_count"] = current_threads + 1

        if increment_comments:
            update_payload["comments_count"] = current_comments + 1

        db_client.client.table("user_profiles").update(update_payload).eq("user_id", user_id).execute()
        _evaluate_badges(
            user_id=user_id,
            points_total=updated_points,
            threads_count=update_payload.get("threads_count", current_threads),
            comments_count=update_payload.get("comments_count", current_comments),
        )
    except Exception as profile_points_error:
        print(f"User profile points warning: {profile_points_error}")


def _ensure_default_badges() -> None:
    try:
        existing_result = db_client.client.table("badges").select("id, name").execute()
        existing_names = {row.get("name") for row in (existing_result.data or [])}

        for badge in DEFAULT_BADGES:
            if badge["name"] in existing_names:
                continue

            db_client.client.table("badges").insert({
                "id": str(uuid.uuid4()),
                "name": badge["name"],
                "description": badge["description"],
                "icon": badge["icon"],
                "points_threshold": badge["points_threshold"],
            }).execute()
    except Exception as badge_seed_error:
        print(f"Badge seed warning: {badge_seed_error}")


def _grant_badge_by_name(user_id: str, badge_name: str) -> None:
    try:
        badge_result = (
            db_client.client.table("badges")
            .select("id")
            .eq("name", badge_name)
            .limit(1)
            .execute()
        )

        if not badge_result.data:
            return

        badge_id = badge_result.data[0]["id"]
        existing_user_badge = (
            db_client.client.table("user_badges")
            .select("id")
            .eq("user_id", user_id)
            .eq("badge_id", badge_id)
            .limit(1)
            .execute()
        )

        if existing_user_badge.data:
            return

        db_client.client.table("user_badges").insert({
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "badge_id": badge_id,
        }).execute()
    except Exception as grant_badge_error:
        print(f"Grant badge warning: {grant_badge_error}")


def _evaluate_badges(user_id: str, points_total: int, threads_count: int, comments_count: int) -> None:
    _ensure_default_badges()

    if threads_count >= 1:
        _grant_badge_by_name(user_id, "First Thread")
    if comments_count >= 1:
        _grant_badge_by_name(user_id, "First Comment")
    if points_total >= 100:
        _grant_badge_by_name(user_id, "Contributor")
    if points_total >= 500:
        _grant_badge_by_name(user_id, "Expert")


def resolve_thread_category_id(category_id: str, current_user_id: str) -> str:
    """Return a category id that is valid for the threads FK across schema variants."""
    try:
        categories_result = (
            db_client.client.table("categories")
            .select("id, slug, name_tr, name_en")
            .eq("id", category_id)
            .limit(1)
            .execute()
        )
        if categories_result.data:
            return category_id
    except Exception:
        pass

    try:
        community_category_result = (
            db_client.client.table("community_categories")
            .select("id, community_id, name, description, slug, icon, color, created_by")
            .eq("id", category_id)
            .limit(1)
            .execute()
        )

        if not community_category_result.data:
            raise HTTPException(status_code=404, detail="Category not found")

        source_category = community_category_result.data[0]
        common_slug = source_category.get("slug") or generate_slug(source_category["name"])
        category_name = source_category["name"]

        existing_candidates = []
        try:
            existing_candidates = (
                db_client.client.table("categories")
                .select("id")
                .or_(f"slug.eq.{common_slug},name_tr.eq.{category_name},name_en.eq.{category_name}")
                .limit(1)
                .execute()
                .data
                or []
            )
        except Exception:
            existing_candidates = []

        if existing_candidates:
            return existing_candidates[0]["id"]

        try:
            blog_style_payload = {
                "id": source_category["id"],
                "name_tr": category_name,
                "name_en": category_name,
                "slug": common_slug,
                "description_tr": source_category.get("description"),
                "description_en": source_category.get("description"),
                "icon": source_category.get("icon"),
            }
            insert_result = db_client.client.table("categories").insert(blog_style_payload).execute()
            if insert_result.data:
                return insert_result.data[0]["id"]
        except Exception:
            pass

        fallback_lookup = (
            db_client.client.table("categories")
            .select("id")
            .or_(f"slug.eq.{common_slug},name_tr.eq.{category_name},name_en.eq.{category_name}")
            .limit(1)
            .execute()
        )
        if fallback_lookup.data:
            return fallback_lookup.data[0]["id"]

        return source_category["id"]
    except HTTPException:
        raise
    except Exception as sync_error:
        raise HTTPException(status_code=500, detail=f"Category sync failed: {sync_error}")


# Thread Routes

@router.post("", response_model=ThreadDetailResponse, status_code=status.HTTP_201_CREATED)
async def create_thread(
    request: ThreadCreate,
    current_user_id: str = Depends(get_current_user_id),
):
    """
    Create a new thread
    """
    try:
        slug = generate_slug(request.title)
        resolved_category_id = resolve_thread_category_id(request.category_id, current_user_id)

        thread_data = {
            "id": str(uuid.uuid4()),
            "category_id": resolved_category_id,
            "author_id": current_user_id,
            "title": request.title,
            "content": request.content,
            "slug": slug,
            "is_pinned": False,
            "is_locked": False,
            "views_count": 1,
            "replies_count": 0,
        }

        result = db_client.client.table("threads").insert(thread_data).execute()

        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to create thread")

        thread = result.data[0]
        thread = _normalize_thread_row(thread)
        author = get_user_info(current_user_id)

        # Update category thread count
        try:
            db_client.client.rpc("increment_threads_count", {"category_id": resolved_category_id}).execute()
        except Exception as rpc_error:
            print(f"Thread count rpc warning: {rpc_error}")

        _award_points(
            user_id=current_user_id,
            action_type="thread_created",
            points=10,
            reference_id=thread["id"],
            increment_threads=True,
        )

        return ThreadDetailResponse(
            id=thread["id"],
            title=thread["title"],
            content=thread["content"],
            slug=thread["slug"],
            author=author,
            category_id=thread["category_id"],
            is_pinned=thread["is_pinned"],
            is_locked=thread["is_locked"],
            views_count=thread["views_count"],
            replies_count=thread["replies_count"],
            likes_count=0,
            created_at=thread.get("created_at"),
            updated_at=thread.get("updated_at"),
            last_reply_at=thread.get("last_reply_at"),
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Create thread error: {e}")
        raise HTTPException(status_code=500, detail="Failed to create thread")


@router.get("/{thread_id}", response_model=ThreadDetailResponse)
async def get_thread(thread_id: str):
    """
    Get thread details
    """
    try:
        result = db_client.client.table("threads").select("*").eq("id", thread_id).execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="Thread not found")

        thread = _normalize_thread_row(result.data[0])
        author = get_user_info(thread["author_id"])

        # Increment view count
        db_client.client.table("threads").update({
            "views_count": thread.get("views_count", 0) + 1
        }).eq("id", thread_id).execute()

        likes_count = _count_thread_likes(thread_id)

        return ThreadDetailResponse(
            id=thread["id"],
            title=thread["title"],
            content=thread["content"],
            slug=thread["slug"],
            author=author,
            category_id=thread["category_id"],
            is_pinned=thread.get("is_pinned", False),
            is_locked=thread.get("is_locked", False),
            views_count=thread.get("views_count", 0) + 1,
            replies_count=thread.get("replies_count", 0),
            likes_count=likes_count,
            created_at=thread.get("created_at") or datetime.utcnow().isoformat(),
            updated_at=thread.get("updated_at") or thread.get("created_at") or datetime.utcnow().isoformat(),
            last_reply_at=thread.get("last_reply_at"),
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Get thread error: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve thread")


@router.get("/{thread_id}/comments", response_model=List[CommentDetailResponse])
async def get_thread_comments(
    thread_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
):
    """
    Get comments on a thread
    """
    try:
        result = (
            db_client.client.table("comments")
            .select("*")
            .eq("thread_id", thread_id)
            .range(skip, skip + limit - 1)
            .order("created_at", desc=False)
            .execute()
        )

        comments = []
        for comment in result.data:
            author = get_user_info(comment["author_id"])
            comments.append(
                CommentDetailResponse(
                    id=comment["id"],
                    content=comment["content"],
                    author=author,
                    thread_id=comment["thread_id"],
                    parent_comment_id=comment["parent_comment_id"],
                    likes_count=comment.get("likes_count", 0),
                    is_edited=comment.get("is_edited", False),
                    created_at=comment.get("created_at"),
                    updated_at=comment.get("updated_at"),
                )
            )

        return comments

    except Exception as e:
        print(f"Get comments error: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve comments")


@router.post("/{thread_id}/comments", response_model=CommentDetailResponse, status_code=status.HTTP_201_CREATED)
async def create_comment(
    thread_id: str,
    request: CommentCreate,
    current_user_id: str = Depends(get_current_user_id),
):
    """
    Add comment to thread
    """
    try:
        # Check if thread exists
        thread_result = db_client.client.table("threads").select("id, is_locked").eq("id", thread_id).execute()

        if not thread_result.data:
            raise HTTPException(status_code=404, detail="Thread not found")

        thread = thread_result.data[0]

        if thread["is_locked"]:
            raise HTTPException(status_code=403, detail="Thread is locked")

        comment_data = {
            "id": str(uuid.uuid4()),
            "thread_id": thread_id,
            "parent_comment_id": request.parent_comment_id,
            "author_id": current_user_id,
            "content": request.content,
            "likes_count": 0,
            "is_edited": False,
        }

        result = db_client.client.table("comments").insert(comment_data).execute()

        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to create comment")

        comment = result.data[0]
        author = get_user_info(current_user_id)

        # Increment thread replies
        db_client.client.table("threads").update({
            "replies_count": thread.get("replies_count", 0) + 1,
            "last_reply_at": datetime.utcnow().isoformat(),
        }).eq("id", thread_id).execute()

        _award_points(
            user_id=current_user_id,
            action_type="comment_added",
            points=5,
            reference_id=comment["id"],
            increment_comments=True,
        )

        return CommentDetailResponse(
            id=comment["id"],
            content=comment["content"],
            author=author,
            thread_id=comment["thread_id"],
            parent_comment_id=comment["parent_comment_id"],
            likes_count=comment["likes_count"],
            is_edited=comment["is_edited"],
            created_at=comment["created_at"],
            updated_at=comment["updated_at"],
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Create comment error: {e}")
        raise HTTPException(status_code=500, detail="Failed to create comment")


@router.post("/{thread_id}/like")
async def like_thread(
    thread_id: str,
    current_user_id: str = Depends(get_current_user_id),
):
    """
    Like a thread
    """
    try:
        # Check if already liked
        thread_result = (
            db_client.client.table("threads")
            .select("id, author_id, likes_count")
            .eq("id", thread_id)
            .execute()
        )

        if not thread_result.data:
            raise HTTPException(status_code=404, detail="Thread not found")

        likes_table_available = True
        try:
            existing_like = (
                db_client.client.table("likes")
                .select("id")
                .eq("thread_id", thread_id)
                .eq("user_id", current_user_id)
                .limit(1)
                .execute()
            )

            if existing_like.data:
                raise HTTPException(status_code=400, detail="Already liked this thread")

            db_client.client.table("likes").insert({
                "id": str(uuid.uuid4()),
                "user_id": current_user_id,
                "thread_id": thread_id,
            }).execute()
        except Exception as like_error:
            print(f"Like table fallback warning: {like_error}")

        thread = _normalize_thread_row(thread_result.data[0])
        next_likes_count = thread.get("likes_count", 0) + 1

        try:
            db_client.client.table("threads").update({
                "likes_count": next_likes_count,
            }).eq("id", thread_id).execute()
        except Exception as update_error:
            print(f"Thread like counter warning: {update_error}")

        _award_points(
            user_id=thread.get("author_id"),
            action_type="like_received",
            points=2,
            reference_id=thread_id,
        )

        return {"message": "Thread liked successfully", "likes_count": next_likes_count}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Like thread error: {e}")
        raise HTTPException(status_code=500, detail="Failed to like thread")


@router.post("/comments/{comment_id}/like")
async def like_comment(
    comment_id: str,
    current_user_id: str = Depends(get_current_user_id),
):
    """
    Like a comment
    """
    try:
        # Check if already liked
        comment_result = db_client.client.table("comments").select("likes_count, author_id").eq(
            "id", comment_id
        ).execute()

        if not comment_result.data:
            raise HTTPException(status_code=404, detail="Comment not found")

        try:
            existing_like = (
                db_client.client.table("likes")
                .select("id")
                .eq("comment_id", comment_id)
                .eq("user_id", current_user_id)
                .limit(1)
                .execute()
            )

            if existing_like.data:
                raise HTTPException(status_code=400, detail="Already liked this comment")

            db_client.client.table("likes").insert({
                "id": str(uuid.uuid4()),
                "user_id": current_user_id,
                "comment_id": comment_id,
            }).execute()
        except Exception as like_error:
            print(f"Like table fallback warning: {like_error}")

        comment = comment_result.data[0]
        next_likes_count = comment.get("likes_count", 0) + 1

        try:
            db_client.client.table("comments").update({
                "likes_count": next_likes_count
            }).eq("id", comment_id).execute()
        except Exception as update_error:
            print(f"Comment like counter warning: {update_error}")

        _award_points(
            user_id=comment.get("author_id"),
            action_type="like_received",
            points=1,
            reference_id=comment_id,
        )

        return {"message": "Comment liked successfully", "likes_count": next_likes_count}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Like comment error: {e}")
        raise HTTPException(status_code=500, detail="Failed to like comment")


@router.put("/{thread_id}", response_model=ThreadDetailResponse)
async def update_thread(
    thread_id: str,
    request: ThreadUpdate,
    current_user_id: str = Depends(get_current_user_id),
):
    """
    Update thread (author or moderator only)
    """
    try:
        # Get thread
        thread_result = db_client.client.table("threads").select("*").eq("id", thread_id).execute()

        if not thread_result.data:
            raise HTTPException(status_code=404, detail="Thread not found")

        thread = thread_result.data[0]

        # Check permissions
        if thread["author_id"] != current_user_id:
            # Check if moderator
            user_result = db_client.client.table("users").select("role_id").eq("id", current_user_id).execute()
            mod_roles = db_client.client.table("roles").select("id").in_("name", ["admin", "moderator"]).execute()
            mod_role_ids = [r["id"] for r in mod_roles.data]

            if not user_result.data or user_result.data[0]["role_id"] not in mod_role_ids:
                raise HTTPException(status_code=403, detail="Not authorized to edit this thread")

        update_data = {"updated_at": datetime.utcnow().isoformat()}

        if request.title:
            update_data["title"] = request.title
            update_data["slug"] = generate_slug(request.title)

        if request.content:
            update_data["content"] = request.content

        if request.is_pinned is not None:
            update_data["is_pinned"] = request.is_pinned

        if request.is_locked is not None:
            update_data["is_locked"] = request.is_locked

        result = db_client.client.table("threads").update(update_data).eq("id", thread_id).execute()

        updated_thread = result.data[0] if result.data else thread
        author = get_user_info(updated_thread["author_id"])

        return ThreadDetailResponse(
            id=updated_thread["id"],
            title=updated_thread["title"],
            content=updated_thread["content"],
            slug=updated_thread["slug"],
            author=author,
            category_id=updated_thread["category_id"],
            is_pinned=updated_thread.get("is_pinned", False),
            is_locked=updated_thread.get("is_locked", False),
            views_count=updated_thread.get("views_count", 0),
            replies_count=updated_thread.get("replies_count", 0),
            likes_count=0,
            created_at=updated_thread.get("created_at") or datetime.utcnow().isoformat(),
            updated_at=updated_thread.get("updated_at") or updated_thread.get("created_at") or datetime.utcnow().isoformat(),
            last_reply_at=updated_thread.get("last_reply_at"),
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Update thread error: {e}")
        raise HTTPException(status_code=500, detail="Failed to update thread")


@router.delete("/{thread_id}")
async def delete_thread(
    thread_id: str,
    current_user_id: str = Depends(get_current_user_id),
):
    """
    Delete thread (author or moderator only)
    """
    try:
        thread_result = db_client.client.table("threads").select("*").eq("id", thread_id).execute()

        if not thread_result.data:
            raise HTTPException(status_code=404, detail="Thread not found")

        thread = thread_result.data[0]

        # Check permissions
        if thread["author_id"] != current_user_id:
            user_result = db_client.client.table("users").select("role_id").eq("id", current_user_id).execute()
            mod_roles = db_client.client.table("roles").select("id").in_("name", ["admin", "moderator"]).execute()
            mod_role_ids = [r["id"] for r in mod_roles.data]

            if not user_result.data or user_result.data[0]["role_id"] not in mod_role_ids:
                raise HTTPException(status_code=403, detail="Not authorized to delete this thread")

        # Delete related comments and likes
        db_client.client.table("comments").delete().eq("thread_id", thread_id).execute()
        db_client.client.table("likes").delete().eq("thread_id", thread_id).execute()

        # Delete thread
        db_client.client.table("threads").delete().eq("id", thread_id).execute()

        return {"message": "Thread deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Delete thread error: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete thread")
