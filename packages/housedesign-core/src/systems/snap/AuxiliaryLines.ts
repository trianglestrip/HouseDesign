import { Vec2 } from '../../core/geometry/Vec2';
import { AuxiliaryLine } from './SnapTypes';

export class AuxiliaryLineManager {
  private lines: Map<string, AuxiliaryLine> = new Map();

  addLine(id: string, line: AuxiliaryLine): void {
    this.lines.set(id, line);
  }

  removeLine(id: string): void {
    this.lines.delete(id);
  }

  clear(): void {
    this.lines.clear();
  }

  getAllLines(): AuxiliaryLine[] {
    return Array.from(this.lines.values());
  }

  createHorizontalLine(y: number, xMin: number, xMax: number): AuxiliaryLine {
    return {
      type: 'horizontal',
      start: new Vec2(xMin, y),
      end: new Vec2(xMax, y),
      style: {
        color: '#00FF00',
        dashArray: [5, 5],
        width: 1
      }
    };
  }

  createVerticalLine(x: number, yMin: number, yMax: number): AuxiliaryLine {
    return {
      type: 'vertical',
      start: new Vec2(x, yMin),
      end: new Vec2(x, yMax),
      style: {
        color: '#00FF00',
        dashArray: [5, 5],
        width: 1
      }
    };
  }

  createAngleLine(start: Vec2, end: Vec2, angle: number): AuxiliaryLine {
    const direction = end.sub(start).normalize().rotate(angle);
    const length = 1000;
    return {
      type: 'angle',
      start: start,
      end: start.add(direction.mul(length)),
      style: {
        color: '#FFA500',
        dashArray: [5, 5],
        width: 1
      }
    };
  }

  createExtensionLine(start: Vec2, end: Vec2): AuxiliaryLine {
    const direction = end.sub(start).normalize();
    const length = 1000;
    return {
      type: 'extension',
      start: end,
      end: end.add(direction.mul(length)),
      style: {
        color: '#0000FF',
        dashArray: [5, 5],
        width: 1
      }
    };
  }
}
