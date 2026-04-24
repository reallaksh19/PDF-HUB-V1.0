export type AnnotationType =
  | 'textbox'
  | 'highlight'
  | 'underline'
  | 'strikeout'
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

export type ReviewStatus = 'open' | 'resolved' | 'rejected' | 'approved';

export interface CommentReply {
  id: string;
  author: string;
  content: string;
  createdAt: number;
}

export interface AnnotationData extends Record<string, unknown> {
  text?: string;
  title?: string;
  content?: string;

  backgroundColor?: string;
  fillColor?: string;
  borderColor?: string;
  strokeColor?: string;
  textColor?: string;
  borderWidth?: number;
  strokeWidth?: number;
  strokeStyle?: 'solid' | 'dashed' | 'dotted';
  opacity?: number;

  fontSize?: number;
  fontWeight?: 'normal' | 'bold' | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline' | 'line-through';
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  fontFamily?: string;

  rotation?: number;
  locked?: boolean;
  zIndex?: number;
  autoSize?: boolean;

  anchor?: Point2D;
  points?: number[];

  arrowHeadStart?: 'none' | 'open' | 'closed';
  arrowHeadEnd?: 'none' | 'open' | 'closed';

  // Review & Comment fields
  author?: string;
  replies?: CommentReply[];
  status?: ReviewStatus;
  assignee?: string;
  dueDate?: number;

  // Stamp presets
  stampType?: 'Approved' | 'Confidential' | 'Draft' | 'Final' | 'Completed' | 'Review note' | 'Revise' | 'Site verify' | 'Clash' | string;
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
