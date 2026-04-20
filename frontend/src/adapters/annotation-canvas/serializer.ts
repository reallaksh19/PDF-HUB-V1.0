import { PdfAnnotation, AnnotationType } from '@/core/annotations/types';

/**
 * Bidirectional serialization between Konva format and domain PdfAnnotation format.
 */
export const deserializeKonvaNodeToAnnotation = (nodeAttrs: any, className: string): Omit<PdfAnnotation, 'id' | 'pageNumber' | 'createdAt' | 'updatedAt'> => {
  let type: AnnotationType = 'shape';
  if (className === 'Text') type = 'textbox';
  if (className === 'Line') type = 'freehand';
  if (className === 'Rect') type = nodeAttrs.name === 'highlight' ? 'highlight' : 'shape';

  return {
    type,
    rect: {
      x: nodeAttrs.x || 0,
      y: nodeAttrs.y || 0,
      width: nodeAttrs.width || 100,
      height: nodeAttrs.height || 100
    },
    data: { ...nodeAttrs } // save all raw attrs
  };
};

export const serializeAnnotationToKonvaConfig = (annotation: PdfAnnotation) => {
  return {
    ...annotation.data,
    id: annotation.id,
    name: annotation.type,
    x: annotation.rect.x,
    y: annotation.rect.y,
    width: annotation.rect.width,
    height: annotation.rect.height,
  };
};
