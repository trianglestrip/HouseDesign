/**
 * 2D 渲染器
 * 纯 TypeScript，框架无关
 * 依赖 Canvas 2D 上下文接口，可在浏览器或 Node.js（需 node-canvas）中运行
 */

import type { EditorElement } from '../Types';
import { DrawTools2D, type IDrawContext } from './DrawTools2D';
import { Grid2D } from './Grid2D';

export interface Renderer2DOptions {
  /** 网格大小 */
  gridSize?: number;
  /** 是否显示网格 */
  showGrid?: boolean;
  /** 网格颜色 */
  gridColor?: string;
}

/**
 * 2D 渲染器
 */
export class Renderer2D {
  private readonly drawTools = new DrawTools2D();
  private readonly grid = new Grid2D();
  private showGrid = true;
  private gridColor = '#e0e0e0';

  constructor(options: Renderer2DOptions = {}) {
    if (options.gridSize) this.grid.setSize(options.gridSize);
    this.showGrid = options.showGrid ?? true;
    this.gridColor = options.gridColor ?? '#e0e0e0';
  }

  /** 渲染所有元素 */
  render(
    ctx: IDrawContext,
    elements: EditorElement[],
    selection: string[],
    width: number,
    height: number
  ): void {
    this.clear(ctx, 0, 0, width, height);
    if (this.showGrid) {
      this.drawGrid(ctx, width, height);
    }
    elements.forEach((el) => this.drawElement(ctx, el, selection.includes(el.id)));
  }

  /** 清空画布 */
  clear(ctx: IDrawContext, x: number, y: number, w: number, h: number): void {
    this.drawTools.clear(ctx, x, y, w, h);
  }

  /** 绘制网格 */
  private drawGrid(ctx: IDrawContext, width: number, height: number): void {
    const size = this.grid.getSize();
    const origStroke = ctx.strokeStyle;
    ctx.strokeStyle = this.gridColor;
    ctx.lineWidth = 1;
    for (let x = 0; x <= width; x += size) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += size) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.strokeStyle = origStroke;
  }

  /** 绘制单个元素 */
  private drawElement(
    ctx: IDrawContext,
    element: EditorElement,
    selected: boolean
  ): void {
    const colors: Record<string, string> = {
      wall: '#8D6E63',
      door: '#795548',
      window: '#90CAF9',
      furniture: '#A5D6A7',
      room: '#E1BEE7',
    };
    const fill = colors[element.type] ?? '#cccccc';
    this.drawTools.drawRect(ctx, element, fill, '#333333');
    if (selected) {
      this.drawTools.drawSelection(ctx, element);
    }
  }

  getGrid(): Grid2D {
    return this.grid;
  }

  getDrawTools(): DrawTools2D {
    return this.drawTools;
  }
}
