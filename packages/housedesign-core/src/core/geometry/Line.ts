import { Vec2 } from './Vec2';

export interface LineSegment {
  start: Vec2;
  end: Vec2;
}

export class Line {
  static distance(point: Vec2, lineStart: Vec2, lineEnd: Vec2): number {
    const line = lineEnd.sub(lineStart);
    const len = line.length();
    if (len === 0) return point.distance(lineStart);
    
    const t = Math.max(0, Math.min(1, point.sub(lineStart).dot(line) / (len * len)));
    const projection = lineStart.add(line.mul(t));
    return point.distance(projection);
  }

  static closestPoint(point: Vec2, lineStart: Vec2, lineEnd: Vec2): Vec2 {
    const line = lineEnd.sub(lineStart);
    const len = line.lengthSquared();
    if (len === 0) return lineStart.clone();
    
    const t = Math.max(0, Math.min(1, point.sub(lineStart).dot(line) / len));
    return lineStart.add(line.mul(t));
  }

  static intersection(
    a1: Vec2, a2: Vec2,
    b1: Vec2, b2: Vec2
  ): Vec2 | null {
    const d1 = a2.sub(a1);
    const d2 = b2.sub(b1);
    const cross = d1.cross(d2);
    
    if (Math.abs(cross) < 1e-10) return null;
    
    const t = b1.sub(a1).cross(d2) / cross;
    return a1.add(d1.mul(t));
  }

  static intersectionSegment(
    a1: Vec2, a2: Vec2,
    b1: Vec2, b2: Vec2
  ): Vec2 | null {
    const d1 = a2.sub(a1);
    const d2 = b2.sub(b1);
    const cross = d1.cross(d2);
    
    if (Math.abs(cross) < 1e-10) return null;
    
    const t1 = b1.sub(a1).cross(d2) / cross;
    const t2 = b1.sub(a1).cross(d1) / cross;
    
    if (t1 >= 0 && t1 <= 1 && t2 >= 0 && t2 <= 1) {
      return a1.add(d1.mul(t1));
    }
    
    return null;
  }

  static midpoint(start: Vec2, end: Vec2): Vec2 {
    return start.add(end).div(2);
  }

  static getLength(start: Vec2, end: Vec2): number {
    return end.sub(start).length();
  }

  static direction(start: Vec2, end: Vec2): Vec2 {
    return end.sub(start).normalize();
  }

  static normal(start: Vec2, end: Vec2): Vec2 {
    return end.sub(start).normalize().perpendicular();
  }

  static isParallel(
    a1: Vec2, a2: Vec2,
    b1: Vec2, b2: Vec2,
    epsilon: number = 1e-10
  ): boolean {
    const d1 = a2.sub(a1).normalize();
    const d2 = b2.sub(b1).normalize();
    return Math.abs(Math.abs(d1.dot(d2)) - 1) < epsilon;
  }

  static isPerpendicular(
    a1: Vec2, a2: Vec2,
    b1: Vec2, b2: Vec2,
    epsilon: number = 1e-10
  ): boolean {
    const d1 = a2.sub(a1).normalize();
    const d2 = b2.sub(b1).normalize();
    return Math.abs(d1.dot(d2)) < epsilon;
  }

  static offset(start: Vec2, end: Vec2, distance: number): LineSegment {
    const normal = Line.normal(start, end);
    return {
      start: start.add(normal.mul(distance)),
      end: end.add(normal.mul(distance))
    };
  }

  static extend(start: Vec2, end: Vec2, distance: number): LineSegment {
    const dir = Line.direction(start, end);
    return {
      start: start.sub(dir.mul(distance)),
      end: end.add(dir.mul(distance))
    };
  }
}
