from pathlib import Path
import os
from collections import defaultdict, deque
from time import time

import httpx
from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

# Load backend/.env explicitly so this router always reads server secrets.
load_dotenv(Path(__file__).resolve().parents[1] / ".env")

router = APIRouter()

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
RATE_LIMIT_WINDOW_SECONDS = int(os.getenv("CHAT_RATE_LIMIT_WINDOW_SECONDS", "60"))
RATE_LIMIT_MAX_REQUESTS = int(os.getenv("CHAT_RATE_LIMIT_MAX_REQUESTS", "20"))
CONNECT_TIMEOUT_SECONDS = float(os.getenv("CHAT_CONNECT_TIMEOUT_SECONDS", "5"))
READ_TIMEOUT_SECONDS = float(os.getenv("CHAT_READ_TIMEOUT_SECONDS", "15"))
_REQUEST_LOG: dict[str, deque[float]] = defaultdict(deque)

SYSTEM_PROMPT = (
    "You are Agent Arena AI assistant. Help users understand Agent Arena features, scenarios, "
    "agents, and AI/technology topics with concise and practical answers."
)


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    question: str | None = None
    messages: list[ChatMessage] = Field(default_factory=list)


def _enforce_rate_limit(client_id: str) -> None:
    now = time()
    bucket = _REQUEST_LOG[client_id]
    cutoff = now - RATE_LIMIT_WINDOW_SECONDS

    while bucket and bucket[0] < cutoff:
        bucket.popleft()

    if len(bucket) >= RATE_LIMIT_MAX_REQUESTS:
        retry_after = max(1, int(RATE_LIMIT_WINDOW_SECONDS - (now - bucket[0])))
        raise HTTPException(
            status_code=429,
            detail=(
                f"Rate limit exceeded. Try again in {retry_after}s "
                f"({RATE_LIMIT_MAX_REQUESTS} requests/{RATE_LIMIT_WINDOW_SECONDS}s)."
            ),
            headers={"Retry-After": str(retry_after)},
        )

    bucket.append(now)


@router.post("/groq")
async def groq_chat(payload: ChatRequest, request: Request):
    client_id = request.client.host if request.client else "unknown"
    _enforce_rate_limit(client_id)

    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Missing GROQ_API_KEY on backend")

    normalized_messages = [
        {"role": m.role, "content": m.content}
        for m in payload.messages
        if isinstance(m.content, str) and m.role in {"user", "assistant"}
    ][-10:]

    fallback_question = (payload.question or "").strip()
    if not normalized_messages and not fallback_question:
        raise HTTPException(status_code=400, detail="Question is required")

    chat_messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        *normalized_messages,
        *([{"role": "user", "content": fallback_question}] if fallback_question else []),
    ]

    body = {
        "model": "llama-3.3-70b-versatile",
        "temperature": 0.4,
        "max_tokens": 700,
        "messages": chat_messages,
    }

    try:
        timeout = httpx.Timeout(connect=CONNECT_TIMEOUT_SECONDS, read=READ_TIMEOUT_SECONDS, write=READ_TIMEOUT_SECONDS, pool=READ_TIMEOUT_SECONDS)
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(
                GROQ_URL,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {api_key}",
                },
                json=body,
            )
        data = response.json()
    except httpx.TimeoutException as exc:
        raise HTTPException(status_code=504, detail="Groq request timed out, please try again") from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Failed to connect to Groq") from exc

    if response.status_code >= 400:
        message = data.get("error", {}).get("message", "Groq request failed")
        raise HTTPException(status_code=response.status_code, detail=message)

    answer = data.get("choices", [{}])[0].get("message", {}).get("content")
    if not answer:
        raise HTTPException(status_code=502, detail="No response from Groq")

    return {"answer": answer}
