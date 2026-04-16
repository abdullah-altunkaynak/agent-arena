"""
Community Module - Handles communities, categories, threads, comments, and moderation
"""

from backend.agents.community.router import router as community_router
from backend.agents.community.threads_router import router as threads_router
from backend.agents.community.comments_router import router as comments_router
from backend.agents.community.moderation_router import router as moderation_router

__all__ = ["community_router", "threads_router", "comments_router", "moderation_router"]
