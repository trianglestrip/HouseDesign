import { Vec2 } from '../../core/geometry/Vec2';

export enum SnapType {
  None = 'none',
  Endpoint = 'endpoint',
  Midpoint = 'midpoint',
  Horizontal = 'horizontal',
  Vertical = 'vertical',
  Angle = 'angle',
  Grid = 'grid',
  LengthIncrement = 'length_increment',
  CrosshairAlign = 'crosshair_align',
  Perpendicular = 'perpendicular',
  Parallel = 'parallel'
}

export interface SnapResult {
  type: SnapType;
  position: Vec2;
  targetId?: string;
  auxiliaryLines?: AuxiliaryLine[];
  message?: string;
}

export interface AuxiliaryLine {
  type: 'horizontal' | 'vertical' | 'angle' | 'extension';
  start: Vec2;
  end: Vec2;
  style?: {
    color?: string;
    dashArray?: number[];
    width?: number;
  };
}

export interface SnapConfig {
  enabled: boolean;
  tolerance: number;
  gridSize: number;
  lengthIncrement: number;
  angleIncrement: number;
  enabledTypes: Set<SnapType>;
}

export const defaultSnapConfig: SnapConfig = {
  enabled: true,
  tolerance: 10,
  gridSize: 100,
  lengthIncrement: 100,
  angleIncrement: 15,
  enabledTypes: new Set([
    SnapType.Endpoint,
    SnapType.Midpoint,
    SnapType.Horizontal,
    SnapType.Vertical,
    SnapType.Grid,
    SnapType.LengthIncrement
  ])
};
