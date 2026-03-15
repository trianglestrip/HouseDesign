import { Node } from '../../core/topology/Node';
import { Vec2 } from '../../core/geometry/Vec2';

export interface NodeRenderStyle {
  radius: number;
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  highlightColor?: string;
  highlightRadius?: number;
}

export class NodeRenderer {
  private canvas: any;
  private style: NodeRenderStyle;

  constructor(canvas: any, style: NodeRenderStyle) {
    this.canvas = canvas;
    this.style = style;
  }

  render(node: Node, highlighted: boolean = false): void {
    const radius = highlighted && this.style.highlightRadius 
      ? this.style.highlightRadius 
      : this.style.radius;
    
    const fillColor = highlighted && this.style.highlightColor 
      ? this.style.highlightColor 
      : this.style.fillColor;
    
    this.drawCircle(
      node.position,
      radius,
      fillColor,
      this.style.strokeColor,
      this.style.strokeWidth
    );
  }

  renderPreview(position: Vec2, style?: Partial<NodeRenderStyle>): void {
    const renderStyle = { ...this.style, ...style };
    this.drawCircle(
      position,
      renderStyle.radius,
      renderStyle.fillColor,
      renderStyle.strokeColor,
      renderStyle.strokeWidth,
      0.7
    );
  }

  private drawCircle(
    center: Vec2,
    radius: number,
    fillColor: string,
    strokeColor: string,
    strokeWidth: number,
    opacity: number = 1.0
  ): void {
  }

  setStyle(style: Partial<NodeRenderStyle>): void {
    this.style = { ...this.style, ...style };
  }

  getStyle(): NodeRenderStyle {
    return { ...this.style };
  }
}
