"""
Thread and Comment Management API Routes
"""
from fastapi import APIRouter, HTTPException, status, Header, Depends, Query
from pydantic import BaseModel, validator, Field
from typing import Optional, List
from datetime import datetime
import uuid
import re

from ...engine.community_models import Thread, Comment, User
from ...auth.utils import JWTHandler
from ...blog.database import SupabaseClient

router = APIRouter(prefix="/api/threads", tags=["threads"])
db_client = SupabaseClient()


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
            return {
                "id": user["id"],
                "username": user["username"],
                "full_name": user["full_name"],
                "avatar_url": user["avatar_url"],
            }
    except:
        pass
    
    return {"id": user_id, "username": "Unknown", "full_name": None, "avatar_url": None}


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

        thread_data = {
            "id": str(uuid.uuid4()),
            "category_id": request.category_id,
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
        author = get_user_info(current_user_id)

        # Update category thread count
        db_client.client.rpc("increment_threads_count", {"category_id": request.category_id}).execute()

        # Add points to user for creating thread
        points_data = {
            "id": str(uuid.uuid4()),
            "user_id": current_user_id,
            "action_type": "thread_created",
            "points_earned": 10,
            "reference_id": thread["id"],
        }
        db_client.client.table("points_log").insert(points_data).execute()

        # Update user profile
        db_client.client.rpc("add_user_points", {"user_id": current_user_id, "points": 10}).execute()

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
            created_at=thread["created_at"],
            updated_at=thread["updated_at"],
            last_reply_at=thread["last_reply_at"],
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

        thread = result.data[0]
        author = get_user_info(thread["author_id"])

        # Increment view count
        db_client.client.table("threads").update({
            "views_count": thread["views_count"] + 1
        }).eq("id", thread_id).execute()

        # Get likes count
        likes_result = db_client.client.table("likes").select("id", count="exact").eq("thread_id", thread_id).execute()
        likes_count = len(likes_result.data) if likes_result.data else 0

        return ThreadDetailResponse(
            id=thread["id"],
            title=thread["title"],
            content=thread["content"],
            slug=thread["slug"],
            author=author,
            category_id=thread["category_id"],
            is_pinned=thread["is_pinned"],
            is_locked=thread["is_locked"],
            views_count=thread["views_count"] + 1,
            replies_count=thread["replies_count"],
            likes_count=likes_count,
            created_at=thread["created_at"],
            updated_at=thread["updated_at"],
            last_reply_at=thread["last_reply_at"],
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
            .eq("parent_comment_id", None)  # Only top level comments
            .range(skip, skip + limit - 1)
            .order("likes_count", desc=True)
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
                    likes_count=comment["likes_count"],
                    is_edited=comment["is_edited"],
                    created_at=comment["created_at"],
                    updated_at=comment["updated_at"],
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
            "replies_count": thread["replies_count"] + 1,
            "last_reply_at": datetime.utcnow().isoformat(),
        }).eq("id", thread_id).execute()

        # Add points for comment
        points_data = {
            "id": str(uuid.uuid4()),
            "user_id": current_user_id,
            "action_type": "comment_added",
            "points_earned": 5,
            "reference_id": comment["id"],
        }
        db_client.client.table("points_log").insert(points_data).execute()
        db_client.client.rpc("add_user_points", {"user_id": current_user_id, "points": 5}).execute()

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
        existing = db_client.client.table("likes").select("id").eq("thread_id", thread_id).eq(
            "user_id", current_user_id
        ).execute()

        if existing.data:
            raise HTTPException(status_code=400, detail="Already liked this thread")

        like_data = {
            "id": str(uuid.uuid4()),
            "user_id": current_user_id,
            "thread_id": thread_id,
        }

        db_client.client.table("likes").insert(like_data).execute()

        # Get thread author and add points
        thread_result = db_client.client.table("threads").select("author_id").eq("id", thread_id).execute()
        if thread_result.data:
            author_id = thread_result.data[0]["author_id"]
            points_data = {
                "id": str(uuid.uuid4()),
                "user_id": author_id,
                "action_type": "like_received",
                "points_earned": 2,
                "reference_id": thread_id,
            }
            db_client.client.table("points_log").insert(points_data).execute()
            db_client.client.rpc("add_user_points", {"user_id": author_id, "points": 2}).execute()

        return {"message": "Thread liked successfully"}

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
        existing = db_client.client.table("likes").select("id").eq("comment_id", comment_id).eq(
            "user_id", current_user_id
        ).execute()

        if existing.data:
            raise HTTPException(status_code=400, detail="Already liked this comment")

        like_data = {
            "id": str(uuid.uuid4()),
            "user_id": current_user_id,
            "comment_id": comment_id,
        }

        db_client.client.table("likes").insert(like_data).execute()

        # Update comment likes count
        comment_result = db_client.client.table("comments").select("likes_count, author_id").eq(
            "id", comment_id
        ).execute()

        if comment_result.data:
            comment = comment_result.data[0]
            db_client.client.table("comments").update({
                "likes_count": comment["likes_count"] + 1
            }).eq("id", comment_id).execute()

            # Add points to author
            points_data = {
                "id": str(uuid.uuid4()),
                "user_id": comment["author_id"],
                "action_type": "like_received",
                "points_earned": 1,
                "reference_id": comment_id,
            }
            db_client.client.table("points_log").insert(points_data).execute()
            db_client.client.rpc("add_user_points", {"user_id": comment["author_id"], "points": 1}).execute()

        return {"message": "Comment liked successfully"}

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
            is_pinned=updated_thread["is_pinned"],
            is_locked=updated_thread["is_locked"],
            views_count=updated_thread["views_count"],
            replies_count=updated_thread["replies_count"],
            likes_count=0,
            created_at=updated_thread["created_at"],
            updated_at=updated_thread["updated_at"],
            last_reply_at=updated_thread["last_reply_at"],
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
