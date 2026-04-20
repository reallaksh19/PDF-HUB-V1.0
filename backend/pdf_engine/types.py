from pydantic import BaseModel
from typing import List

class PdfRegion(BaseModel):
    x: float
    y: float
    width: float
    height: float

class TextBlock(BaseModel):
    id: str
    text: str
    rect: PdfRegion
    confidence: float
    type: str = "text"

class PageInfo(BaseModel):
    page_number: int
    width: float
    height: float
    text_blocks: List[TextBlock] = []
