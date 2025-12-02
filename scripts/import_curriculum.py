#!/usr/bin/env python3
"""
Import a structured English curriculum JSON file into the local SQLite database.

Usage:
    python scripts/import_curriculum.py --file data/curriculum_product_comm.json --replace
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from typing import Any, Dict, List

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from app.core.config import settings  # type: ignore # pylint: disable=wrong-import-position
from app.models.database import get_db_connection  # type: ignore  # pylint: disable=wrong-import-position


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Import curriculum JSON into learning.db")
    parser.add_argument(
        "--file",
        default=os.path.join(settings.DATA_DIR, "curriculum_product_comm.json"),
        help="Path to the curriculum JSON file",
    )
    parser.add_argument(
        "--replace",
        action="store_true",
        help="If the course title already exists, delete and re-import it.",
    )
    return parser.parse_args()


def load_curriculum(path: str) -> Dict[str, Any]:
    if not os.path.exists(path):
        raise FileNotFoundError(f"Curriculum file not found: {path}")
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def render_lesson_content(lesson: Dict[str, Any]) -> str:
    """Convert structured lesson info into markdown text for the lesson content field."""
    lines: List[str] = [
        f"# {lesson.get('title', '').strip()}",
        f"**Focus:** {lesson.get('focus', '')}",
        f"**Communication goal:** {lesson.get('communication_goal', '')}",
    ]

    if lesson.get("input_clip"):
        lines.append("> Input clip: " + lesson["input_clip"])

    if blocks := lesson.get("language_blocks"):
        lines.append("## Language Blocks")
        lines += [f"- {block}" for block in blocks]

    if activities := lesson.get("activities"):
        lines.append("## Activities")
        for activity in activities:
            lines.append(f"- **{activity.get('type', 'Activity')}**: {activity.get('description', '')}")

    if assessment := lesson.get("assessment"):
        lines.append("## Assessment")
        lines.append(assessment)

    if homework := lesson.get("homework"):
        lines.append("## Homework")
        lines.append(homework)

    return "\n".join([line for line in lines if line])


def import_curriculum(data: Dict[str, Any], replace: bool = False) -> int:
    conn = get_db_connection()
    cursor = conn.cursor()
    title = data["title"]

    existing = cursor.execute("SELECT id FROM courses WHERE title = ?", (title,)).fetchone()
    if existing:
        if not replace:
            conn.close()
            raise ValueError(f"Course '{title}' already exists. Use --replace to overwrite.")
        course_id = existing["id"]
        cursor.execute("DELETE FROM lessons WHERE course_id = ?", (course_id,))
        cursor.execute("DELETE FROM courses WHERE id = ?", (course_id,))
        conn.commit()

    cursor.execute(
        "INSERT INTO courses (title, description, source_url) VALUES (?, ?, ?)",
        (
            title,
            data.get("description"),
            data.get("source"),
        ),
    )
    course_id = cursor.lastrowid

    lessons = data.get("lessons", [])
    for lesson in lessons:
        content = render_lesson_content(lesson)
        cursor.execute(
            "INSERT INTO lessons (course_id, title, content) VALUES (?, ?, ?)",
            (course_id, lesson.get("title"), content),
        )

    conn.commit()
    conn.close()
    return int(course_id)


def main() -> None:
    args = parse_args()
    curriculum = load_curriculum(args.file)
    course_id = import_curriculum(curriculum, replace=args.replace)
    print(
        f"Imported course '{curriculum['title']}' with {len(curriculum.get('lessons', []))} lessons "
        f"into database {settings.DB_PATH}. (course_id={course_id})"
    )


if __name__ == "__main__":
    main()
