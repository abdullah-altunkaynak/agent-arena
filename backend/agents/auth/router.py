"""
Authentication API Routes
"""
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, EmailStr, validator
from typing import Optional
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import uuid

from backend.engine.community_models import User, EmailVerificationToken, PasswordResetToken, UserProfile, Role
from backend.engine.auth_utils import (
    JWTHandler,
    PasswordValidator,
    UsernameValidator,
    EmailValidator,
    EmailService,
    TokenHelper,
    EMAIL_VERIFICATION_EXPIRATION_HOURS,
    PASSWORD_RESET_EXPIRATION_HOURS,
)
from backend.blog.database import SupabaseClient

# Initialize router
router = APIRouter(prefix="/api/auth", tags=["authentication"])

# Supabase client
db_client = SupabaseClient()


# Pydantic Models for Request/Response
class RegisterRequest(BaseModel):
    """User registration request"""
    username: str
    email: EmailStr
    password: str
    confirm_password: str
    full_name: Optional[str] = None

    @validator("username")
    def validate_username(cls, v):
        is_valid, message = UsernameValidator.validate(v)
        if not is_valid:
            raise ValueError(message)
        return v

    @validator("password")
    def validate_password(cls, v):
        is_valid, message = PasswordValidator.validate(v)
        if not is_valid:
            raise ValueError(message)
        return v

    @validator("confirm_password")
    def validate_match(cls, v, values):
        if "password" in values and v != values["password"]:
            raise ValueError("Passwords do not match")
        return v


class LoginRequest(BaseModel):
    """User login request"""
    email_or_username: str
    password: str
    remember_me: bool = False


class VerifyEmailRequest(BaseModel):
    """Email verification request"""
    token: str


class ForgotPasswordRequest(BaseModel):
    """Forgot password request"""
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    """Password reset request"""
    token: str
    new_password: str
    confirm_password: str

    @validator("new_password")
    def validate_password(cls, v):
        is_valid, message = PasswordValidator.validate(v)
        if not is_valid:
            raise ValueError(message)
        return v

    @validator("confirm_password")
    def validate_match(cls, v, values):
        if "new_password" in values and v != values["new_password"]:
            raise ValueError("Passwords do not match")
        return v


class RefreshTokenRequest(BaseModel):
    """Refresh token request"""
    refresh_token: str


class AuthResponse(BaseModel):
    """Authentication response"""
    access_token: str
    refresh_token: str
    token_type: str
    user: dict


class UserResponse(BaseModel):
    """User profile response"""
    id: str
    username: str
    email: str
    full_name: Optional[str]
    avatar_url: Optional[str]
    bio: Optional[str]
    email_verified: bool
    created_at: str


# Routes

@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(request: RegisterRequest):
    """
    Register a new user
    """
    try:
        # Validate email format
        is_valid, message = EmailValidator.validate(request.email)
        if not is_valid:
            raise HTTPException(status_code=400, detail=message)

        # Check if user already exists
        existing_user = db_client.client.table("users").select("id").eq("email", request.email).execute()
        if existing_user.data:
            raise HTTPException(status_code=400, detail="Email already registered")

        existing_username = db_client.client.table("users").select("id").eq("username", request.username).execute()
        if existing_username.data:
            raise HTTPException(status_code=400, detail="Username already taken")

        # Get member role
        role_result = db_client.client.table("roles").select("id").eq("name", "member").execute()
        if not role_result.data:
            raise HTTPException(status_code=500, detail="Default role not configured")

        member_role_id = role_result.data[0]["id"]

        # Hash password
        password_hash = User.hash_password(request.password)

        # Create user
        user_id = str(uuid.uuid4())
        user_data = {
            "id": user_id,
            "username": request.username,
            "email": request.email,
            "password_hash": password_hash,
            "full_name": request.full_name or request.username,
            "role_id": member_role_id,
            "email_verified": False,
        }

        user_result = db_client.client.table("users").insert(user_data).execute()
        if not user_result.data:
            raise HTTPException(status_code=500, detail="Failed to create user")

        # Create user profile
        profile_data = {
            "user_id": user_id,
            "points_total": 0,
            "level": 1,
        }
        db_client.client.table("user_profiles").insert(profile_data).execute()

        # Create verification token
        verification_token = JWTHandler.create_email_verification_token()
        expires_at = (datetime.utcnow() + timedelta(hours=EMAIL_VERIFICATION_EXPIRATION_HOURS)).isoformat()

        token_data = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "token": verification_token,
            "expires_at": expires_at,
            "is_used": False,
        }

        db_client.client.table("email_verification_tokens").insert(token_data).execute()

        # Send verification email
        EmailService.send_verification_email(request.email, request.username, verification_token)

        # Create tokens
        tokens = TokenHelper.create_tokens(user_id, request.username)

        user_response = {
            "id": user_id,
            "username": request.username,
            "email": request.email,
            "full_name": request.full_name or request.username,
            "avatar_url": None,
            "bio": None,
            "email_verified": False,
            "created_at": datetime.utcnow().isoformat(),
        }

        return AuthResponse(
            access_token=tokens["access_token"],
            refresh_token=tokens["refresh_token"],
            token_type=tokens["token_type"],
            user=user_response,
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Registration error: {e}")
        raise HTTPException(status_code=500, detail="Registration failed")


@router.post("/login", response_model=AuthResponse)
async def login(request: LoginRequest):
    """
    Login user with email or username
    """
    try:
        # Find user by email or username
        if "@" in request.email_or_username:
            user_result = db_client.client.table("users").select("*").eq("email", request.email_or_username).execute()
        else:
            user_result = db_client.client.table("users").select("*").eq("username", request.email_or_username).execute()

        if not user_result.data:
            raise HTTPException(status_code=401, detail="Invalid email/username or password")

        user = user_result.data[0]

        # Verify password
        if not User.hash_password("") and not User().verify_password(request.password, user["password_hash"]):
            # Verify against hash
            from passlib.context import CryptContext
            pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
            if not pwd_context.verify(request.password, user["password_hash"]):
                raise HTTPException(status_code=401, detail="Invalid email/username or password")

        # Check if user is active
        if not user["is_active"]:
            raise HTTPException(status_code=403, detail="Account is inactive")

        # Create tokens
        tokens = TokenHelper.create_tokens(user["id"], user["username"])

        # Update last active
        db_client.client.table("user_profiles").update({"last_active": datetime.utcnow().isoformat()}).eq("user_id", user["id"]).execute()

        user_response = {
            "id": user["id"],
            "username": user["username"],
            "email": user["email"],
            "full_name": user["full_name"],
            "avatar_url": user["avatar_url"],
            "bio": user["bio"],
            "email_verified": user["email_verified"],
            "created_at": user["created_at"],
        }

        return AuthResponse(
            access_token=tokens["access_token"],
            refresh_token=tokens["refresh_token"],
            token_type=tokens["token_type"],
            user=user_response,
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Login error: {e}")
        raise HTTPException(status_code=500, detail="Login failed")


@router.post("/verify-email")
async def verify_email(request: VerifyEmailRequest):
    """
    Verify user email with token
    """
    try:
        # Find token
        token_result = db_client.client.table("email_verification_tokens").select("*").eq("token", request.token).execute()

        if not token_result.data:
            raise HTTPException(status_code=400, detail="Invalid verification token")

        token_record = token_result.data[0]

        # Check if token is valid
        expires_at = datetime.fromisoformat(token_record["expires_at"])
        if token_record["is_used"] or expires_at < datetime.utcnow():
            raise HTTPException(status_code=400, detail="Verification token expired")

        # Mark email as verified
        db_client.client.table("users").update({"email_verified": True}).eq("id", token_record["user_id"]).execute()

        # Mark token as used
        db_client.client.table("email_verification_tokens").update({"is_used": True}).eq("id", token_record["id"]).execute()

        return {"message": "Email verified successfully"}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Email verification error: {e}")
        raise HTTPException(status_code=500, detail="Email verification failed")


@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest):
    """
    Request password reset email
    """
    try:
        # Find user by email
        user_result = db_client.client.table("users").select("*").eq("email", request.email).execute()

        if not user_result.data:
            # Don't reveal if email exists
            return {"message": "If that email is registered, you will receive a password reset link"}

        user = user_result.data[0]

        # Create reset token
        reset_token = JWTHandler.create_password_reset_token()
        expires_at = (datetime.utcnow() + timedelta(hours=PASSWORD_RESET_EXPIRATION_HOURS)).isoformat()

        token_data = {
            "id": str(uuid.uuid4()),
            "user_id": user["id"],
            "token": reset_token,
            "expires_at": expires_at,
            "is_used": False,
        }

        db_client.client.table("password_reset_tokens").insert(token_data).execute()

        # Send reset email
        EmailService.send_password_reset_email(request.email, user["username"], reset_token)

        return {"message": "If that email is registered, you will receive a password reset link"}

    except Exception as e:
        print(f"Forgot password error: {e}")
        return {"message": "If that email is registered, you will receive a password reset link"}


@router.post("/reset-password")
async def reset_password(request: ResetPasswordRequest):
    """
    Reset password with token
    """
    try:
        # Find token
        token_result = db_client.client.table("password_reset_tokens").select("*").eq("token", request.token).execute()

        if not token_result.data:
            raise HTTPException(status_code=400, detail="Invalid reset token")

        token_record = token_result.data[0]

        # Check if token is valid
        expires_at = datetime.fromisoformat(token_record["expires_at"])
        if token_record["is_used"] or expires_at < datetime.utcnow():
            raise HTTPException(status_code=400, detail="Reset token expired")

        # Hash new password
        password_hash = User.hash_password(request.new_password)

        # Update user password
        db_client.client.table("users").update({"password_hash": password_hash}).eq("id", token_record["user_id"]).execute()

        # Mark token as used
        db_client.client.table("password_reset_tokens").update({"is_used": True}).eq("id", token_record["id"]).execute()

        return {"message": "Password reset successfully"}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Reset password error: {e}")
        raise HTTPException(status_code=500, detail="Password reset failed")


@router.post("/refresh")
async def refresh_token(request: RefreshTokenRequest):
    """
    Refresh access token using refresh token
    """
    try:
        # Verify refresh token
        payload = JWTHandler.verify_token(request.refresh_token, token_type="refresh")
        if not payload:
            raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

        user_id = payload.get("sub")
        username = payload.get("username")

        # Create new tokens
        tokens = TokenHelper.create_tokens(user_id, username)

        return {
            "access_token": tokens["access_token"],
            "refresh_token": tokens["refresh_token"],
            "token_type": tokens["token_type"],
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Token refresh error: {e}")
        raise HTTPException(status_code=500, detail="Token refresh failed")


@router.post("/resend-verification")
async def resend_verification_email(request: dict):
    """
    Resend verification email
    """
    try:
        email = request.get("email")
        if not email:
            raise HTTPException(status_code=400, detail="Email is required")

        # Find user by email
        user_result = db_client.client.table("users").select("*").eq("email", email).execute()

        if not user_result.data:
            # Don't reveal if email exists
            return {"message": "If that email is registered, you will receive a verification email"}

        user = user_result.data[0]

        # Check if already verified
        if user["email_verified"]:
            return {"message": "Email is already verified"}

        # Invalidate old tokens
        db_client.client.table("email_verification_tokens").update({"is_used": True}).eq(
            "user_id", user["id"]
        ).eq("is_used", False).execute()

        # Create new verification token
        verification_token = JWTHandler.create_email_verification_token()
        expires_at = (datetime.utcnow() + timedelta(hours=EMAIL_VERIFICATION_EXPIRATION_HOURS)).isoformat()

        token_data = {
            "id": str(uuid.uuid4()),
            "user_id": user["id"],
            "token": verification_token,
            "expires_at": expires_at,
            "is_used": False,
        }

        db_client.client.table("email_verification_tokens").insert(token_data).execute()

        # Send verification email
        EmailService.send_verification_email(email, user["username"], verification_token)

        return {"message": "If that email is registered, you will receive a verification email"}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Resend verification error: {e}")
        return {"message": "If that email is registered, you will receive a verification email"}


@router.get("/me", response_model=UserResponse)
async def get_current_user(token: str = Depends(lambda: None)):
    """
    Get current authenticated user profile
    """
    try:
        # In production, extract from Authorization header
        # This is a placeholder - implement proper dependency injection
        raise HTTPException(status_code=401, detail="Not authenticated")

    except HTTPException:
        raise
    except Exception as e:
        print(f"Get current user error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get user profile")
