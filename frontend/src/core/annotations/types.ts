export type AnnotationType =
  | 'textbox'
  | 'highlight'
  | 'underline'
  | 'rectangle'
  | 'ellipse'
  | 'freehand'
  | 'stamp'
  | 'comment'
  | 'line'
  | 'arrow'
  | 'callout';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Point2D {
  x: number;
  y: number;
}

export interface BaseAnnotationData extends Record<string, unknown> {
  rotation?: number;
  locked?: boolean;
  zIndex?: number;
  opacity?: number;
}

export interface TextStyleData {
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold' | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline' | 'line-through';
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  textColor?: string;
  lineHeight?: number;
}

export interface ShapeStyleData {
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  strokeStyle?: 'solid' | 'dashed' | 'dotted';
  cornerRadius?: number; // For rectangles
}

export interface TextboxData extends BaseAnnotationData, TextStyleData, ShapeStyleData {
  autoSize?: boolean;
}

export interface CalloutData extends TextboxData {
  anchor: Point2D;
}

export interface ShapeData extends BaseAnnotationData, ShapeStyleData {
  // Add specific shape properties here if needed in the future
}

export interface LineData extends BaseAnnotationData, ShapeStyleData {
  points?: number[]; // [x1, y1, x2, y2, ...]
}

export interface ArrowData extends LineData {
  arrowHeadStart?: 'none' | 'open' | 'closed';
  arrowHeadEnd?: 'none' | 'open' | 'closed';
}

export interface HighlightData extends BaseAnnotationData {
  color?: string; // e.g. #FFFF00
  blendMode?: 'multiply' | 'normal';
}

export interface StampData extends BaseAnnotationData {
  imageUrl?: string;
  stampType?: 'Approved' | 'Confidential' | 'Draft' | 'Final' | 'Completed' | string;
}

export type AnnotationData =
  | TextboxData
  | CalloutData
  | ShapeData
  | LineData
  | ArrowData
  | HighlightData
  | StampData
  | (BaseAnnotationData & Record<string, unknown>); // Fallback for migration/generic


export interface PdfAnnotation {
  id: string;
  type: AnnotationType;
  pageNumber: number;
  rect: Rect;
  data: AnnotationData;
  createdAt: number;
  updatedAt: number;
}
