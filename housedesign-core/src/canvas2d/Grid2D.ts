/**
 * 2D 网格吸附
 * 纯 TypeScript，框架无关
 */

export interface Grid2DOptions {
  /** 网格大小（像素） */
  size?: number;
  /** 是否启用吸附 */
  enabled?: boolean;
}

/**
 * 2D 网格吸附工具
 */
export class Grid2D {
  private size: number;
  private enabled: boolean;

  constructor(options: Grid2DOptions = {}) {
    this.size = options.size ?? 10;
    this.enabled = options.enabled ?? true;
  }

  /** 吸附坐标到网格 */
  snap(x: number, y: number): { x: number; y: number } {
    if (!this.enabled) return { x, y };
    return {
      x: Math.round(x / this.size) * this.size,
      y: Math.round(y / this.size) * this.size,
    };
  }

  /** 吸附单个值 */
  snapValue(value: number): number {
    if (!this.enabled) return value;
    return Math.round(value / this.size) * this.size;
  }

  setSize(size: number): void {
    this.size = Math.max(1, size);
  }

  getSize(): number {
    return this.size;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}
