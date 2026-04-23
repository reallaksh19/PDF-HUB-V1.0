export type AnnotationType =
  | 'textbox'
  | 'highlight'
  | 'underline'
  | 'strikeout'
  | 'shape'
  | 'freehand'
  | 'stamp'
  | 'sticky-note'
  | 'comment'
  | 'line'
  | 'arrow'
  | 'callout';

export type ReviewStatus = 'open' | 'resolved' | 'rejected';

export interface AnnotationStyle {
  stroke?: string;
  fill?: string;
  textColor?: string;
  strokeWidth?: number;
  opacity?: number;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  textAlign?: 'left' | 'center' | 'right';
}

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

export interface AnnotationData extends Record<string, unknown> {
  text?: string;
  title?: string;
  content?: string;

  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  borderWidth?: number;
  opacity?: number;

  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  textAlign?: 'left' | 'center' | 'right';

  rotation?: number;
  locked?: boolean;
  zIndex?: number;
  autoSize?: boolean;

  anchor?: Point2D;
  points?: number[];

  calloutAnchor?: Point2D;
  stampPreset?: 'APPROVED' | 'REJECTED' | 'DRAFT';

  reviewStatus?: ReviewStatus;
  style?: AnnotationStyle;
}

export interface PdfAnnotation {
  id: string;
  type: AnnotationType;
  pageNumber: number;
  rect: Rect;
  data: AnnotationData;
  createdAt: number;
  updatedAt: number;
}
