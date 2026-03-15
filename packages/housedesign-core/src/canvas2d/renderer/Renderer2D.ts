import { Vec2 } from '../../core/geometry/Vec2';

export interface RenderConfig {
  wall: {
    fillColor: string;
    centerLineColor: string;
    centerLineStyle: 'solid' | 'dashed';
    centerLineWidth: number;
    outlineColor: string;
    outlineWidth: number;
  };
  node: {
    radius: number;
    fillColor: string;
    strokeColor: string;
    strokeWidth: number;
  };
  grid: {
    color: string;
    size: number;
    lineWidth: number;
  };
  snap: {
    highlightColor: string;
    auxiliaryLineColor: string;
  };
}

export interface IRenderer2D {
  clear(): void;
  render(): void;
  setConfig(config: Partial<RenderConfig>): void;
  getConfig(): RenderConfig;
}

export abstract class Renderer2D implements IRenderer2D {
  protected config: RenderConfig;
  protected canvas: any;

  constructor(canvas: any, config: RenderConfig) {
    this.canvas = canvas;
    this.config = config;
  }

  abstract clear(): void;
  abstract render(): void;

  setConfig(config: Partial<RenderConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): RenderConfig {
    return { ...this.config };
  }

  protected worldToScreen(point: Vec2): Vec2 {
    return point;
  }

  protected screenToWorld(point: Vec2): Vec2 {
    return point;
  }
}
