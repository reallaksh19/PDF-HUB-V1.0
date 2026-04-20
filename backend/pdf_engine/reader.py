import fitz
from pathlib import Path
from typing import List, Tuple
from .types import TextBlock, PdfRegion, PageInfo

def open_document(file_path: Path) -> fitz.Document:
    return fitz.open(str(file_path))

def get_page_info(doc: fitz.Document, page_num: int) -> PageInfo:
    """Gets page dimensions without extracting text."""
    page = doc.load_page(page_num)
    rect = page.rect
    return PageInfo(
        page_number=page_num + 1,
        width=rect.width,
        height=rect.height
    )

def get_page_image(doc: fitz.Document, page_num: int, dpi: int = 150) -> bytes:
    """Renders a page to a PNG byte string."""
    page = doc.load_page(page_num)
    pix = page.get_pixmap(dpi=dpi)
    return pix.tobytes("png")

def get_text_blocks(doc: fitz.Document, page_num: int) -> List[TextBlock]:
    """Extracts native text blocks using PyMuPDF."""
    page = doc.load_page(page_num)
    blocks = page.get_text("dict")["blocks"]
    text_blocks = []
    
    for idx, block in enumerate(blocks):
        if block["type"] != 0:  # Only text blocks (0), not images (1)
            continue
            
        text = ""
        for line in block["lines"]:
            for span in line["spans"]:
                text += span["text"] + " "
        text = text.strip()
        
        if not text:
            continue
            
        x0, y0, x1, y1 = block["bbox"]
        text_blocks.append(TextBlock(
            id=f"tb-p{page_num+1}-{idx}",
            text=text,
            rect=PdfRegion(x=x0, y=y0, width=x1-x0, height=y1-y0),
            confidence=1.0  # Native text is always 1.0
        ))
        
    return text_blocks
