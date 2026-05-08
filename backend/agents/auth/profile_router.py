"""
User Profile API Routes
"""
from fastapi import APIRouter, HTTPException, status, Header, Depends
from pydantic import BaseModel, validator, EmailStr
from typing import Optional, List
from sqlalchemy.orm import Session
from datetime import datetime
import uuid

from backend.engine.community_models import User, UserProfile, UserBadge, Badge
from backend.auth.utils import JWTHandler
from backend.blog.database import SupabaseClient

router = APIRouter(prefix="/api/users", tags=["users"])
db_client = SupabaseClient()
LEVEL_STEP_POINTS = 100


# Pydantic Models
class UserProfileUpdate(BaseModel):
    """Update user profile"""
    full_name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None

    @validator("full_name")
    def validate_full_name(cls, v):
        if v and len(v) > 100:
            raise ValueError("Full name must be less than 100 characters")
        return v

    @validator("bio")
    def validate_bio(cls, v):
        if v and len(v) > 500:
            raise ValueError("Bio must be less than 500 characters")
        return v


class UserProfileResponse(BaseModel):
    """User profile response"""
    id: str
    username: str
    email: str
    full_name: Optional[str]
    avatar_url: Optional[str]
    bio: Optional[str]
    email_verified: bool
    is_active: bool
    created_at: str


class UserStatsResponse(BaseModel):
    """User statistics"""
    user_id: str
    points_total: int
    level: int
    threads_count: int
    comments_count: int
    followers_count: int
    following_count: int
    last_active: Optional[str]


class LevelProgressResponse(BaseModel):
    user_id: str
    points_total: int
    level: int
    points_in_level: int
    points_to_next_level: int


class LeaderboardItemResponse(BaseModel):
    rank: int
    user_id: str
    username: str
    full_name: Optional[str]
    avatar_url: Optional[str]
    points_total: int
    level: int


class BadgeResponse(BaseModel):
    """Badge response"""
    id: str
    name: str
    description: Optional[str]
    icon: Optional[str]
    earned_at: str


class UserPublicProfile(BaseModel):
    """Public user profile"""
    username: str
    full_name: Optional[str]
    avatar_url: Optional[str]
    bio: Optional[str]
    level: int
    points_total: int
    created_at: str


# Helper function to extract token from header
def get_current_user_id(authorization: Optional[str] = Header(None)) -> str:
    """Extract and verify JWT token"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")

    token = authorization[7:]  # Remove "Bearer " prefix
    payload = JWTHandler.verify_token(token, token_type="access")

    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    return payload.get("sub")


def _safe_int(value, default: int = 0) -> int:
    try:
        return int(value)
    except Exception:
        return default


def _get_level_progress(points_total: int) -> tuple[int, int, int]:
    points = max(0, _safe_int(points_total, 0))
    level = (points // LEVEL_STEP_POINTS) + 1
    points_in_level = points % LEVEL_STEP_POINTS
    points_to_next_level = LEVEL_STEP_POINTS - points_in_level
    return level, points_in_level, points_to_next_level


# Routes

@router.get("/profile", response_model=UserProfileResponse)
async def get_user_profile(current_user_id: str = Depends(get_current_user_id)):
    """
    Get current user profile
    """
    try:
        # Get user from database
        user_result = db_client.client.table("users").select("*").eq("id", current_user_id).execute()

        if not user_result.data:
            raise HTTPException(status_code=404, detail="User not found")

        user = user_result.data[0]

        return UserProfileResponse(
            id=user["id"],
            username=user["username"],
            email=user["email"],
            full_name=user["full_name"],
            avatar_url=user["avatar_url"],
            bio=user["bio"],
            email_verified=user["email_verified"],
            is_active=user["is_active"],
            created_at=user["created_at"],
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Get profile error: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve profile")


@router.put("/profile", response_model=UserProfileResponse)
async def update_user_profile(
    request: UserProfileUpdate,
    current_user_id: str = Depends(get_current_user_id),
):
    """
    Update current user profile
    """
    try:
        update_data = {}

        if request.full_name is not None:
            update_data["full_name"] = request.full_name

        if request.bio is not None:
            update_data["bio"] = request.bio

        if request.avatar_url is not None:
            update_data["avatar_url"] = request.avatar_url

        update_data["updated_at"] = datetime.utcnow().isoformat()

        # Update user
        result = db_client.client.table("users").update(update_data).eq("id", current_user_id).execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="User not found")

        user = result.data[0]

        return UserProfileResponse(
            id=user["id"],
            username=user["username"],
            email=user["email"],
            full_name=user["full_name"],
            avatar_url=user["avatar_url"],
            bio=user["bio"],
            email_verified=user["email_verified"],
            is_active=user["is_active"],
            created_at=user["created_at"],
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Update profile error: {e}")
        raise HTTPException(status_code=500, detail="Failed to update profile")


@router.get("/stats", response_model=UserStatsResponse)
async def get_user_stats(current_user_id: str = Depends(get_current_user_id)):
    """
    Get user statistics and gamification stats
    """
    try:
        # Get user profile
        profile_result = (
            db_client.client.table("user_profiles").select("*").eq("user_id", current_user_id).execute()
        )

        if not profile_result.data:
            raise HTTPException(status_code=404, detail="User profile not found")

        profile = profile_result.data[0]

        return UserStatsResponse(
            user_id=current_user_id,
            points_total=profile["points_total"],
            level=profile["level"],
            threads_count=profile["threads_count"],
            comments_count=profile["comments_count"],
            followers_count=profile["followers_count"],
            following_count=profile["following_count"],
            last_active=profile["last_active"],
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Get stats error: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve stats")


@router.get("/stats/progress", response_model=LevelProgressResponse)
async def get_user_level_progress(current_user_id: str = Depends(get_current_user_id)):
    """Return XP and level progress for current user."""
    try:
        profile_result = (
            db_client.client.table("user_profiles")
            .select("points_total, level")
            .eq("user_id", current_user_id)
            .limit(1)
            .execute()
        )

        if not profile_result.data:
            level, points_in_level, points_to_next_level = _get_level_progress(0)
            return LevelProgressResponse(
                user_id=current_user_id,
                points_total=0,
                level=level,
                points_in_level=points_in_level,
                points_to_next_level=points_to_next_level,
            )

        profile = profile_result.data[0]
        points_total = _safe_int(profile.get("points_total"), 0)
        level, points_in_level, points_to_next_level = _get_level_progress(points_total)

        return LevelProgressResponse(
            user_id=current_user_id,
            points_total=points_total,
            level=_safe_int(profile.get("level"), level),
            points_in_level=points_in_level,
            points_to_next_level=points_to_next_level,
        )
    except Exception as e:
        print(f"Get level progress error: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve level progress")


@router.get("/leaderboard", response_model=List[LeaderboardItemResponse])
async def get_users_leaderboard(limit: int = 20):
    """Return top users by points/level for community leaderboard."""
    try:
        safe_limit = max(1, min(limit, 100))

        profile_result = (
            db_client.client.table("user_profiles")
            .select("user_id, points_total, level")
            .order("points_total", desc=True)
            .range(0, safe_limit - 1)
            .execute()
        )

        if not profile_result.data:
            return []

        user_ids = [row["user_id"] for row in profile_result.data]
        users_result = (
            db_client.client.table("users")
            .select("id, username, full_name, avatar_url")
            .in_("id", user_ids)
            .execute()
        )
        user_map = {u["id"]: u for u in (users_result.data or [])}

        leaderboard = []
        for index, row in enumerate(profile_result.data):
            user = user_map.get(row["user_id"], {})
            points_total = _safe_int(row.get("points_total"), 0)
            fallback_level, _, _ = _get_level_progress(points_total)
            leaderboard.append(
                LeaderboardItemResponse(
                    rank=index + 1,
                    user_id=row["user_id"],
                    username=user.get("username") or "unknown",
                    full_name=user.get("full_name"),
                    avatar_url=user.get("avatar_url"),
                    points_total=points_total,
                    level=_safe_int(row.get("level"), fallback_level),
                )
            )

        return leaderboard
    except Exception as e:
        print(f"Get leaderboard error: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve leaderboard")


@router.get("/badges", response_model=list[BadgeResponse])
async def get_user_badges(current_user_id: str = Depends(get_current_user_id)):
    """
    Get user's earned badges
    """
    try:
        # Get user badges
        badges_result = (
            db_client.client.table("user_badges")
            .select("id, badges(id, name, description, icon), earned_at")
            .eq("user_id", current_user_id)
            .execute()
        )

        if not badges_result.data:
            return []

        return [
            BadgeResponse(
                id=badge_item["badges"]["id"],
                name=badge_item["badges"]["name"],
                description=badge_item["badges"]["description"],
                icon=badge_item["badges"]["icon"],
                earned_at=badge_item["earned_at"],
            )
            for badge_item in badges_result.data
        ]

    except Exception as e:
        print(f"Get badges error: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve badges")


@router.get("/public/{username}", response_model=UserPublicProfile)
async def get_public_profile(username: str):
    """
    Get public user profile
    """
    try:
        # Get user
        user_result = db_client.client.table("users").select("*").eq("username", username).execute()

        if not user_result.data:
            raise HTTPException(status_code=404, detail="User not found")

        user = user_result.data[0]

        # Get user profile
        profile_result = (
            db_client.client.table("user_profiles").select("*").eq("user_id", user["id"]).execute()
        )

        if profile_result.data:
            profile = profile_result.data[0]
        else:
            profile = {"level": 1, "points_total": 0}

        return UserPublicProfile(
            username=user["username"],
            full_name=user["full_name"],
            avatar_url=user["avatar_url"],
            bio=user["bio"],
            level=profile["level"],
            points_total=profile["points_total"],
            created_at=user["created_at"],
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Get public profile error: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve profile")


@router.post("/follow/{user_id}")
async def follow_user(user_id: str, current_user_id: str = Depends(get_current_user_id)):
    """
    Follow a user
    """
    try:
        if user_id == current_user_id:
            raise HTTPException(status_code=400, detail="Cannot follow yourself")

        # Check if already following
        existing = db_client.client.table("user_follows").select("id").eq("follower_id", current_user_id).eq(
            "following_id", user_id
        ).execute()

        if existing.data:
            raise HTTPException(status_code=400, detail="Already following this user")

        # Create follow relationship
        follow_data = {
            "id": str(uuid.uuid4()),
            "follower_id": current_user_id,
            "following_id": user_id,
        }

        db_client.client.table("user_follows").insert(follow_data).execute()

        # Update counts
        db_client.client.table("user_profiles").update({"following_count": "following_count + 1"}).eq(
            "user_id", current_user_id
        ).execute()

        db_client.client.table("user_profiles").update({"followers_count": "followers_count + 1"}).eq(
            "user_id", user_id
        ).execute()

        return {"message": "User followed successfully"}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Follow user error: {e}")
        raise HTTPException(status_code=500, detail="Failed to follow user")


@router.delete("/follow/{user_id}")
async def unfollow_user(user_id: str, current_user_id: str = Depends(get_current_user_id)):
    """
    Unfollow a user
    """
    try:
        # Delete follow relationship
        db_client.client.table("user_follows").delete().eq("follower_id", current_user_id).eq(
            "following_id", user_id
        ).execute()

        # Update counts
        db_client.client.table("user_profiles").update({"following_count": "following_count - 1"}).eq(
            "user_id", current_user_id
        ).execute()

        db_client.client.table("user_profiles").update({"followers_count": "followers_count - 1"}).eq(
            "user_id", user_id
        ).execute()

        return {"message": "User unfollowed successfully"}

    except Exception as e:
        print(f"Unfollow user error: {e}")
        raise HTTPException(status_code=500, detail="Failed to unfollow user")
