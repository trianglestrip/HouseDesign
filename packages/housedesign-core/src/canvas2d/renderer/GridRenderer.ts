import { Vec2 } from '../../core/geometry/Vec2';

export interface GridRenderOptions {
  color: string;
  size: number;
  lineWidth: number;
  showAxes?: boolean;
  axesColor?: string;
}

export class GridRenderer {
  private canvas: any;
  private options: GridRenderOptions;

  constructor(canvas: any, options: GridRenderOptions) {
    this.canvas = canvas;
    this.options = options;
  }

  render(viewport: { min: Vec2; max: Vec2 }): void {
    const { size, color, lineWidth } = this.options;
    
    const minX = Math.floor(viewport.min.x / size) * size;
    const maxX = Math.ceil(viewport.max.x / size) * size;
    const minY = Math.floor(viewport.min.y / size) * size;
    const maxY = Math.ceil(viewport.max.y / size) * size;
    
    for (let x = minX; x <= maxX; x += size) {
      this.drawLine(
        new Vec2(x, viewport.min.y),
        new Vec2(x, viewport.max.y),
        color,
        lineWidth
      );
    }
    
    for (let y = minY; y <= maxY; y += size) {
      this.drawLine(
        new Vec2(viewport.min.x, y),
        new Vec2(viewport.max.x, y),
        color,
        lineWidth
      );
    }
    
    if (this.options.showAxes) {
      const axesColor = this.options.axesColor || '#FF0000';
      this.drawLine(
        new Vec2(viewport.min.x, 0),
        new Vec2(viewport.max.x, 0),
        axesColor,
        lineWidth * 2
      );
      this.drawLine(
        new Vec2(0, viewport.min.y),
        new Vec2(0, viewport.max.y),
        axesColor,
        lineWidth * 2
      );
    }
  }

  private drawLine(start: Vec2, end: Vec2, color: string, width: number): void {
  }

  setOptions(options: Partial<GridRenderOptions>): void {
    this.options = { ...this.options, ...options };
  }

  getOptions(): GridRenderOptions {
    return { ...this.options };
  }
}
