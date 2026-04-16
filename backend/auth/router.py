"""
Authentication API Routes
Handles user registration, login, and token refresh
"""

import uuid
import sys
from passlib.context import CryptContext
from fastapi import APIRouter, HTTPException, status, Body
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

from .utils import JWTHandler, PasswordValidator
from blog.database import BlogDatabaseService

router = APIRouter(prefix="/api/auth", tags=["auth"])
db_client = BlogDatabaseService()

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# Request Models
class RegisterRequest(BaseModel):
    """User registration request"""
    username: str = Field(..., min_length=3, max_length=50)
    email: str = Field(..., pattern=r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")
    password: str = Field(..., min_length=8, max_length=128)
    full_name: Optional[str] = Field(None, max_length=100)


class LoginRequest(BaseModel):
    """User login request"""
    email_or_username: str = Field(..., min_length=3, max_length=100)
    password: str = Field(..., min_length=1)


class RefreshTokenRequest(BaseModel):
    """Refresh token request"""
    refresh_token: str


# Response Models
class AuthResponse(BaseModel):
    """Authentication response"""
    access_token: str
    refresh_token: str
    user: dict


def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    return pwd_context.verify(plain_password, hashed_password)


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(request: RegisterRequest = Body(...)):
    """
    Register a new user
    """
    try:
        # Validate password strength
        is_valid, message = PasswordValidator.validate(request.password)
        if not is_valid:
            raise HTTPException(status_code=400, detail=message)

        # Check if username exists
        username_check = db_client.client.table("users").select("id").eq("username", request.username).execute()
        if username_check.data:
            raise HTTPException(status_code=400, detail="Username already taken")

        # Check if email exists
        email_check = db_client.client.table("users").select("id").eq("email", request.email).execute()
        if email_check.data:
            raise HTTPException(status_code=400, detail="Email already registered")

        # Create user
        user_id = str(uuid.uuid4())
        user_data = {
            "id": user_id,
            "username": request.username,
            "email": request.email,
            "full_name": request.full_name or request.username,
            "password_hash": hash_password(request.password),
            "avatar_url": None,
            "bio": None,
            "is_email_verified": False,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }

        result = db_client.client.table("users").insert(user_data).execute()

        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to create user")

        user = result.data[0]

        # Generate tokens
        access_token = JWTHandler.create_access_token(user["id"], user["username"])
        refresh_token = JWTHandler.create_refresh_token(user["id"], user["username"])

        return AuthResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user={
                "id": user["id"],
                "username": user["username"],
                "email": user["email"],
                "full_name": user["full_name"],
                "avatar_url": user.get("avatar_url"),
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"REGISTRATION ERROR: {type(e).__name__}: {str(e)}", file=sys.stderr, flush=True)
        raise HTTPException(status_code=500, detail="Registration failed")


@router.post("/login", response_model=AuthResponse)
async def login(request: LoginRequest = Body(...)):
    """
    Login user and return tokens
    """
    try:
        # Find user by email or username
        user_result = db_client.client.table("users").select("*").eq("email", request.email_or_username).execute()

        if not user_result.data:
            user_result = db_client.client.table("users").select("*").eq("username", request.email_or_username).execute()

        if not user_result.data:
            raise HTTPException(status_code=401, detail="Invalid email/username or password")

        user = user_result.data[0]

        # Verify password
        if not verify_password(request.password, user.get("password_hash", "")):
            raise HTTPException(status_code=401, detail="Invalid email/username or password")

        # Generate tokens
        access_token = JWTHandler.create_access_token(user["id"], user["username"])
        refresh_token = JWTHandler.create_refresh_token(user["id"], user["username"])

        return AuthResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user={
                "id": user["id"],
                "username": user["username"],
                "email": user["email"],
                "full_name": user["full_name"],
                "avatar_url": user.get("avatar_url"),
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Login error: {e}")
        raise HTTPException(status_code=500, detail="Login failed")


@router.post("/refresh")
async def refresh_tokens(request: RefreshTokenRequest = Body(...)):
    """
    Refresh access token using refresh token
    """
    try:
        payload = JWTHandler.verify_token(request.refresh_token, token_type="refresh")

        if not payload:
            raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

        # Get user info
        user_result = db_client.client.table("users").select("*").eq("id", payload["sub"]).execute()

        if not user_result.data:
            raise HTTPException(status_code=404, detail="User not found")

        user = user_result.data[0]

        # Generate new access token
        access_token = JWTHandler.create_access_token(user["id"], user["username"])

        return {
            "access_token": access_token,
            "token_type": "bearer"
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Refresh token error: {e}")
        raise HTTPException(status_code=500, detail="Token refresh failed")
