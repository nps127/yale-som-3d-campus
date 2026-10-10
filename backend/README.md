# Professor agents backend (FastAPI + PydanticAI)

Every instructor in `../data/yale_som.db` is a PydanticAI agent. An agent's instructions come from the
database (bio, courses, sections, rooms, descriptions), a shared block of stats/regression/AI expertise,
and an optional speaking style in `STYLES` (`professors.py`). Agents can search the whole catalog with
tools (`db.py`): `search_courses`, `get_course_details`, `courses_by_professor`, `room_schedule`,
`list_categories`. Model calls go through Portkey.

## Setup

```bash
cd backend
uv venv --python 3.12 .venv
uv pip install --python .venv/bin/python -r requirements.txt
```

Keys: the backend loads the nearest `.env` walking up from this folder (here, the repo, or the course
workspace). See `.env.example`. `OPENAI_MODEL` defaults to `gpt-6-luna`.

## Run

```bash
.venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000
```

Then `npm run dev` in the repo root; Vite proxies `/api` to port 8000.

## API

- `GET /api/health`
- `GET /api/professors`: all 109 professors (`id` like `tauhid-zaman`)
- `GET /api/professors/{id}`: bio + courses
- `POST /api/professors/{id}/chat` `{"message": "...", "session_id": "..."}` → `{"reply": "..."}`
- `DELETE /api/professors/{id}/chat/{session_id}`: forget a conversation

Conversations are kept in memory per (professor, session) and reset when the server restarts.

## Adding a styled avatar

1. Add the professor's style to `STYLES` in `professors.py`, keyed by their id.
2. Add them to `TALKERS` in `../src/chat.js` and give them a 3D avatar in the room the catalog lists.
