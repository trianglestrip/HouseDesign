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
    highlightColor: string;
    highlightRadius: number;
  };
  grid: {
    color: string;
    size: number;
    lineWidth: number;
    showAxes: boolean;
    axesColor: string;
  };
  snap: {
    highlightColor: string;
    auxiliaryLineColor: string;
    auxiliaryLineDash: number[];
    tolerance: number;
  };
  room: {
    fillColor: string;
    fillOpacity: number;
    strokeColor: string;
    strokeWidth: number;
    labelColor: string;
    labelSize: number;
  };
}

export const defaultRenderConfig: RenderConfig = {
  wall: {
    fillColor: '#E8E8E8',
    centerLineColor: '#FF0000',
    centerLineStyle: 'dashed',
    centerLineWidth: 1,
    outlineColor: '#000000',
    outlineWidth: 2
  },
  node: {
    radius: 5,
    fillColor: '#0066FF',
    strokeColor: '#FFFFFF',
    strokeWidth: 2,
    highlightColor: '#00FF00',
    highlightRadius: 7
  },
  grid: {
    color: '#CCCCCC',
    size: 100,
    lineWidth: 0.5,
    showAxes: true,
    axesColor: '#999999'
  },
  snap: {
    highlightColor: '#00FF00',
    auxiliaryLineColor: '#00FF00',
    auxiliaryLineDash: [5, 5],
    tolerance: 10
  },
  room: {
    fillColor: '#F0F0F0',
    fillOpacity: 0.3,
    strokeColor: '#666666',
    strokeWidth: 1,
    labelColor: '#333333',
    labelSize: 14
  }
};

export function mergeRenderConfig(
  defaultConfig: RenderConfig,
  customConfig: Partial<RenderConfig>
): RenderConfig {
  return {
    wall: { ...defaultConfig.wall, ...customConfig.wall },
    node: { ...defaultConfig.node, ...customConfig.node },
    grid: { ...defaultConfig.grid, ...customConfig.grid },
    snap: { ...defaultConfig.snap, ...customConfig.snap },
    room: { ...defaultConfig.room, ...customConfig.room }
  };
}
