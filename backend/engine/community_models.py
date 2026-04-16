"""
SQLAlchemy Models for Community Platform
"""
from datetime import datetime, timedelta
from typing import Optional, List
from sqlalchemy import Column, String, Integer, Boolean, DateTime, Text, ForeignKey, UUID, UniqueConstraint, CheckConstraint, func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from passlib.context import CryptContext
import uuid as uuid_lib

Base = declarative_base()

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class Role(Base):
    """User roles: admin, moderator, member"""
    __tablename__ = "roles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid_lib.uuid4)
    name = Column(String(50), unique=True, nullable=False)
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    users = relationship("User", back_populates="role")

    def __repr__(self):
        return f"<Role {self.name}>"


class User(Base):
    """User model for authentication and profiles"""
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid_lib.uuid4)
    username = Column(String(30), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(100))
    avatar_url = Column(Text)
    bio = Column(Text)
    role_id = Column(UUID(as_uuid=True), ForeignKey("roles.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    email_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    role = relationship("Role", back_populates="users")
    profile = relationship("UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    verification_tokens = relationship("EmailVerificationToken", back_populates="user", cascade="all, delete-orphan")
    reset_tokens = relationship("PasswordResetToken", back_populates="user", cascade="all, delete-orphan")
    threads = relationship("Thread", back_populates="author", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="author", cascade="all, delete-orphan")
    likes = relationship("Like", back_populates="user", cascade="all, delete-orphan")
    points_logs = relationship("PointsLog", back_populates="user", cascade="all, delete-orphan")
    badges = relationship("Badge", secondary="user_badges", back_populates="users")
    notifications = relationship("Notification", foreign_keys="Notification.recipient_id", back_populates="recipient")
    reports = relationship("Report", back_populates="reported_by")
    warnings = relationship("UserWarning", back_populates="user", cascade="all, delete-orphan")
    followers = relationship(
        "User",
        secondary="user_follows",
        primaryjoin="User.id == user_follows.c.following_id",
        secondaryjoin="User.id == user_follows.c.follower_id",
        backref="following",
    )

    @classmethod
    def hash_password(cls, password: str) -> str:
        """Hash password using bcrypt"""
        return pwd_context.hash(password)

    def verify_password(self, password: str) -> bool:
        """Verify password against hash"""
        return pwd_context.verify(password, self.password_hash)

    def __repr__(self):
        return f"<User {self.username}>"


class EmailVerificationToken(Base):
    """Email verification tokens"""
    __tablename__ = "email_verification_tokens"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid_lib.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token = Column(String(255), unique=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    is_used = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="verification_tokens")

    def is_valid(self) -> bool:
        """Check if token is valid (not used and not expired)"""
        return not self.is_used and self.expires_at > datetime.utcnow()

    def __repr__(self):
        return f"<EmailVerificationToken {self.user_id}>"


class PasswordResetToken(Base):
    """Password reset tokens"""
    __tablename__ = "password_reset_tokens"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid_lib.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token = Column(String(255), unique=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    is_used = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="reset_tokens")

    def is_valid(self) -> bool:
        """Check if token is valid (not used and not expired)"""
        return not self.is_used and self.expires_at > datetime.utcnow()

    def __repr__(self):
        return f"<PasswordResetToken {self.user_id}>"


class UserProfile(Base):
    """Extended user profile with gamification stats"""
    __tablename__ = "user_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid_lib.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    points_total = Column(Integer, default=0)
    level = Column(Integer, default=1)
    threads_count = Column(Integer, default=0)
    comments_count = Column(Integer, default=0)
    followers_count = Column(Integer, default=0)
    following_count = Column(Integer, default=0)
    last_active = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="profile")

    def calculate_level(self) -> int:
        """Calculate level based on points (100 points per level)"""
        return max(1, self.points_total // 100 + 1)

    def __repr__(self):
        return f"<UserProfile {self.user_id} L{self.level}>"


class Community(Base):
    """Community groups for organizing discussions"""
    __tablename__ = "communities"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid_lib.uuid4)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    icon_url = Column(Text)
    banner_url = Column(Text)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    is_public = Column(Boolean, default=True)
    members_count = Column(Integer, default=0)
    threads_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    categories = relationship("Category", back_populates="community", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Community {self.name}>"


class Category(Base):
    """Discussion categories within communities"""
    __tablename__ = "categories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid_lib.uuid4)
    community_id = Column(UUID(as_uuid=True), ForeignKey("communities.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    slug = Column(String(100), nullable=False)
    icon = Column(String(50))
    color = Column(String(7))
    order = Column(Integer, default=0)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    threads_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Constraints
    __table_args__ = (
        UniqueConstraint("community_id", "slug", name="uq_community_slug"),
    )

    # Relationships
    community = relationship("Community", back_populates="categories")
    threads = relationship("Thread", back_populates="category", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Category {self.name}>"


class Thread(Base):
    """Discussion thread/post"""
    __tablename__ = "threads"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid_lib.uuid4)
    category_id = Column(UUID(as_uuid=True), ForeignKey("categories.id", ondelete="CASCADE"), nullable=False, index=True)
    author_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    slug = Column(String(255), nullable=False)
    is_pinned = Column(Boolean, default=False)
    is_locked = Column(Boolean, default=False)
    views_count = Column(Integer, default=0)
    replies_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_reply_at = Column(DateTime)

    # Relationships
    category = relationship("Category", back_populates="threads")
    author = relationship("User", back_populates="threads")
    comments = relationship("Comment", back_populates="thread", cascade="all, delete-orphan")
    likes = relationship("Like", back_populates="thread", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Thread {self.title[:30]}>"


class Comment(Base):
    """Nested comments on threads"""
    __tablename__ = "comments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid_lib.uuid4)
    thread_id = Column(UUID(as_uuid=True), ForeignKey("threads.id", ondelete="CASCADE"), nullable=False, index=True)
    parent_comment_id = Column(UUID(as_uuid=True), ForeignKey("comments.id", ondelete="CASCADE"))
    author_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    content = Column(Text, nullable=False)
    likes_count = Column(Integer, default=0)
    is_edited = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    thread = relationship("Thread", back_populates="comments")
    author = relationship("User", back_populates="comments")
    replies = relationship("Comment", remote_side=[id], cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Comment by {self.author_id}>"


class Like(Base):
    """Likes on threads and comments"""
    __tablename__ = "likes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid_lib.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    thread_id = Column(UUID(as_uuid=True), ForeignKey("threads.id", ondelete="CASCADE"))
    comment_id = Column(UUID(as_uuid=True), ForeignKey("comments.id", ondelete="CASCADE"))
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("user_id", "thread_id", "comment_id", name="uq_user_like"),
        CheckConstraint(
            "(thread_id IS NOT NULL AND comment_id IS NULL) OR (thread_id IS NULL AND comment_id IS NOT NULL)",
            name="ck_like_reference"
        ),
    )

    # Relationships
    user = relationship("User", back_populates="likes")
    thread = relationship("Thread", back_populates="likes")
    comment = relationship("Comment")

    def __repr__(self):
        return f"<Like {self.user_id}>"


class PointsLog(Base):
    """Log of all user points transactions"""
    __tablename__ = "points_log"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid_lib.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    action_type = Column(String(50), nullable=False)  # 'thread_created', 'comment_added', 'like_received', etc.
    points_earned = Column(Integer, nullable=False)
    reference_id = Column(UUID(as_uuid=True))  # ID of thread/comment that triggered it
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="points_logs")

    def __repr__(self):
        return f"<PointsLog {self.action_type}>"


class Badge(Base):
    """Gamification badges"""
    __tablename__ = "badges"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid_lib.uuid4)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text)
    icon = Column(Text)
    points_threshold = Column(Integer)  # Points required to earn this badge
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    users = relationship("User", secondary="user_badges", back_populates="badges")

    def __repr__(self):
        return f"<Badge {self.name}>"


class UserBadge(Base):
    """Junction table for user-badge relationship"""
    __tablename__ = "user_badges"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid_lib.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    badge_id = Column(UUID(as_uuid=True), ForeignKey("badges.id", ondelete="CASCADE"), nullable=False)
    earned_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("user_id", "badge_id", name="uq_user_badge"),
    )

    def __repr__(self):
        return f"<UserBadge>"


class Notification(Base):
    """User notifications"""
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid_lib.uuid4)
    recipient_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    actor_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    type = Column(String(50), nullable=False)  # 'mention', 'like', 'follow', 'reply', etc.
    reference_id = Column(UUID(as_uuid=True))  # ID of related content
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    recipient = relationship("User", foreign_keys=[recipient_id], back_populates="notifications")

    def __repr__(self):
        return f"<Notification {self.type}>"


class Report(Base):
    """Content moderation reports"""
    __tablename__ = "reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid_lib.uuid4)
    reported_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    content_type = Column(String(50), nullable=False)  # 'thread', 'comment', 'user'
    content_id = Column(UUID(as_uuid=True), nullable=False)
    reason = Column(Text, nullable=False)
    status = Column(String(20), default="pending")  # pending, resolved, dismissed
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime)
    resolved_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))

    # Relationships
    reported_by_user = relationship("User", foreign_keys=[reported_by], back_populates="reports")

    def __repr__(self):
        return f"<Report {self.content_type}>"


class UserWarning(Base):
    """User warnings for policy violations"""
    __tablename__ = "user_warnings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid_lib.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    reason = Column(Text, nullable=False)
    issued_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    warning_level = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="warnings")

    def __repr__(self):
        return f"<UserWarning L{self.warning_level}>"
