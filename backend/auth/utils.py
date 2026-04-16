"""
Authentication Utilities and Helpers
"""
import jwt
import secrets
import re
import smtplib
from datetime import datetime, timedelta
from typing import Dict, Tuple, Optional
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Configuration
JWT_SECRET = "your-secret-key-change-this"  # Load from environment in production
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRATION_MINUTES = 60
REFRESH_TOKEN_EXPIRATION_DAYS = 30
EMAIL_VERIFICATION_EXPIRATION_HOURS = 24
PASSWORD_RESET_EXPIRATION_HOURS = 1

# Email Configuration
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SENDER_EMAIL = "your-email@gmail.com"
SENDER_PASSWORD = "your-app-password"
APP_NAME = "Agent Arena"
APP_URL = "https://agentarena.me"


class JWTHandler:
    """JWT Token handling"""

    @staticmethod
    def create_access_token(user_id: str, username: str) -> str:
        """Create access token"""
        payload = {
            "sub": user_id,
            "username": username,
            "exp": datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRATION_MINUTES),
            "iat": datetime.utcnow(),
            "type": "access",
        }
        return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

    @staticmethod
    def create_refresh_token(user_id: str, username: str) -> str:
        """Create refresh token"""
        payload = {
            "sub": user_id,
            "username": username,
            "exp": datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRATION_DAYS),
            "iat": datetime.utcnow(),
            "type": "refresh",
        }
        return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

    @staticmethod
    def verify_token(token: str, token_type: str = "access") -> Optional[Dict]:
        """Verify and decode token"""
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            if payload.get("type") != token_type:
                return None
            return payload
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None

    @staticmethod
    def create_email_verification_token() -> str:
        """Create email verification token"""
        return secrets.token_urlsafe(32)

    @staticmethod
    def create_password_reset_token() -> str:
        """Create password reset token"""
        return secrets.token_urlsafe(32)


class PasswordValidator:
    """Password validation rules"""

    MIN_LENGTH = 8
    REQUIRE_UPPERCASE = True
    REQUIRE_LOWERCASE = True
    REQUIRE_NUMBERS = True
    REQUIRE_SPECIAL = True

    @classmethod
    def validate(cls, password: str) -> Tuple[bool, str]:
        """Validate password against requirements"""
        if len(password) < cls.MIN_LENGTH:
            return False, f"Password must be at least {cls.MIN_LENGTH} characters long"

        if cls.REQUIRE_UPPERCASE and not re.search(r"[A-Z]", password):
            return False, "Password must contain at least one uppercase letter"

        if cls.REQUIRE_LOWERCASE and not re.search(r"[a-z]", password):
            return False, "Password must contain at least one lowercase letter"

        if cls.REQUIRE_NUMBERS and not re.search(r"\d", password):
            return False, "Password must contain at least one number"

        if cls.REQUIRE_SPECIAL and not re.search(r"[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>\/?]", password):
            return False, "Password must contain at least one special character"

        return True, ""


class UsernameValidator:
    """Username validation rules"""

    MIN_LENGTH = 3
    MAX_LENGTH = 30
    ALLOWED_PATTERN = r"^[a-zA-Z0-9_\-]+$"

    @classmethod
    def validate(cls, username: str) -> Tuple[bool, str]:
        """Validate username against requirements"""
        if len(username) < cls.MIN_LENGTH:
            return False, f"Username must be at least {cls.MIN_LENGTH} characters long"

        if len(username) > cls.MAX_LENGTH:
            return False, f"Username must be at most {cls.MAX_LENGTH} characters long"

        if not re.match(cls.ALLOWED_PATTERN, username):
            return False, "Username can only contain letters, numbers, underscores, and hyphens"

        return True, ""


class EmailValidator:
    """Email validation rules"""

    PATTERN = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"

    @classmethod
    def validate(cls, email: str) -> Tuple[bool, str]:
        """Validate email format"""
        if not re.match(cls.PATTERN, email):
            return False, "Invalid email format"

        return True, ""


class TokenHelper:
    """Token creation and management"""

    @staticmethod
    def create_tokens(user_id: str, username: str) -> Dict[str, str]:
        """Create both access and refresh tokens"""
        return {
            "access_token": JWTHandler.create_access_token(user_id, username),
            "refresh_token": JWTHandler.create_refresh_token(user_id, username),
            "token_type": "bearer",
        }


class EmailService:
    """Email sending service"""

    @staticmethod
    def _send_email(to_email: str, subject: str, html_content: str) -> bool:
        """Send email using SMTP"""
        try:
            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = SENDER_EMAIL
            message["To"] = to_email

            # Attach HTML content
            part = MIMEText(html_content, "html")
            message.attach(part)

            # Send email
            with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
                server.starttls()
                server.login(SENDER_EMAIL, SENDER_PASSWORD)
                server.sendmail(SENDER_EMAIL, to_email, message.as_string())

            return True
        except Exception as e:
            print(f"Email sending error: {e}")
            return False

    @staticmethod
    def send_verification_email(to_email: str, username: str, token: str) -> bool:
        """Send email verification link"""
        verification_url = f"{APP_URL}/auth/verify-email?token={token}"

        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
                <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h1 style="color: #333; text-align: center; margin-top: 0;">Welcome to {APP_NAME}! 🚀</h1>
                    
                    <p style="color: #666; font-size: 16px;">Hi {username},</p>
                    
                    <p style="color: #666; font-size: 16px; line-height: 1.6;">
                        Thank you for creating an account with us. To complete your registration, please verify your email address by clicking the button below.
                    </p>
                    
                    <div style="text-align: center; margin: 40px 0;">
                        <a href="{verification_url}" style="background-color: #7c3aed; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold; display: inline-block;">
                            Verify Email Address
                        </a>
                    </div>
                    
                    <p style="color: #999; font-size: 14px;">
                        Or copy and paste this link in your browser: <br/>
                        <code style="background-color: #f5f5f5; padding: 8px; border-radius: 4px; display: block; margin-top: 10px; word-break: break-all;">
                            {verification_url}
                        </code>
                    </p>
                    
                    <p style="color: #666; font-size: 14px; margin-top: 30px;">
                        This link will expire in 24 hours.
                    </p>
                    
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                    
                    <p style="color: #999; font-size: 12px; text-align: center;">
                        If you didn't create this account, you can safely ignore this email.
                    </p>
                </div>
            </body>
        </html>
        """

        return EmailService._send_email(to_email, f"Verify Your {APP_NAME} Account", html_content)

    @staticmethod
    def send_password_reset_email(to_email: str, username: str, token: str) -> bool:
        """Send password reset link"""
        reset_url = f"{APP_URL}/auth/reset-password?token={token}"

        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
                <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h1 style="color: #333; text-align: center; margin-top: 0;">Password Reset Request 🔐</h1>
                    
                    <p style="color: #666; font-size: 16px;">Hi {username},</p>
                    
                    <p style="color: #666; font-size: 16px; line-height: 1.6;">
                        We received a request to reset your password. If you made this request, click the button below to create a new password.
                    </p>
                    
                    <div style="text-align: center; margin: 40px 0;">
                        <a href="{reset_url}" style="background-color: #7c3aed; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold; display: inline-block;">
                            Reset Password
                        </a>
                    </div>
                    
                    <p style="color: #999; font-size: 14px;">
                        Or copy and paste this link in your browser: <br/>
                        <code style="background-color: #f5f5f5; padding: 8px; border-radius: 4px; display: block; margin-top: 10px; word-break: break-all;">
                            {reset_url}
                        </code>
                    </p>
                    
                    <p style="color: #ff6b6b; font-size: 14px; font-weight: bold; margin-top: 30px;">
                        ⚠️ This link will expire in 1 hour.
                    </p>
                    
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                    
                    <p style="color: #999; font-size: 12px; text-align: center;">
                        If you didn't request a password reset, please ignore this email or contact support if you have concerns about your account security.
                    </p>
                </div>
            </body>
        </html>
        """

        return EmailService._send_email(to_email, f"Reset Your {APP_NAME} Password", html_content)

    @staticmethod
    def send_welcome_email(to_email: str, username: str) -> bool:
        """Send welcome email after successful verification"""
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
                <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h1 style="color: #333; text-align: center; margin-top: 0;">Welcome to {APP_NAME}! 🎉</h1>
                    
                    <p style="color: #666; font-size: 16px;">Hi {username},</p>
                    
                    <p style="color: #666; font-size: 16px; line-height: 1.6;">
                        Your account has been successfully verified. You're all set to explore our community!
                    </p>
                    
                    <div style="background-color: #f0f4ff; border-left: 4px solid #7c3aed; padding: 20px; border-radius: 4px; margin: 30px 0;">
                        <h3 style="color: #7c3aed; margin-top: 0;">Get Started:</h3>
                        <ul style="color: #666; line-height: 1.8;">
                            <li>Complete your profile</li>
                            <li>Join communities</li>
                            <li>Start discussions</li>
                            <li>Earn points and badges</li>
                        </ul>
                    </div>
                    
                    <div style="text-align: center; margin: 40px 0;">
                        <a href="{APP_URL}/community" style="background-color: #7c3aed; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold; display: inline-block;">
                            Explore Community
                        </a>
                    </div>
                    
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                    
                    <p style="color: #999; font-size: 12px; text-align: center;">
                        Have questions? Check out our <a href="{APP_URL}/help" style="color: #7c3aed; text-decoration: none;">Help Center</a>
                    </p>
                </div>
            </body>
        </html>
        """

        return EmailService._send_email(to_email, f"Welcome to {APP_NAME}!", html_content)
