/**
 * 2D 绘制工具
 * 纯 TypeScript，提供绘制 API 接口
 * 实际渲染需传入 Canvas 2D 上下文或兼容实现
 */

import type { EditorElement } from '../Types';

/** 绘制上下文接口 - 兼容 CanvasRenderingContext2D */
export interface IDrawContext {
  fillStyle: string;
  strokeStyle: string;
  lineWidth: number;
  fillRect(x: number, y: number, w: number, h: number): void;
  strokeRect(x: number, y: number, w: number, h: number): void;
  beginPath(): void;
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  stroke(): void;
  fill(): void;
  clearRect(x: number, y: number, w: number, h: number): void;
}

export interface DrawTools2DOptions {
  selectionColor?: string;
  selectionLineWidth?: number;
}

/**
 * 2D 绘制工具
 */
export class DrawTools2D {
  private selectionColor: string;
  private selectionLineWidth: number;

  constructor(options: DrawTools2DOptions = {}) {
    this.selectionColor = options.selectionColor ?? '#2196F3';
    this.selectionLineWidth = options.selectionLineWidth ?? 2;
  }

  /** 绘制矩形元素 */
  drawRect(
    ctx: IDrawContext,
    element: EditorElement,
    fillColor = '#cccccc',
    strokeColor = '#333333'
  ): void {
    ctx.fillStyle = fillColor;
    ctx.strokeStyle = strokeColor;
    ctx.fillRect(element.x, element.y, element.width, element.height);
    ctx.strokeRect(element.x, element.y, element.width, element.height);
  }

  /** 绘制选中框 */
  drawSelection(ctx: IDrawContext, element: EditorElement): void {
    ctx.strokeStyle = this.selectionColor;
    ctx.lineWidth = this.selectionLineWidth;
    ctx.strokeRect(element.x, element.y, element.width, element.height);
  }

  /** 绘制线段（用于墙等） */
  drawLine(
    ctx: IDrawContext,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color = '#333333'
  ): void {
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  /** 清空区域 */
  clear(ctx: IDrawContext, x: number, y: number, w: number, h: number): void {
    ctx.clearRect(x, y, w, h);
  }
}
