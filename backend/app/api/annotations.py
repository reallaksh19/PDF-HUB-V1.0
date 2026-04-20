from fastapi import APIRouter, HTTPException, Body
from typing import Any, List, Dict
import storage.annotation_db as annotation_db

router = APIRouter()

@router.get("/api/files/{file_id}/annotations", response_model=List[Dict[str, Any]])
async def get_file_annotations(file_id: str):
    try:
        anns = await annotation_db.get_annotations(file_id)
        return anns
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/api/files/{file_id}/annotations")
async def update_file_annotations(file_id: str, annotations: List[Dict[str, Any]] = Body(...)):
    try:
        await annotation_db.save_annotations(file_id, annotations)
        return {"status": "ok", "saved": len(annotations)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
