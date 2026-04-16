from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sys
import os
from pathlib import Path

# Add backend module to path for deployment flexibility
BACKEND_DIR = Path(__file__).parent
sys.path.insert(0, str(BACKEND_DIR))
sys.path.insert(0, str(BACKEND_DIR.parent))

from engine.synapse import router as synapse_router
from agents.router import router as agents_router
from chat.router import router as chat_router
from auth.router import router as auth_router
from agents.community import community_router, threads_router, comments_router, moderation_router

# Conditionally import blog router if available (private module)
try:
    from blog.router import router as blog_router
    blog_available = True
except ImportError:
    blog_available = False

app = FastAPI(
    title="Agent-Arena API",
    description="Open Source Industrial AI Hub — Backend API",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    return {"status": "ok"}


app.include_router(synapse_router, prefix="/api/arena", tags=["Arena"])
app.include_router(agents_router, prefix="/api/agents", tags=["Agents"])
app.include_router(chat_router, prefix="/api/chat", tags=["Chat"])
app.include_router(auth_router, tags=["Auth"])
app.include_router(community_router, tags=["Community"])
app.include_router(threads_router, tags=["Threads"])
app.include_router(comments_router, tags=["Comments"])
app.include_router(moderation_router, tags=["Moderation"])

# Include blog router only if private blog module is available
if blog_available:
    app.include_router(blog_router, prefix="/api/blog", tags=["Blog"])
