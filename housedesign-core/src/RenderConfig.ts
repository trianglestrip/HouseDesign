/**
 * 渲染配置 - 所有视觉参数
 */

export interface ScaleConfig {
  pixelsPerMeter: number;  // 1米对应多少像素（例如：20 表示 1m = 20px，即 1cm = 2px）
  minZoom: number;         // 最小缩放倍数
  maxZoom: number;         // 最大缩放倍数
  zoomSpeed: number;       // 缩放速度
}

export interface CanvasConfig {
  defaultWidth: number;    // 默认画布宽度（毫米）
  defaultHeight: number;   // 默认画布高度（毫米）
}

export interface WallRenderConfig {
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  opacity: number;
  defaultThickness: number;  // 默认墙厚（毫米）
  defaultType: 'solid' | 'dashed' | 'double';  // 默认墙体类型
}

export interface EndpointRenderConfig {
  radius: number;
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  opacity: number;
  hoverOpacity: number;
}

export interface SnapConfig {
  endpointDistance: number;    // 端点吸附距离（毫米）
  gridDistance: number;        // 网格吸附距离（毫米）
  angleThreshold: number;      // 角度吸附阈值（度）
  lengthIncrement: number;     // 长度增量吸附（毫米）
  crosshairDistance: number;   // 十字准线吸附距离（毫米）
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
  showCenterLine: boolean;  // 是否显示中心线
}

export interface DimensionConfig {
  enabled: boolean;          // 是否显示尺寸标注
  lineColor: string;         // 标注线颜色
  textColor: string;         // 文字颜色
  backgroundColor: string;   // 文字背景色
  fontSize: number;          // 字体大小
  offsetDistance: number;    // 标注线偏移距离（像素）
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
  unit: 'mm' | 'cm' | 'm';   // 显示单位
}

export interface RenderConfig {
  scale: ScaleConfig;
  canvas: CanvasConfig;
  wall: WallRenderConfig;
  endpoint: EndpointRenderConfig;
  snap: SnapConfig;
  snapIndicator: SnapIndicatorConfig;
  previewLine: PreviewLineConfig;
  dimension: DimensionConfig;
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
    pixelsPerMeter: 20,  // 1米 = 20像素，即 1cm = 2像素
    minZoom: 0.1,
    maxZoom: 20,
    zoomSpeed: 0.001,
  },
  canvas: {
    defaultWidth: 10000,   // 10米 = 10000mm
    defaultHeight: 10000,  // 10米 = 10000mm
  },
  wall: {
    fillColor: '#d4c4b0',
    strokeColor: '#8b7355',
    strokeWidth: 2,
    opacity: 0.9,
    defaultThickness: 200,  // 200mm
    defaultType: 'solid',
  },
  endpoint: {
    radius: 6,
    fillColor: '#409EFF',
    strokeColor: '#fff',
    strokeWidth: 2,
    opacity: 0.8,
    hoverOpacity: 1.0,
  },
  snap: {
    endpointDistance: 100,      // 端点吸附距离 100mm (10cm)
    gridDistance: 50,           // 网格吸附距离 50mm (5cm)
    angleThreshold: 15,         // 角度吸附阈值 15度
    lengthIncrement: 50,        // 长度增量吸附 50mm (5cm)
    crosshairDistance: 20,      // 十字准线吸附 20mm (2cm)
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
    strokeDashArray: [8, 4],
    opacity: 0.7,
    showCenterLine: true,
  },
  dimension: {
    enabled: true,
    lineColor: '#ff6b00',
    textColor: '#ff6b00',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    offsetDistance: 30,
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
    unit: 'cm',
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
    canvas: { ...DEFAULT_RENDER_CONFIG.canvas, ...json.canvas },
    wall: { ...DEFAULT_RENDER_CONFIG.wall, ...json.wall },
    endpoint: { ...DEFAULT_RENDER_CONFIG.endpoint, ...json.endpoint },
    snap: { ...DEFAULT_RENDER_CONFIG.snap, ...json.snap },
    snapIndicator: { ...DEFAULT_RENDER_CONFIG.snapIndicator, ...json.snapIndicator },
    previewLine: { ...DEFAULT_RENDER_CONFIG.previewLine, ...json.previewLine },
    dimension: { ...DEFAULT_RENDER_CONFIG.dimension, ...json.dimension },
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
