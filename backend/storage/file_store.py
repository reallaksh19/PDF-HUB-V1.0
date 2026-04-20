import os
import uuid
import shutil
from pathlib import Path
from datetime import datetime, timedelta
from fastapi import UploadFile
from app.config import settings

# Base storage directory
TMP_DIR = Path("storage/tmp")

async def save_file(file: UploadFile) -> str:
    """Saves an uploaded file to a UUID-based directory and returns the UUID."""
    file_id = str(uuid.uuid4())
    target_dir = TMP_DIR / file_id
    target_dir.mkdir(parents=True, exist_ok=True)
    
    # Secure filename
    original_name = Path(file.filename or "upload.pdf").name
    target_path = target_dir / original_name
    
    # Stream write
    with open(target_path, "wb") as buffer:
        while chunk := await file.read(1024 * 1024):  # 1MB chunks
            buffer.write(chunk)
            
    return file_id

def get_path(file_id: str) -> Path | None:
    """Returns the full path to the PDF file inside the given file_id folder, or None."""
    target_dir = TMP_DIR / file_id
    if not target_dir.exists() or not target_dir.is_dir():
        return None
        
    for item in target_dir.iterdir():
        if item.is_file() and item.suffix.lower() == ".pdf":
            return item
            
    return None

async def cleanup_expired(ttl_hours: int = settings.tmp_ttl_hours):
    """Called once on server startup. Removes folders older than TTL."""
    if not TMP_DIR.exists():
        return
        
    cutoff_time = datetime.now() - timedelta(hours=ttl_hours)
    count = 0
    
    for item in TMP_DIR.iterdir():
        if item.is_dir():
            mtime = datetime.fromtimestamp(item.stat().st_mtime)
            if mtime < cutoff_time:
                try:
                    shutil.rmtree(item)
                    count += 1
                except Exception as e:
                    print(f"[file_store] Failed to remove {item}: {e}")
                    
    print(f"[file_store] Cleanup complete. Removed {count} expired temp files.")
