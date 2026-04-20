from fastapi import APIRouter, UploadFile, File, HTTPException, status
from fastapi.responses import StreamingResponse
from io import BytesIO
from ..domain.models import FileUploadResponse
from ..config import settings
import storage.file_store as file_store
import pdf_engine.reader as reader

router = APIRouter()

MAX_SIZE_BYTES = settings.max_upload_mb * 1024 * 1024

@router.post("/api/files/upload", response_model=FileUploadResponse)
async def upload_file(file: UploadFile = File(...)):
    # Very basic size check if content-length is present
    if file.size and file.size > MAX_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Max size is {settings.max_upload_mb} MB"
        )
        
    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Only PDF files are supported"
        )
        
    file_id = await file_store.save_file(file)
    file_path = file_store.get_path(file_id)
    
    if not file_path:
        raise HTTPException(status_code=500, detail="Failed to save file")
        
    try:
        doc = reader.open_document(file_path)
        page_count = len(doc)
        metadata = doc.metadata or {}
        doc.close()
        
        return FileUploadResponse(
            fileId=file_id,
            pageCount=page_count,
            metadata=metadata
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid PDF file: {e}")
