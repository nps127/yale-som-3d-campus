"""Read-only access to the Yale SOM course catalog in data/yale_som.db.

The functions at the bottom (search_courses, get_course_details, ...) are handed to every
professor agent as tools, so their docstrings double as the tool descriptions the model sees.
"""

from __future__ import annotations

import re
import sqlite3
from functools import lru_cache
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent.parent / "data" / "yale_som.db"

# columns the agents get back from list-style tools (descriptions are trimmed)
SUMMARY_COLS = "course_number, section, course_title, course_category, course_session, faculty_1, daytimes, room"


def _connect() -> sqlite3.Connection:
    con = sqlite3.connect(f"file:{DB_PATH}?mode=ro", uri=True)
    con.row_factory = sqlite3.Row
    return con


def _rows(sql: str, params: tuple = ()) -> list[dict]:
    with _connect() as con:
        return [dict(r) for r in con.execute(sql, params).fetchall()]


def _clean(row: dict) -> dict:
    """Drop empty fields and the (always blank) email column."""
    return {k: v.strip() if isinstance(v, str) else v for k, v in row.items() if v not in (None, "") and k != "faculty_1_email"}


def _trim(text: str | None, n: int = 280) -> str:
    text = re.sub(r"\s+", " ", text or "").strip()
    return text if len(text) <= n else text[: n - 1].rstrip() + "…"


def slugify(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


# ---------- professors


@lru_cache
def professors() -> dict[str, dict]:
    """Every instructor in the catalog, keyed by slug ('tauhid-zaman').

    The catalog stores names as "Zaman, Tauhid"; `name` is "Tauhid Zaman", `catalog_name` the original.
    """
    out: dict[str, dict] = {}
    for r in _rows(
        "SELECT faculty_1 AS catalog_name, MAX(faculty_bio) AS bio FROM courses "
        "WHERE COALESCE(faculty_1, '') <> '' GROUP BY faculty_1 ORDER BY faculty_1"
    ):
        last, _, first = r["catalog_name"].partition(",")
        name = f"{first.strip()} {last.strip()}".strip()
        out[slugify(name)] = {"id": slugify(name), "name": name, "catalog_name": r["catalog_name"], "bio": (r["bio"] or "").strip()}
    return out


def courses_for(catalog_name: str) -> list[dict]:
    """All sections a professor teaches, full detail (used to build their system prompt)."""
    rows = _rows("SELECT * FROM courses WHERE faculty_1 = ? ORDER BY course_number, section", (catalog_name,))
    return [_clean(r) for r in rows]


# ---------- agent tools


def search_courses(query: str, category: str | None = None, limit: int = 10) -> list[dict]:
    """Search the Yale SOM course catalog by keywords.

    Matches words against course titles, descriptions, course numbers, categories and instructor
    names. Use this when a student asks which classes cover a topic (e.g. "machine learning",
    "negotiation", "private equity") or asks about a class you don't teach.

    Args:
        query: Keywords to look for, e.g. "regression" or "MGT 403".
        category: Optional exact category filter, e.g. "Core", "Finance", "EMBA".
        limit: Maximum number of sections to return (1-25).
    """
    limit = max(1, min(int(limit), 25))
    terms = [t for t in re.findall(r"[\w&]+", query.lower()) if len(t) > 1][:6]
    if not terms:
        return []
    cols = ["course_title", "course_description", "course_number", "course_category", "faculty_1"]
    fields = "LOWER(" + " || ' ' || ".join(f"COALESCE({c}, '')" for c in cols) + ")"
    # rank sections by how many query words they contain; title hits count double
    score = " + ".join([f"(INSTR({fields}, ?) > 0) + (INSTR(LOWER(course_title), ?) > 0)" for _ in terms])
    params: list = [p for t in terms for p in (t, t)]
    where = f"({score}) > 0"
    if category:
        where += " AND LOWER(course_category) = LOWER(?)"
    sql = f"SELECT {SUMMARY_COLS}, course_description, ({score}) AS score FROM courses WHERE {where} ORDER BY score DESC, course_number LIMIT ?"
    rows = _rows(sql, tuple(params + params + ([category] if category else []) + [limit]))
    out = []
    for r in rows:
        r.pop("score")
        r["course_description"] = _trim(r["course_description"])
        out.append(_clean(r))
    return out


def get_course_details(course_number: str) -> list[dict]:
    """Get everything the catalog knows about one course: description, instructor, instructor bio,
    every section's days/times/room, units, session and syllabus link.

    Args:
        course_number: The course number, e.g. "MGT 409" (spacing and case don't matter).
    """
    norm = re.sub(r"\s+", "", course_number).upper()
    rows = _rows("SELECT * FROM courses WHERE REPLACE(UPPER(course_number), ' ', '') = ? ORDER BY section", (norm,))
    out = [_clean(r) for r in rows]
    for r in out[1:]:  # bios and descriptions repeat for every section; keep them once
        if r.get("faculty_bio") == out[0].get("faculty_bio"):
            r.pop("faculty_bio", None)
        if r.get("course_description") == out[0].get("course_description"):
            r.pop("course_description", None)
    return out


def courses_by_professor(name: str) -> list[dict]:
    """List the courses taught by a professor. Partial names work ("Zaman", "Tauhid Zaman").

    Args:
        name: Full or partial instructor name.
    """
    # the catalog stores "Last, First", so match each word on its own
    words = re.findall(r"[\w'-]+", name)[:3] or [""]
    where = " AND ".join("faculty_1 LIKE ?" for _ in words)
    sql = f"SELECT {SUMMARY_COLS} FROM courses WHERE {where} ORDER BY course_number, section"
    return [_clean(r) for r in _rows(sql, tuple(f"%{w}%" for w in words))]


def room_schedule(room: str) -> list[dict]:
    """List every class that meets in a room, with days and times. Rooms look like "EVANS 2200";
    a bare number like "2200" works too.

    Args:
        room: Room name or number.
    """
    return [_clean(r) for r in _rows(f"SELECT {SUMMARY_COLS} FROM courses WHERE room LIKE ? ORDER BY daytimes", (f"%{room.strip()}%",))]


def list_categories() -> list[dict]:
    """List the course categories in the catalog (Core, Finance, Marketing, ...) with how many
    sections each has. Useful before filtering search_courses by category."""
    return _rows("SELECT course_category AS category, COUNT(*) AS sections FROM courses WHERE course_category <> '' GROUP BY 1 ORDER BY 2 DESC")


TOOLS = [search_courses, get_course_details, courses_by_professor, room_schedule, list_categories]
