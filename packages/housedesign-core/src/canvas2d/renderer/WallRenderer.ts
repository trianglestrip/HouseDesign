import { Wall2DRenderData } from '../adapters/Wall2DAdapter';
import { Vec2 } from '../../core/geometry/Vec2';

export interface WallRenderStyle {
  fillColor: string;
  centerLineColor: string;
  centerLineStyle: 'solid' | 'dashed';
  centerLineWidth: number;
  outlineColor: string;
  outlineWidth: number;
}

export class WallRenderer {
  private canvas: any;
  private style: WallRenderStyle;

  constructor(canvas: any, style: WallRenderStyle) {
    this.canvas = canvas;
    this.style = style;
  }

  render(renderData: Wall2DRenderData): void {
    this.drawPolygon(renderData.polygon, this.style.fillColor);
    
    this.drawLine(
      renderData.outline1[0],
      renderData.outline1[1],
      this.style.outlineColor,
      this.style.outlineWidth,
      'solid'
    );
    
    this.drawLine(
      renderData.outline2[0],
      renderData.outline2[1],
      this.style.outlineColor,
      this.style.outlineWidth,
      'solid'
    );
    
    this.drawLine(
      renderData.centerLine[0],
      renderData.centerLine[1],
      this.style.centerLineColor,
      this.style.centerLineWidth,
      this.style.centerLineStyle
    );
  }

  renderPreview(
    start: Vec2,
    end: Vec2,
    thickness: number,
    style?: Partial<WallRenderStyle>
  ): void {
    const renderStyle = { ...this.style, ...style };
    
    const direction = end.sub(start);
    const normal = direction.normalize().perpendicular();
    const halfThickness = thickness / 2;
    
    const outline1Start = start.add(normal.mul(halfThickness));
    const outline1End = end.add(normal.mul(halfThickness));
    const outline2Start = start.sub(normal.mul(halfThickness));
    const outline2End = end.sub(normal.mul(halfThickness));
    
    const polygon = [outline1Start, outline1End, outline2End, outline2Start];
    
    this.drawPolygon(polygon, renderStyle.fillColor, 0.5);
    
    this.drawLine(
      outline1Start,
      outline1End,
      renderStyle.outlineColor,
      renderStyle.outlineWidth,
      'solid',
      0.5
    );
    
    this.drawLine(
      outline2Start,
      outline2End,
      renderStyle.outlineColor,
      renderStyle.outlineWidth,
      'solid',
      0.5
    );
    
    this.drawLine(
      start,
      end,
      renderStyle.centerLineColor,
      renderStyle.centerLineWidth,
      'dashed',
      0.5
    );
  }

  private drawPolygon(vertices: Vec2[], fillColor: string, opacity: number = 1.0): void {
  }

  private drawLine(
    start: Vec2,
    end: Vec2,
    color: string,
    width: number,
    style: 'solid' | 'dashed',
    opacity: number = 1.0
  ): void {
  }

  setStyle(style: Partial<WallRenderStyle>): void {
    this.style = { ...this.style, ...style };
  }

  getStyle(): WallRenderStyle {
    return { ...this.style };
  }
}
