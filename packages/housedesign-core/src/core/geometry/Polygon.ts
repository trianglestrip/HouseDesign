import { Vec2 } from './Vec2';

export class Polygon {
  static area(vertices: Vec2[]): number {
    if (vertices.length < 3) return 0;
    
    let area = 0;
    for (let i = 0; i < vertices.length; i++) {
      const j = (i + 1) % vertices.length;
      area += vertices[i].x * vertices[j].y;
      area -= vertices[j].x * vertices[i].y;
    }
    return Math.abs(area) / 2;
  }

  static centroid(vertices: Vec2[]): Vec2 {
    if (vertices.length === 0) return Vec2.zero();
    
    let cx = 0, cy = 0;
    let area = 0;
    
    for (let i = 0; i < vertices.length; i++) {
      const j = (i + 1) % vertices.length;
      const cross = vertices[i].x * vertices[j].y - vertices[j].x * vertices[i].y;
      cx += (vertices[i].x + vertices[j].x) * cross;
      cy += (vertices[i].y + vertices[j].y) * cross;
      area += cross;
    }
    
    area /= 2;
    if (Math.abs(area) < 1e-10) {
      const sum = vertices.reduce((acc, v) => acc.add(v), Vec2.zero());
      return sum.div(vertices.length);
    }
    
    cx /= (6 * area);
    cy /= (6 * area);
    return new Vec2(cx, cy);
  }

  static contains(vertices: Vec2[], point: Vec2): boolean {
    if (vertices.length < 3) return false;
    
    let inside = false;
    for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
      const xi = vertices[i].x, yi = vertices[i].y;
      const xj = vertices[j].x, yj = vertices[j].y;
      
      const intersect = ((yi > point.y) !== (yj > point.y))
        && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  static isClockwise(vertices: Vec2[]): boolean {
    if (vertices.length < 3) return false;
    
    let sum = 0;
    for (let i = 0; i < vertices.length; i++) {
      const j = (i + 1) % vertices.length;
      sum += (vertices[j].x - vertices[i].x) * (vertices[j].y + vertices[i].y);
    }
    return sum > 0;
  }

  static reverse(vertices: Vec2[]): Vec2[] {
    return [...vertices].reverse();
  }

  static bounds(vertices: Vec2[]): { min: Vec2; max: Vec2 } {
    if (vertices.length === 0) {
      return { min: Vec2.zero(), max: Vec2.zero() };
    }
    
    let minX = vertices[0].x, minY = vertices[0].y;
    let maxX = vertices[0].x, maxY = vertices[0].y;
    
    for (let i = 1; i < vertices.length; i++) {
      minX = Math.min(minX, vertices[i].x);
      minY = Math.min(minY, vertices[i].y);
      maxX = Math.max(maxX, vertices[i].x);
      maxY = Math.max(maxY, vertices[i].y);
    }
    
    return {
      min: new Vec2(minX, minY),
      max: new Vec2(maxX, maxY)
    };
  }

  static simplify(vertices: Vec2[], tolerance: number = 1.0): Vec2[] {
    if (vertices.length < 3) return vertices;
    
    const result: Vec2[] = [vertices[0]];
    
    for (let i = 1; i < vertices.length - 1; i++) {
      const prev = result[result.length - 1];
      const curr = vertices[i];
      const next = vertices[i + 1];
      
      const d1 = curr.sub(prev);
      const d2 = next.sub(curr);
      
      if (d1.length() < tolerance || Math.abs(d1.cross(d2)) > tolerance) {
        result.push(curr);
      }
    }
    
    result.push(vertices[vertices.length - 1]);
    return result;
  }

  static offset(vertices: Vec2[], distance: number): Vec2[] {
    if (vertices.length < 2) return vertices;
    
    const result: Vec2[] = [];
    const n = vertices.length;
    
    for (let i = 0; i < n; i++) {
      const prev = vertices[(i - 1 + n) % n];
      const curr = vertices[i];
      const next = vertices[(i + 1) % n];
      
      const d1 = curr.sub(prev).normalize().perpendicular();
      const d2 = next.sub(curr).normalize().perpendicular();
      
      const bisector = d1.add(d2).normalize();
      const scale = distance / Math.max(d1.dot(bisector), 0.1);
      
      result.push(curr.add(bisector.mul(scale)));
    }
    
    return result;
  }
}
