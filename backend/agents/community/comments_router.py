"""
Comment Management API Routes (Detailed)
"""
from fastapi import APIRouter, HTTPException, status, Header, Depends, Query
from pydantic import BaseModel, validator, Field
from typing import Optional, List
from datetime import datetime
import uuid

from auth.utils import JWTHandler
from blog.database import SupabaseClient

router = APIRouter(prefix="/api/comments", tags=["comments"])
db_client = SupabaseClient()


# Pydantic Models
class CommentResponse(BaseModel):
    """Comment response model"""
    id: str
    content: str
    author: dict
    thread_id: str
    parent_comment_id: Optional[str]
    replies: List["CommentResponse"] = []
    likes_count: int
    is_edited: bool
    created_at: str
    updated_at: str


CommentResponse.update_forward_refs()


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


def build_comment_tree(comments_flat: List, parent_id: Optional[str] = None) -> List[CommentResponse]:
    """Build nested comment tree from flat list"""
    result = []
    
    for comment in comments_flat:
        if comment["parent_comment_id"] == parent_id:
            author = get_user_info(comment["author_id"])
            replies = build_comment_tree(comments_flat, comment["id"])
            
            result.append(CommentResponse(
                id=comment["id"],
                content=comment["content"],
                author=author,
                thread_id=comment["thread_id"],
                parent_comment_id=comment["parent_comment_id"],
                replies=replies,
                likes_count=comment["likes_count"],
                is_edited=comment["is_edited"],
                created_at=comment["created_at"],
                updated_at=comment["updated_at"],
            ))
    
    return result


# Comment Routes

@router.put("/{comment_id}", response_model=CommentResponse)
async def update_comment(
    comment_id: str,
    request: CommentUpdate,
    current_user_id: str = Depends(get_current_user_id),
):
    """
    Update a comment (author only)
    """
    try:
        # Get comment
        comment_result = db_client.client.table("comments").select("*").eq("id", comment_id).execute()

        if not comment_result.data:
            raise HTTPException(status_code=404, detail="Comment not found")

        comment = comment_result.data[0]

        # Check permissions - only author can edit
        if comment["author_id"] != current_user_id:
            raise HTTPException(status_code=403, detail="Not authorized to edit this comment")

        # Update comment
        update_data = {
            "content": request.content,
            "is_edited": True,
            "updated_at": datetime.utcnow().isoformat(),
        }

        result = db_client.client.table("comments").update(update_data).eq("id", comment_id).execute()

        updated_comment = result.data[0]
        author = get_user_info(updated_comment["author_id"])

        return CommentResponse(
            id=updated_comment["id"],
            content=updated_comment["content"],
            author=author,
            thread_id=updated_comment["thread_id"],
            parent_comment_id=updated_comment["parent_comment_id"],
            likes_count=updated_comment["likes_count"],
            is_edited=updated_comment["is_edited"],
            created_at=updated_comment["created_at"],
            updated_at=updated_comment["updated_at"],
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Update comment error: {e}")
        raise HTTPException(status_code=500, detail="Failed to update comment")


@router.delete("/{comment_id}")
async def delete_comment(
    comment_id: str,
    current_user_id: str = Depends(get_current_user_id),
):
    """
    Delete a comment (author or moderator)
    """
    try:
        # Get comment
        comment_result = db_client.client.table("comments").select("*").eq("id", comment_id).execute()

        if not comment_result.data:
            raise HTTPException(status_code=404, detail="Comment not found")

        comment = comment_result.data[0]

        # Check permissions
        if comment["author_id"] != current_user_id:
            user_result = db_client.client.table("users").select("role_id").eq("id", current_user_id).execute()
            mod_roles = db_client.client.table("roles").select("id").in_("name", ["admin", "moderator"]).execute()
            mod_role_ids = [r["id"] for r in mod_roles.data]

            if not user_result.data or user_result.data[0]["role_id"] not in mod_role_ids:
                raise HTTPException(status_code=403, detail="Not authorized to delete this comment")

        # Delete comment replies and likes
        db_client.client.table("comments").delete().eq("parent_comment_id", comment_id).execute()
        db_client.client.table("likes").delete().eq("comment_id", comment_id).execute()

        # Delete comment
        db_client.client.table("comments").delete().eq("id", comment_id).execute()

        return {"message": "Comment deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Delete comment error: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete comment")


@router.get("/{comment_id}/replies", response_model=List[CommentResponse])
async def get_comment_replies(
    comment_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
):
    """
    Get replies to a comment
    """
    try:
        # Get direct replies
        result = (
            db_client.client.table("comments")
            .select("*")
            .eq("parent_comment_id", comment_id)
            .range(skip, skip + limit - 1)
            .order("likes_count", desc=True)
            .execute()
        )

        replies = []
        for reply in result.data:
            author = get_user_info(reply["author_id"])
            replies.append(CommentResponse(
                id=reply["id"],
                content=reply["content"],
                author=author,
                thread_id=reply["thread_id"],
                parent_comment_id=reply["parent_comment_id"],
                likes_count=reply["likes_count"],
                is_edited=reply["is_edited"],
                created_at=reply["created_at"],
                updated_at=reply["updated_at"],
            ))

        return replies

    except Exception as e:
        print(f"Get replies error: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve replies")


@router.post("/{comment_id}/replies")
async def reply_to_comment(
    comment_id: str,
    content: str = Field(..., min_length=1, max_length=5000),
    current_user_id: str = Depends(get_current_user_id),
):
    """
    Reply to a comment
    """
    try:
        # Check if parent comment exists
        parent_result = db_client.client.table("comments").select("id, thread_id").eq("id", comment_id).execute()

        if not parent_result.data:
            raise HTTPException(status_code=404, detail="Parent comment not found")

        parent_comment = parent_result.data[0]

        # Check if thread is locked
        thread_result = db_client.client.table("threads").select("is_locked").eq(
            "id", parent_comment["thread_id"]
        ).execute()

        if thread_result.data and thread_result.data[0]["is_locked"]:
            raise HTTPException(status_code=403, detail="Thread is locked")

        reply_data = {
            "id": str(uuid.uuid4()),
            "thread_id": parent_comment["thread_id"],
            "parent_comment_id": comment_id,
            "author_id": current_user_id,
            "content": content.strip(),
            "likes_count": 0,
            "is_edited": False,
        }

        result = db_client.client.table("comments").insert(reply_data).execute()

        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to create reply")

        reply = result.data[0]
        author = get_user_info(current_user_id)

        # Add points for reply
        points_data = {
            "id": str(uuid.uuid4()),
            "user_id": current_user_id,
            "action_type": "comment_added",
            "points_earned": 5,
            "reference_id": reply["id"],
        }
        db_client.client.table("points_log").insert(points_data).execute()
        db_client.client.rpc("add_user_points", {"user_id": current_user_id, "points": 5}).execute()

        return CommentResponse(
            id=reply["id"],
            content=reply["content"],
            author=author,
            thread_id=reply["thread_id"],
            parent_comment_id=reply["parent_comment_id"],
            likes_count=reply["likes_count"],
            is_edited=reply["is_edited"],
            created_at=reply["created_at"],
            updated_at=reply["updated_at"],
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Reply to comment error: {e}")
        raise HTTPException(status_code=500, detail="Failed to create reply")


@router.post("/{comment_id}/unlike")
async def unlike_comment(
    comment_id: str,
    current_user_id: str = Depends(get_current_user_id),
):
    """
    Unlike a comment
    """
    try:
        # Check if like exists
        like_result = db_client.client.table("likes").select("id").eq("comment_id", comment_id).eq(
            "user_id", current_user_id
        ).execute()

        if not like_result.data:
            raise HTTPException(status_code=400, detail="You haven't liked this comment")

        # Delete like
        db_client.client.table("likes").delete().eq("comment_id", comment_id).eq(
            "user_id", current_user_id
        ).execute()

        # Update comment likes count
        comment_result = db_client.client.table("comments").select("likes_count").eq(
            "id", comment_id
        ).execute()

        if comment_result.data and comment_result.data[0]["likes_count"] > 0:
            new_likes = comment_result.data[0]["likes_count"] - 1
            db_client.client.table("comments").update({
                "likes_count": new_likes
            }).eq("id", comment_id).execute()

        return {"message": "Comment unliked successfully"}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Unlike comment error: {e}")
        raise HTTPException(status_code=500, detail="Failed to unlike comment")


@router.get("/{comment_id}/user-reactions")
async def get_user_comment_reactions(
    comment_id: str,
    current_user_id: str = Depends(get_current_user_id),
):
    """
    Get user's reactions to comments
    """
    try:
        # Check if user liked this comment
        like_result = db_client.client.table("likes").select("id").eq("comment_id", comment_id).eq(
            "user_id", current_user_id
        ).execute()

        return {
            "liked": bool(like_result.data),
        }

    except Exception as e:
        print(f"Get reactions error: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve reactions")
