from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse
from io import BytesIO
import storage.file_store as file_store
import pdf_engine.reader as reader

router = APIRouter()

@router.get("/api/files/{file_id}/pages/{page_num}")
async def get_page_image(file_id: str, page_num: int):
    file_path = file_store.get_path(file_id)
    if not file_path:
        raise HTTPException(status_code=404, detail="File not found")
        
    try:
        doc = reader.open_document(file_path)
        # Note: API page numbers are 1-indexed, internal are 0-indexed
        actual_page_num = page_num - 1
        
        if actual_page_num < 0 or actual_page_num >= len(doc):
            doc.close()
            raise HTTPException(status_code=404, detail="Page not found")
            
        img_bytes = reader.get_page_image(doc, actual_page_num)
        doc.close()
        
        return StreamingResponse(
            BytesIO(img_bytes),
            media_type="image/png"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to render page: {e}")
