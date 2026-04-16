"""
Community Module - Handles communities, categories, threads, comments, and moderation
"""

from .router import router as community_router
from .threads_router import router as threads_router
from .comments_router import router as comments_router
from .moderation_router import router as moderation_router

__all__ = ["community_router", "threads_router", "comments_router", "moderation_router"]
