"""FastAPI backend: chat with the Yale SOM professor agents.

Run from this folder:  .venv/bin/uvicorn main:app --port 8000
"""

from __future__ import annotations

import logging
import os
from collections import OrderedDict

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from pydantic_ai.messages import ModelMessage
from pydantic_ai.usage import UsageLimits

import db
import professors

log = logging.getLogger("uvicorn.error")

app = FastAPI(title="Yale SOM virtual professors")
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(","),
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Content-Type"],
)

MAX_SESSIONS = 500
MAX_HISTORY = 40  # messages kept per conversation (each tool call adds a few)
# (professor id, session id) -> message history, oldest conversations evicted first
_sessions: OrderedDict[tuple[str, str], list[ModelMessage]] = OrderedDict()


class ChatIn(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    session_id: str = Field(min_length=8, max_length=64)


class ChatOut(BaseModel):
    reply: str
    professor: str


def _professor(prof_id: str) -> dict:
    prof = db.professors().get(prof_id)
    if not prof:
        raise HTTPException(404, f"No professor '{prof_id}' in the catalog")
    return prof


def _trim_history(messages: list[ModelMessage]) -> list[ModelMessage]:
    """Keep the newest messages, starting on a user request so tool calls are never split."""
    if len(messages) <= MAX_HISTORY:
        return messages
    tail = messages[-MAX_HISTORY:]
    for i, m in enumerate(tail):
        if m.kind == "request" and any(p.part_kind == "user-prompt" for p in m.parts):
            return tail[i:]
    return []


@app.get("/api/health")
def health():
    return {"ok": True, "model": professors.MODEL_NAME, "professors": len(db.professors())}


@app.get("/api/professors")
def list_professors():
    return [{"id": p["id"], "name": p["name"], "styled": p["id"] in professors.STYLES} for p in db.professors().values()]


@app.get("/api/professors/{prof_id}")
def get_professor(prof_id: str):
    prof = _professor(prof_id)
    return {**prof, "courses": db.courses_by_professor(prof["catalog_name"])}


@app.post("/api/professors/{prof_id}/chat", response_model=ChatOut)
async def chat(prof_id: str, body: ChatIn):
    prof = _professor(prof_id)
    key = (prof_id, body.session_id)
    history = _sessions.pop(key, [])
    try:
        result = await professors.get_agent(prof_id).run(
            body.message,
            message_history=history,
            usage_limits=UsageLimits(request_limit=8),
        )
    except Exception as exc:  # noqa: BLE001 - surface a friendly error, keep details in the server log
        log.exception("chat with %s failed", prof_id)
        raise HTTPException(502, f"{prof['name']} couldn't answer right now ({type(exc).__name__}). Try again.") from exc
    _sessions[key] = _trim_history(result.all_messages())
    while len(_sessions) > MAX_SESSIONS:
        _sessions.popitem(last=False)
    return ChatOut(reply=result.output, professor=prof["name"])


@app.delete("/api/professors/{prof_id}/chat/{session_id}")
def reset_chat(prof_id: str, session_id: str):
    _sessions.pop((prof_id, session_id), None)
    return {"ok": True}
