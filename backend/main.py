from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sys
import os

# Add blog module to path (private/proprietary system)
sys.path.insert(0, os.path.dirname(__file__))

from engine.synapse import router as synapse_router
from agents.router import router as agents_router
from chat.router import router as chat_router

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

# Include blog router only if private blog module is available
if blog_available:
    app.include_router(blog_router, prefix="/api/v1/blog", tags=["Blog"])
