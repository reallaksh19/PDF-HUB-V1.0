export type AnnotationType = 'textbox' | 'highlight' | 'underline' | 'shape' | 'freehand' | 'stamp' | 'comment';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PdfAnnotation {
  id: string;
  type: AnnotationType;
  pageNumber: number;
  rect: Rect;
  data: Record<string, unknown>; // Custom type-specific data e.g. text, color, points
  createdAt: number;
  updatedAt: number;
}
