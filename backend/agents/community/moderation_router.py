"""
Moderation Tools API Routes
Handle thread/comment moderation, reporting, and community management
"""
from fastapi import APIRouter, HTTPException, status, Header, Depends, Query
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import uuid

from auth.utils import JWTHandler
from blog.database import BlogDatabaseService

router = APIRouter(prefix="/api/moderation", tags=["moderation"])
db_client = BlogDatabaseService()


# Pydantic Models
class ReportCreate(BaseModel):
    """Report creation request"""
    type: str = Field(..., regex="^(thread|comment|user)$")
    target_id: str
    reason: str = Field(..., min_length=10, max_length=500)
    description: Optional[str] = Field(None, max_length=2000)


class ModerationAction(BaseModel):
    """Moderation action request"""
    action: str = Field(..., regex="^(pin|unpin|lock|unlock|hide|unhide|warn|suspend)$")
    reason: Optional[str] = Field(None, max_length=500)


class WarningCreate(BaseModel):
    """Create user warning"""
    user_id: str
    reason: str = Field(..., max_length=500)
    severity: str = Field(..., regex="^(low|medium|high)$")


# Response Models
class ReportResponse(BaseModel):
    """Report response"""
    id: str
    type: str
    target_id: str
    reporter_id: str
    reason: str
    status: str
    created_at: str
    updated_at: str


class WarningResponse(BaseModel):
    """Warning response"""
    id: str
    user_id: str
    issued_by: str
    reason: str
    severity: str
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


def check_moderator_role(user_id: str) -> bool:
    """Check if user is moderator or admin"""
    try:
        user_result = db_client.client.table("users").select("role_id").eq("id", user_id).execute()
        
        if not user_result.data:
            return False

        role_id = user_result.data[0]["role_id"]
        mod_roles = db_client.client.table("roles").select("id").in_("name", ["admin", "moderator"]).execute()
        mod_role_ids = [r["id"] for r in mod_roles.data]

        return role_id in mod_role_ids
    except:
        return False


# Reporting Endpoints

@router.post("/reports", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
async def create_report(
    request: ReportCreate,
    current_user_id: str = Depends(get_current_user_id),
):
    """
    Create a report for a thread, comment, or user
    """
    try:
        # Verify report target exists
        if request.type == "thread":
            target_result = db_client.client.table("threads").select("id").eq("id", request.target_id).execute()
        elif request.type == "comment":
            target_result = db_client.client.table("comments").select("id").eq("id", request.target_id).execute()
        elif request.type == "user":
            target_result = db_client.client.table("users").select("id").eq("id", request.target_id).execute()
        else:
            raise ValueError("Invalid report type")

        if not target_result.data:
            raise HTTPException(status_code=404, detail=f"{request.type.capitalize()} not found")

        # Check if user already reported this
        existing = db_client.client.table("reports").select("id").eq(
            "type", request.type
        ).eq("target_id", request.target_id).eq("reporter_id", current_user_id).execute()

        if existing.data:
            raise HTTPException(status_code=400, detail="You have already reported this")

        report_data = {
            "id": str(uuid.uuid4()),
            "type": request.type,
            "target_id": request.target_id,
            "reporter_id": current_user_id,
            "reason": request.reason,
            "description": request.description,
            "status": "open",
        }

        result = db_client.client.table("reports").insert(report_data).execute()

        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to create report")

        report = result.data[0]

        return ReportResponse(
            id=report["id"],
            type=report["type"],
            target_id=report["target_id"],
            reporter_id=report["reporter_id"],
            reason=report["reason"],
            status=report["status"],
            created_at=report["created_at"],
            updated_at=report["updated_at"],
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Create report error: {e}")
        raise HTTPException(status_code=500, detail="Failed to create report")


@router.get("/reports", response_model=List[ReportResponse])
async def list_reports(
    status_filter: Optional[str] = Query(None, regex="^(open|reviewing|resolved|dismissed)$"),
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=50),
    current_user_id: str = Depends(get_current_user_id),
):
    """
    List reports (moderator+ only)
    """
    if not check_moderator_role(current_user_id):
        raise HTTPException(status_code=403, detail="Only moderators can view reports")

    try:
        query = db_client.client.table("reports").select("*")

        if status_filter:
            query = query.eq("status", status_filter)

        result = (
            query.range(skip, skip + limit - 1)
            .order("created_at", desc=True)
            .execute()
        )

        return [
            ReportResponse(
                id=r["id"],
                type=r["type"],
                target_id=r["target_id"],
                reporter_id=r["reporter_id"],
                reason=r["reason"],
                status=r["status"],
                created_at=r["created_at"],
                updated_at=r["updated_at"],
            )
            for r in result.data
        ]

    except Exception as e:
        print(f"List reports error: {e}")
        raise HTTPException(status_code=500, detail="Failed to list reports")


@router.put("/reports/{report_id}")
async def update_report_status(
    report_id: str,
    new_status: str = Query(..., regex="^(reviewing|resolved|dismissed)$"),
    current_user_id: str = Depends(get_current_user_id),
):
    """
    Update report status (moderator+ only)
    """
    if not check_moderator_role(current_user_id):
        raise HTTPException(status_code=403, detail="Only moderators can update reports")

    try:
        result = db_client.client.table("reports").update({
            "status": new_status,
            "updated_at": datetime.utcnow().isoformat(),
        }).eq("id", report_id).execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="Report not found")

        report = result.data[0]

        return {
            "message": "Report status updated",
            "status": report["status"],
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Update report error: {e}")
        raise HTTPException(status_code=500, detail="Failed to update report")


# Thread Moderation Endpoints

@router.post("/threads/{thread_id}/pin")
async def pin_thread(
    thread_id: str,
    reason: Optional[str] = None,
    current_user_id: str = Depends(get_current_user_id),
):
    """
    Pin a thread (moderator+ only)
    """
    if not check_moderator_role(current_user_id):
        raise HTTPException(status_code=403, detail="Only moderators can pin threads")

    try:
        result = db_client.client.table("threads").update({
            "is_pinned": True,
            "updated_at": datetime.utcnow().isoformat(),
        }).eq("id", thread_id).execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="Thread not found")

        # Log action
        log_moderation_action(current_user_id, thread_id, "thread_pinned", reason)

        return {"message": "Thread pinned successfully"}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Pin thread error: {e}")
        raise HTTPException(status_code=500, detail="Failed to pin thread")


@router.post("/threads/{thread_id}/unpin")
async def unpin_thread(
    thread_id: str,
    current_user_id: str = Depends(get_current_user_id),
):
    """
    Unpin a thread (moderator+ only)
    """
    if not check_moderator_role(current_user_id):
        raise HTTPException(status_code=403, detail="Only moderators can unpin threads")

    try:
        result = db_client.client.table("threads").update({
            "is_pinned": False,
            "updated_at": datetime.utcnow().isoformat(),
        }).eq("id", thread_id).execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="Thread not found")

        log_moderation_action(current_user_id, thread_id, "thread_unpinned")

        return {"message": "Thread unpinned successfully"}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Unpin thread error: {e}")
        raise HTTPException(status_code=500, detail="Failed to unpin thread")


@router.post("/threads/{thread_id}/lock")
async def lock_thread(
    thread_id: str,
    reason: Optional[str] = None,
    current_user_id: str = Depends(get_current_user_id),
):
    """
    Lock a thread (prevent new comments) - moderator+ only
    """
    if not check_moderator_role(current_user_id):
        raise HTTPException(status_code=403, detail="Only moderators can lock threads")

    try:
        result = db_client.client.table("threads").update({
            "is_locked": True,
            "updated_at": datetime.utcnow().isoformat(),
        }).eq("id", thread_id).execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="Thread not found")

        log_moderation_action(current_user_id, thread_id, "thread_locked", reason)

        return {"message": "Thread locked successfully"}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Lock thread error: {e}")
        raise HTTPException(status_code=500, detail="Failed to lock thread")


@router.post("/threads/{thread_id}/unlock")
async def unlock_thread(
    thread_id: str,
    current_user_id: str = Depends(get_current_user_id),
):
    """
    Unlock a thread - moderator+ only
    """
    if not check_moderator_role(current_user_id):
        raise HTTPException(status_code=403, detail="Only moderators can unlock threads")

    try:
        result = db_client.client.table("threads").update({
            "is_locked": False,
            "updated_at": datetime.utcnow().isoformat(),
        }).eq("id", thread_id).execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="Thread not found")

        log_moderation_action(current_user_id, thread_id, "thread_unlocked")

        return {"message": "Thread unlocked successfully"}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Unlock thread error: {e}")
        raise HTTPException(status_code=500, detail="Failed to unlock thread")


@router.delete("/threads/{thread_id}")
async def delete_thread_moderation(
    thread_id: str,
    reason: Optional[str] = None,
    current_user_id: str = Depends(get_current_user_id),
):
    """
    Delete a thread (moderator+ only)
    """
    if not check_moderator_role(current_user_id):
        raise HTTPException(status_code=403, detail="Only moderators can delete threads")

    try:
        # Get thread author
        thread_result = db_client.client.table("threads").select("author_id").eq("id", thread_id).execute()
        
        if not thread_result.data:
            raise HTTPException(status_code=404, detail="Thread not found")

        author_id = thread_result.data[0]["author_id"]

        # Delete related comments and likes
        db_client.client.table("comments").delete().eq("thread_id", thread_id).execute()
        db_client.client.table("likes").delete().eq("thread_id", thread_id).execute()

        # Delete thread
        db_client.client.table("threads").delete().eq("id", thread_id).execute()

        # Log action
        log_moderation_action(current_user_id, thread_id, "thread_deleted", reason)

        # Issue warning to author
        if reason:
            issue_warning(author_id, current_user_id, f"Thread deleted: {reason}", "low")

        return {"message": "Thread deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Delete thread error: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete thread")


# Comment Moderation Endpoints

@router.delete("/comments/{comment_id}")
async def delete_comment_moderation(
    comment_id: str,
    reason: Optional[str] = None,
    current_user_id: str = Depends(get_current_user_id),
):
    """
    Delete a comment (moderator+ only)
    """
    if not check_moderator_role(current_user_id):
        raise HTTPException(status_code=403, detail="Only moderators can delete comments")

    try:
        # Get comment
        comment_result = db_client.client.table("comments").select("author_id, thread_id").eq("id", comment_id).execute()
        
        if not comment_result.data:
            raise HTTPException(status_code=404, detail="Comment not found")

        comment = comment_result.data[0]

        # Delete related likes and replies
        db_client.client.table("likes").delete().eq("comment_id", comment_id).execute()
        db_client.client.table("comments").delete().eq("parent_comment_id", comment_id).execute()

        # Delete comment
        db_client.client.table("comments").delete().eq("id", comment_id).execute()

        # Update thread replies count
        thread_result = db_client.client.table("threads").select("replies_count").eq(
            "id", comment["thread_id"]
        ).execute()

        if thread_result.data:
            thread = thread_result.data[0]
            db_client.client.table("threads").update({
                "replies_count": max(0, thread.get("replies_count", 0) - 1)
            }).eq("id", comment["thread_id"]).execute()

        # Log action
        log_moderation_action(current_user_id, comment_id, "comment_deleted", reason)

        return {"message": "Comment deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Delete comment error: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete comment")


# User Warning Endpoints

@router.post("/users/{user_id}/warn", response_model=WarningResponse, status_code=status.HTTP_201_CREATED)
async def warn_user(
    user_id: str,
    reason: str = Query(..., min_length=10, max_length=500),
    severity: str = Query(..., regex="^(low|medium|high)$"),
    current_user_id: str = Depends(get_current_user_id),
):
    """
    Issue a warning to a user (moderator+ only)
    """
    if not check_moderator_role(current_user_id):
        raise HTTPException(status_code=403, detail="Only moderators can issue warnings")

    try:
        warning_data = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "issued_by": current_user_id,
            "reason": reason,
            "severity": severity,
        }

        result = db_client.client.table("user_warnings").insert(warning_data).execute()

        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to issue warning")

        warning = result.data[0]

        # If high severity, suspend user
        if severity == "high":
            db_client.client.table("users").update({
                "is_suspended": True,
                "suspension_reason": reason,
            }).eq("id", user_id).execute()

        return WarningResponse(
            id=warning["id"],
            user_id=warning["user_id"],
            issued_by=warning["issued_by"],
            reason=warning["reason"],
            severity=warning["severity"],
            created_at=warning["created_at"],
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Warn user error: {e}")
        raise HTTPException(status_code=500, detail="Failed to issue warning")


@router.get("/users/{user_id}/warnings", response_model=List[WarningResponse])
async def get_user_warnings(
    user_id: str,
    current_user_id: str = Depends(get_current_user_id),
):
    """
    Get warnings for a user (self or moderator+ only)
    """
    if current_user_id != user_id and not check_moderator_role(current_user_id):
        raise HTTPException(status_code=403, detail="Not authorized to view these warnings")

    try:
        result = db_client.client.table("user_warnings").select("*").eq(
            "user_id", user_id
        ).order("created_at", desc=True).execute()

        return [
            WarningResponse(
                id=w["id"],
                user_id=w["user_id"],
                issued_by=w["issued_by"],
                reason=w["reason"],
                severity=w["severity"],
                created_at=w["created_at"],
            )
            for w in result.data
        ]

    except Exception as e:
        print(f"Get user warnings error: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve warnings")


# Helper Functions

def log_moderation_action(moderator_id: str, target_id: str, action: str, reason: Optional[str] = None):
    """Log a moderation action"""
    try:
        log_data = {
            "id": str(uuid.uuid4()),
            "moderator_id": moderator_id,
            "target_id": target_id,
            "action": action,
            "reason": reason,
        }
        db_client.client.table("moderation_logs").insert(log_data).execute()
    except Exception as e:
        print(f"Failed to log moderation action: {e}")


def issue_warning(user_id: str, issued_by: str, reason: str, severity: str):
    """Issue a warning to a user"""
    try:
        warning_data = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "issued_by": issued_by,
            "reason": reason,
            "severity": severity,
        }
        db_client.client.table("user_warnings").insert(warning_data).execute()
    except Exception as e:
        print(f"Failed to issue warning: {e}")
