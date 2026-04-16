"""
Authentication utilities for JWT, password, email handling
"""
import os
import secrets
import string
from datetime import datetime, timedelta
from typing import Optional, Dict
import jwt
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import smtplib
import re

# JWT Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRATION_MINUTES = 30
REFRESH_TOKEN_EXPIRATION_DAYS = 7
EMAIL_VERIFICATION_EXPIRATION_HOURS = 24
PASSWORD_RESET_EXPIRATION_HOURS = 2

# Email Configuration
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
EMAIL_FROM = os.getenv("EMAIL_FROM", "noreply@agentarena.me")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD", "")

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")


class JWTHandler:
    """JWT token creation and verification"""

    @staticmethod
    def create_access_token(data: Dict, expires_delta: Optional[timedelta] = None) -> str:
        """Create JWT access token"""
        to_encode = data.copy()
        
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRATION_MINUTES)
        
        to_encode.update({"exp": expire, "type": "access"})
        
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt

    @staticmethod
    def create_refresh_token(data: Dict) -> str:
        """Create JWT refresh token"""
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRATION_DAYS)
        to_encode.update({"exp": expire, "type": "refresh"})
        
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt

    @staticmethod
    def verify_token(token: str, token_type: str = "access") -> Optional[Dict]:
        """Verify and decode JWT token"""
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            
            # Check token type
            if payload.get("type") != token_type:
                return None
            
            return payload
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None

    @staticmethod
    def create_email_verification_token() -> str:
        """Generate secure email verification token"""
        return secrets.token_urlsafe(32)

    @staticmethod
    def create_password_reset_token() -> str:
        """Generate secure password reset token"""
        return secrets.token_urlsafe(32)


class PasswordValidator:
    """Password validation and requirements"""

    MIN_LENGTH = 8
    REQUIRE_UPPERCASE = True
    REQUIRE_LOWERCASE = True
    REQUIRE_DIGIT = True
    REQUIRE_SPECIAL = True

    @staticmethod
    def validate(password: str) -> tuple[bool, str]:
        """
        Validate password strength
        Returns: (is_valid, error_message)
        """
        if len(password) < PasswordValidator.MIN_LENGTH:
            return False, f"Password must be at least {PasswordValidator.MIN_LENGTH} characters long"

        if PasswordValidator.REQUIRE_UPPERCASE and not re.search(r"[A-Z]", password):
            return False, "Password must contain at least one uppercase letter"

        if PasswordValidator.REQUIRE_LOWERCASE and not re.search(r"[a-z]", password):
            return False, "Password must contain at least one lowercase letter"

        if PasswordValidator.REQUIRE_DIGIT and not re.search(r"\d", password):
            return False, "Password must contain at least one digit"

        if PasswordValidator.REQUIRE_SPECIAL and not re.search(r"[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>\/?]", password):
            return False, "Password must contain at least one special character"

        return True, ""


class UsernameValidator:
    """Username validation"""

    MIN_LENGTH = 3
    MAX_LENGTH = 30
    PATTERN = r"^[a-zA-Z0-9_\-]+$"

    @staticmethod
    def validate(username: str) -> tuple[bool, str]:
        """
        Validate username format
        Returns: (is_valid, error_message)
        """
        if len(username) < UsernameValidator.MIN_LENGTH:
            return False, f"Username must be at least {UsernameValidator.MIN_LENGTH} characters"

        if len(username) > UsernameValidator.MAX_LENGTH:
            return False, f"Username must be at most {UsernameValidator.MAX_LENGTH} characters"

        if not re.match(UsernameValidator.PATTERN, username):
            return False, "Username can only contain letters, numbers, underscores, and hyphens"

        return True, ""


class EmailValidator:
    """Email validation"""

    PATTERN = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"

    @staticmethod
    def validate(email: str) -> tuple[bool, str]:
        """
        Validate email format
        Returns: (is_valid, error_message)
        """
        if not re.match(EmailValidator.PATTERN, email):
            return False, "Invalid email format"

        return True, ""


class EmailService:
    """Email sending service"""

    @staticmethod
    def send_verification_email(email: str, username: str, verification_token: str) -> bool:
        """Send email verification link"""
        try:
            verification_url = f"{FRONTEND_URL}/auth/verify-email?token={verification_token}"

            subject = "Verify Your Email - Agent Arena"

            html_body = f"""
            <html>
                <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
                            <h1 style="margin: 0;">Welcome to Agent Arena!</h1>
                        </div>
                        <div style="padding: 30px;">
                            <p style="color: #333; font-size: 16px;">Hi <strong>{username}</strong>,</p>
                            <p style="color: #666; font-size: 14px; line-height: 1.6;">
                                Thank you for joining Agent Arena! To complete your registration, please verify your email address by clicking the link below:
                            </p>
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="{verification_url}" style="display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
                                    Verify Email Address
                                </a>
                            </div>
                            <p style="color: #999; font-size: 12px;">
                                Or copy and paste this link in your browser:
                                <br><code style="background: #f0f0f0; padding: 10px; display: block; margin-top: 10px; word-break: break-all;">{verification_url}</code>
                            </p>
                            <p style="color: #999; font-size: 12px; margin-top: 20px;">
                                This link will expire in 24 hours.
                            </p>
                        </div>
                        <div style="background: #f5f5f5; padding: 20px; text-align: center; border-top: 1px solid #e0e0e0; font-size: 12px; color: #999;">
                            <p>© 2024 Agent Arena. All rights reserved.</p>
                        </div>
                    </div>
                </body>
            </html>
            """

            return EmailService._send_email(email, subject, html_body)

        except Exception as e:
            print(f"Error sending verification email: {e}")
            return False

    @staticmethod
    def send_password_reset_email(email: str, username: str, reset_token: str) -> bool:
        """Send password reset email"""
        try:
            reset_url = f"{FRONTEND_URL}/auth/reset-password?token={reset_token}"

            subject = "Reset Your Password - Agent Arena"

            html_body = f"""
            <html>
                <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
                            <h1 style="margin: 0;">Password Reset Request</h1>
                        </div>
                        <div style="padding: 30px;">
                            <p style="color: #333; font-size: 16px;">Hi <strong>{username}</strong>,</p>
                            <p style="color: #666; font-size: 14px; line-height: 1.6;">
                                We received a request to reset your password. If you didn't make this request, you can safely ignore this email.
                            </p>
                            <p style="color: #666; font-size: 14px; line-height: 1.6;">
                                To reset your password, click the link below:
                            </p>
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="{reset_url}" style="display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
                                    Reset Password
                                </a>
                            </div>
                            <p style="color: #999; font-size: 12px;">
                                Or copy and paste this link:
                                <br><code style="background: #f0f0f0; padding: 10px; display: block; margin-top: 10px; word-break: break-all;">{reset_url}</code>
                            </p>
                            <p style="color: #999; font-size: 12px; margin-top: 20px;">
                                This link will expire in 2 hours.
                            </p>
                        </div>
                        <div style="background: #f5f5f5; padding: 20px; text-align: center; border-top: 1px solid #e0e0e0; font-size: 12px; color: #999;">
                            <p>© 2024 Agent Arena. All rights reserved.</p>
                        </div>
                    </div>
                </body>
            </html>
            """

            return EmailService._send_email(email, subject, html_body)

        except Exception as e:
            print(f"Error sending password reset email: {e}")
            return False

    @staticmethod
    def _send_email(recipient: str, subject: str, html_body: str) -> bool:
        """Internal method to send email"""
        try:
            if not EMAIL_PASSWORD:
                print("Warning: EMAIL_PASSWORD not configured. Email not sent.")
                return False

            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = EMAIL_FROM
            msg["To"] = recipient

            part = MIMEText(html_body, "html")
            msg.attach(part)

            with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
                server.starttls()
                server.login(EMAIL_FROM, EMAIL_PASSWORD)
                server.sendmail(EMAIL_FROM, recipient, msg.as_string())

            return True

        except Exception as e:
            print(f"Error sending email: {e}")
            return False


class TokenHelper:
    """Helper functions for token operations"""

    @staticmethod
    def create_tokens(user_id: str, username: str) -> Dict[str, str]:
        """Create both access and refresh tokens"""
        data = {"sub": str(user_id), "username": username}

        access_token = JWTHandler.create_access_token(data)
        refresh_token = JWTHandler.create_refresh_token(data)

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
        }

    @staticmethod
    def get_id_from_token(token: str) -> Optional[str]:
        """Extract user ID from token"""
        payload = JWTHandler.verify_token(token, token_type="access")
        if payload:
            return payload.get("sub")
        return None
