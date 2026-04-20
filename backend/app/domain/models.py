from pydantic import BaseModel
from typing import Optional, Dict, Any

class PingResponse(BaseModel):
    status: str
    mode: str
    version: str

class ServerCapabilities(BaseModel):
    mode: str
    canOpenLocalFile: bool
    canMergeFiles: bool
    canSplitFile: bool
    canRunPreviewOcr: bool
    canRunServerOcr: bool
    canRunMacroApi: bool
    serverVersion: str
    serverLatencyMs: int | None = None

class FileUploadResponse(BaseModel):
    fileId: str
    pageCount: int
    metadata: Dict[str, Any]
