from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from engine.synapse import router as synapse_router
from agents.router import router as agents_router

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
