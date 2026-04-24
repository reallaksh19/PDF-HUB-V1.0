import Konva from 'konva';
import type { PdfAnnotation } from '@/core/annotations/types';
import { deserializeKonvaNodeToAnnotation, serializeAnnotationToKonvaConfig } from './serializer';

interface SerializedKonvaChild {
  attrs: Record<string, unknown> & { id: string };
  className: string;
}

interface SerializedKonvaLayer {
  children: SerializedKonvaChild[];
}

export class KonvaAdapter {
  private stage: Konva.Stage | null = null;
  private layer: Konva.Layer | null = null;

  initStage(container: HTMLDivElement, width: number, height: number): Konva.Stage {
    this.stage = new Konva.Stage({
      container,
      width,
      height,
    });

    this.layer = new Konva.Layer();
    this.stage.add(this.layer);

    // Prevent the default scrolling behavior when interacting with canvas
    container.style.touchAction = 'none';

    return this.stage;
  }

  addObject(annotation: PdfAnnotation): Konva.Shape | null {
    if (!this.layer) return null;

    let node: Konva.Shape;
    const config = serializeAnnotationToKonvaConfig(annotation);

    // Choose correct Konva Node based on the annotation type
    switch (annotation.type) {
      case 'textbox':
        node = new Konva.Text({ ...config, text: annotation.data.text as string || 'Text', fill: 'black', fontSize: 16 });
        break;
      case 'highlight':
        node = new Konva.Rect({ ...config, fill: 'yellow', opacity: 0.4 });
        break;
      case 'rectangle':
        node = new Konva.Rect({ ...config, stroke: 'red', strokeWidth: 2 });
        break;
      case 'ellipse':
        node = new Konva.Ellipse({
          ...config,
          x: config.x + config.width / 2,
          y: config.y + config.height / 2,
          radiusX: config.width / 2,
          radiusY: config.height / 2,
          stroke: 'red',
          strokeWidth: 2
        });
        break;
      case 'freehand':
        node = new Konva.Line({ ...config, points: annotation.data.points as number[], stroke: 'black', strokeWidth: 2, tension: 0.5 });
        break;
      default:
        node = new Konva.Rect({ ...config, fill: 'gray', opacity: 0.5 });
        break;
    }

    // Add draggable capability for editor mode
    node.draggable(true);

    this.layer.add(node);
    this.layer.draw();
    return node;
  }

  removeObject(id: string): void {
    if (!this.layer) return;
    const node = this.layer.findOne(`#${id}`);
    if (node) {
      node.destroy();
      this.layer.draw();
    }
  }

  serialize(pageNumber: number): PdfAnnotation[] {
    if (!this.layer) return [];

    // Konva.Layer().toJSON() provides children
    const layerJSON = JSON.parse(this.layer.toJSON()) as SerializedKonvaLayer;
    const annotations: PdfAnnotation[] = layerJSON.children.map((child) => {
      const { attrs, className } = child;
      const baseObj = deserializeKonvaNodeToAnnotation(attrs, className);
      return {
        ...baseObj,
        id: attrs.id,
        pageNumber,
        createdAt: Date.now(),
        updatedAt: Date.now()
      } as PdfAnnotation;
    });

    return annotations;
  }

  deserialize(annotations: PdfAnnotation[]): void {
    if (!this.layer) return;
    this.layer.destroyChildren(); // clear
    annotations.forEach(ann => this.addObject(ann));
    this.layer.draw();
  }
}
