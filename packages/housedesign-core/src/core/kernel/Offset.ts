import { Vec2 } from '../geometry/Vec2';
import { Line } from '../geometry/Line';

export interface OffsetResult {
  points: Vec2[];
  valid: boolean;
}

export class Offset {
  static offsetPolyline(
    points: Vec2[],
    distance: number,
    closed: boolean = false
  ): OffsetResult {
    if (points.length < 2) {
      return { points: [], valid: false };
    }
    
    const result: Vec2[] = [];
    const n = points.length;
    
    for (let i = 0; i < n; i++) {
      if (i === 0 && !closed) {
        const dir = Line.direction(points[0], points[1]);
        const normal = dir.perpendicular();
        result.push(points[0].add(normal.mul(distance)));
      } else if (i === n - 1 && !closed) {
        const dir = Line.direction(points[n - 2], points[n - 1]);
        const normal = dir.perpendicular();
        result.push(points[n - 1].add(normal.mul(distance)));
      } else {
        const prev = closed ? points[(i - 1 + n) % n] : points[i - 1];
        const curr = points[i];
        const next = closed ? points[(i + 1) % n] : points[i + 1];
        
        const dir1 = Line.direction(prev, curr);
        const dir2 = Line.direction(curr, next);
        const normal1 = dir1.perpendicular();
        const normal2 = dir2.perpendicular();
        
        const bisector = normal1.add(normal2).normalize();
        const cosHalfAngle = Math.abs(normal1.dot(bisector));
        const scale = distance / Math.max(cosHalfAngle, 0.1);
        
        result.push(curr.add(bisector.mul(scale)));
      }
    }
    
    return { points: result, valid: true };
  }

  static offsetSegment(
    start: Vec2,
    end: Vec2,
    distance: number
  ): [Vec2, Vec2] {
    const normal = Line.normal(start, end);
    return [
      start.add(normal.mul(distance)),
      end.add(normal.mul(distance))
    ];
  }
}
