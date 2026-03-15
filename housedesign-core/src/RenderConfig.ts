/**
 * 渲染配置 - 所有视觉参数
 */

export interface ScaleConfig {
  pixelsPerMeter: number;  // 1米对应多少像素（例如：5 表示 1m = 5px）
  minZoom: number;         // 最小缩放倍数
  maxZoom: number;         // 最大缩放倍数
  zoomSpeed: number;       // 缩放速度
}

export interface WallRenderConfig {
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  opacity: number;
  defaultThickness: number;  // 默认墙厚（毫米）
}

export interface EndpointRenderConfig {
  radius: number;
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  opacity: number;
  hoverOpacity: number;
}

export interface SnapIndicatorConfig {
  radius: number;
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  opacity: number;
}

export interface PreviewLineConfig {
  strokeColor: string;
  strokeWidth: number;
  strokeDashArray: number[];
  opacity: number;
}

export interface GridConfig {
  size: number;
  color: string;
  majorColor: string;        // 主网格线颜色（每5格）
  strokeWidth: number;
  majorStrokeWidth: number;  // 主网格线宽度
  majorInterval: number;     // 主网格线间隔（每几格）
}

export interface RulerConfig {
  width: number;             // 刻度尺宽度
  backgroundColor: string;   // 背景色
  textColor: string;         // 文字颜色
  lineColor: string;         // 刻度线颜色
  fontSize: number;          // 字体大小
}

export interface RenderConfig {
  scale: ScaleConfig;
  wall: WallRenderConfig;
  endpoint: EndpointRenderConfig;
  snapIndicator: SnapIndicatorConfig;
  previewLine: PreviewLineConfig;
  grid: GridConfig;
  ruler: RulerConfig;
  door: {
    fillColor: string;
    strokeColor: string;
    strokeWidth: number;
  };
  window: {
    fillColor: string;
    strokeColor: string;
    strokeWidth: number;
  };
  furniture: {
    fillColor: string;
    strokeColor: string;
    strokeWidth: number;
  };
}

/**
 * 默认渲染配置
 */
export const DEFAULT_RENDER_CONFIG: RenderConfig = {
  scale: {
    pixelsPerMeter: 5,  // 1米 = 5像素，即 200mm墙厚 = 1像素
    minZoom: 0.1,
    maxZoom: 20,
    zoomSpeed: 0.001,
  },
  wall: {
    fillColor: '#d4c4b0',
    strokeColor: '#8b7355',
    strokeWidth: 1,
    opacity: 0.9,
    defaultThickness: 200,  // 200mm
  },
  endpoint: {
    radius: 6,
    fillColor: '#409EFF',
    strokeColor: '#fff',
    strokeWidth: 2,
    opacity: 0.8,
    hoverOpacity: 1.0,
  },
  snapIndicator: {
    radius: 8,
    fillColor: '#409EFF',
    strokeColor: '#fff',
    strokeWidth: 2,
    opacity: 0.8,
  },
  previewLine: {
    strokeColor: '#409EFF',
    strokeWidth: 2,
    strokeDashArray: [10, 5],
    opacity: 0.6,
  },
  grid: {
    size: 20,
    color: '#e0e0e0',
    majorColor: '#b0b0b0',
    strokeWidth: 0.5,
    majorStrokeWidth: 1,
    majorInterval: 5,
  },
  ruler: {
    width: 30,
    backgroundColor: '#f5f5f5',
    textColor: '#333',
    lineColor: '#999',
    fontSize: 10,
  },
  door: {
    fillColor: '#c4a35a',
    strokeColor: '#333',
    strokeWidth: 1,
  },
  window: {
    fillColor: '#87ceeb',
    strokeColor: '#333',
    strokeWidth: 1,
  },
  furniture: {
    fillColor: '#A5D6A7',
    strokeColor: '#333',
    strokeWidth: 1,
  },
};

/**
 * 从 JSON 加载配置
 */
export function loadRenderConfig(json: Partial<RenderConfig>): RenderConfig {
  return {
    scale: { ...DEFAULT_RENDER_CONFIG.scale, ...json.scale },
    wall: { ...DEFAULT_RENDER_CONFIG.wall, ...json.wall },
    endpoint: { ...DEFAULT_RENDER_CONFIG.endpoint, ...json.endpoint },
    snapIndicator: { ...DEFAULT_RENDER_CONFIG.snapIndicator, ...json.snapIndicator },
    previewLine: { ...DEFAULT_RENDER_CONFIG.previewLine, ...json.previewLine },
    grid: { ...DEFAULT_RENDER_CONFIG.grid, ...json.grid },
    ruler: { ...DEFAULT_RENDER_CONFIG.ruler, ...json.ruler },
    door: { ...DEFAULT_RENDER_CONFIG.door, ...json.door },
    window: { ...DEFAULT_RENDER_CONFIG.window, ...json.window },
    furniture: { ...DEFAULT_RENDER_CONFIG.furniture, ...json.furniture },
  };
}

/**
 * 将毫米转换为像素
 */
export function mmToPixels(mm: number, config: RenderConfig): number {
  return (mm / 1000) * config.scale.pixelsPerMeter;
}

/**
 * 将像素转换为毫米
 */
export function pixelsToMm(pixels: number, config: RenderConfig): number {
  return (pixels / config.scale.pixelsPerMeter) * 1000;
}

/**
 * 保存配置为 JSON
 */
export function saveRenderConfig(config: RenderConfig): string {
  return JSON.stringify(config, null, 2);
}
