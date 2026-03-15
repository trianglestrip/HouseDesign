/**
 * 3D 鼠标交互 - 预留
 * 纯 TypeScript，框架无关
 * 后续实现射线检测、拖拽旋转等
 */

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface MouseHandler3DOptions {
  /** 画布元素引用（可选） */
  canvas?: unknown;
}

export type MouseEvent3DType = 'down' | 'move' | 'up' | 'wheel';

export interface MouseEvent3D {
  type: MouseEvent3DType;
  x: number;
  y: number;
  delta?: number;
  button?: number;
}

export type MouseCallback3D = (event: MouseEvent3D) => void;

/**
 * 3D 鼠标事件处理器 - 占位
 */
export class MouseHandler3D {
  private readonly callbacks = new Map<MouseEvent3DType, Set<MouseCallback3D>>();

  constructor(_options: MouseHandler3DOptions = {}) {}

  on(type: MouseEvent3DType, callback: MouseCallback3D): () => void {
    if (!this.callbacks.has(type)) {
      this.callbacks.set(type, new Set());
    }
    this.callbacks.get(type)!.add(callback);
    return () => this.off(type, callback);
  }

  off(type: MouseEvent3DType, callback: MouseCallback3D): void {
    this.callbacks.get(type)?.delete(callback);
  }

  dispatch(type: MouseEvent3DType, x: number, y: number, delta?: number, button?: number): void {
    const event: MouseEvent3D = { type, x, y, delta, button };
    this.callbacks.get(type)?.forEach((cb) => cb(event));
  }
}
