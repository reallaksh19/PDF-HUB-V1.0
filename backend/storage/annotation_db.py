import aiosqlite
import json
from pathlib import Path

DB_PATH = Path("storage/annotations.db")

async def init_db():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS annotations (
                id TEXT PRIMARY KEY,
                file_id TEXT NOT NULL,
                page INTEGER NOT NULL,
                type TEXT NOT NULL,
                data_json TEXT NOT NULL
            )
        """)
        await db.commit()

async def get_annotations(file_id: str):
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT * FROM annotations WHERE file_id = ?", (file_id,)) as cursor:
            rows = await cursor.fetchall()
            return [json.loads(row["data_json"]) for row in rows]

async def save_annotations(file_id: str, annotations: list[dict]):
    async with aiosqlite.connect(DB_PATH) as db:
        # For simplicity, replace all annotations for this file
        await db.execute("DELETE FROM annotations WHERE file_id = ?", (file_id,))
        for ann in annotations:
            await db.execute(
                "INSERT INTO annotations (id, file_id, page, type, data_json) VALUES (?, ?, ?, ?, ?)",
                (ann["id"], file_id, ann["pageNumber"], ann["type"], json.dumps(ann))
            )
        await db.commit()
