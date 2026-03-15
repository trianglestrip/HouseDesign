/**
 * 2D 鼠标交互
 * 纯 TypeScript，框架无关
 * 提供鼠标事件到逻辑坐标的转换及回调接口
 */

export interface Point2D {
  x: number;
  y: number;
}

export interface MouseHandler2DOptions {
  /** 画布偏移 X */
  offsetX?: number;
  /** 画布偏移 Y */
  offsetY?: number;
  /** 缩放比例 */
  scale?: number;
}

export type MouseEventType = 'down' | 'move' | 'up' | 'click';

export interface MouseEvent2D {
  type: MouseEventType;
  x: number;
  y: number;
  button?: number;
  originalEvent?: unknown;
}

export type MouseCallback = (event: MouseEvent2D) => void;

/**
 * 2D 鼠标事件处理器
 */
export class MouseHandler2D {
  private offsetX = 0;
  private offsetY = 0;
  private scale = 1;
  private readonly callbacks = new Map<MouseEventType, Set<MouseCallback>>();

  constructor(options: MouseHandler2DOptions = {}) {
    this.offsetX = options.offsetX ?? 0;
    this.offsetY = options.offsetY ?? 0;
    this.scale = options.scale ?? 1;
  }

  /** 将屏幕坐标转换为画布逻辑坐标 */
  screenToCanvas(clientX: number, clientY: number): Point2D {
    return {
      x: (clientX - this.offsetX) / this.scale,
      y: (clientY - this.offsetY) / this.scale,
    };
  }

  /** 将画布坐标转换为屏幕坐标 */
  canvasToScreen(x: number, y: number): Point2D {
    return {
      x: x * this.scale + this.offsetX,
      y: y * this.scale + this.offsetY,
    };
  }

  setOffset(x: number, y: number): void {
    this.offsetX = x;
    this.offsetY = y;
  }

  setScale(scale: number): void {
    this.scale = Math.max(0.01, scale);
  }

  /** 订阅鼠标事件 */
  on(type: MouseEventType, callback: MouseCallback): () => void {
    if (!this.callbacks.has(type)) {
      this.callbacks.set(type, new Set());
    }
    this.callbacks.get(type)!.add(callback);
    return () => this.off(type, callback);
  }

  /** 取消订阅 */
  off(type: MouseEventType, callback: MouseCallback): void {
    this.callbacks.get(type)?.delete(callback);
  }

  /** 分发事件（由外部在收到 DOM 事件时调用） */
  dispatch(type: MouseEventType, clientX: number, clientY: number, button?: number, originalEvent?: unknown): void {
    const { x, y } = this.screenToCanvas(clientX, clientY);
    const event: MouseEvent2D = { type, x, y, button, originalEvent };
    this.callbacks.get(type)?.forEach((cb) => cb(event));
  }
}
