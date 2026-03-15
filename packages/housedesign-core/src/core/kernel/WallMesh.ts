import { Vec2 } from '../geometry/Vec2';
import { Line } from '../geometry/Line';

export interface WallMeshData {
  centerLine: [Vec2, Vec2];
  outline1: [Vec2, Vec2];
  outline2: [Vec2, Vec2];
  polygon: Vec2[];
}

export function generateWallMesh(
  centerStart: Vec2,
  centerEnd: Vec2,
  thickness: number
): WallMeshData {
  const normal = Line.normal(centerStart, centerEnd);
  const halfThickness = thickness / 2;
  
  const outline1Start = centerStart.add(normal.mul(halfThickness));
  const outline1End = centerEnd.add(normal.mul(halfThickness));
  
  const outline2Start = centerStart.sub(normal.mul(halfThickness));
  const outline2End = centerEnd.sub(normal.mul(halfThickness));
  
  return {
    centerLine: [centerStart, centerEnd],
    outline1: [outline1Start, outline1End],
    outline2: [outline2Start, outline2End],
    polygon: [outline1Start, outline1End, outline2End, outline2Start]
  };
}

export function generateWallMeshWithMiter(
  centerStart: Vec2,
  centerEnd: Vec2,
  thickness: number,
  prevDirection?: Vec2,
  nextDirection?: Vec2
): WallMeshData {
  const normal = Line.normal(centerStart, centerEnd);
  const halfThickness = thickness / 2;
  
  let outline1Start = centerStart.add(normal.mul(halfThickness));
  let outline1End = centerEnd.add(normal.mul(halfThickness));
  let outline2Start = centerStart.sub(normal.mul(halfThickness));
  let outline2End = centerEnd.sub(normal.mul(halfThickness));
  
  if (prevDirection) {
    const prevNormal = prevDirection.perpendicular();
    const miterStart = calculateMiterPoint(
      centerStart,
      normal,
      prevNormal,
      halfThickness
    );
    if (miterStart) {
      outline1Start = miterStart.outer;
      outline2Start = miterStart.inner;
    }
  }
  
  if (nextDirection) {
    const nextNormal = nextDirection.perpendicular();
    const miterEnd = calculateMiterPoint(
      centerEnd,
      normal,
      nextNormal,
      halfThickness
    );
    if (miterEnd) {
      outline1End = miterEnd.outer;
      outline2End = miterEnd.inner;
    }
  }
  
  return {
    centerLine: [centerStart, centerEnd],
    outline1: [outline1Start, outline1End],
    outline2: [outline2Start, outline2End],
    polygon: [outline1Start, outline1End, outline2End, outline2Start]
  };
}

function calculateMiterPoint(
  center: Vec2,
  normal1: Vec2,
  normal2: Vec2,
  halfThickness: number
): { outer: Vec2; inner: Vec2 } | null {
  const bisector = normal1.add(normal2).normalize();
  const cross = normal1.cross(normal2);
  
  if (Math.abs(cross) < 1e-10) {
    return {
      outer: center.add(normal1.mul(halfThickness)),
      inner: center.sub(normal1.mul(halfThickness))
    };
  }
  
  const scale = halfThickness / Math.max(Math.abs(normal1.dot(bisector)), 0.1);
  
  if (cross > 0) {
    return {
      outer: center.add(bisector.mul(scale)),
      inner: center.sub(bisector.mul(scale))
    };
  } else {
    return {
      outer: center.sub(bisector.mul(scale)),
      inner: center.add(bisector.mul(scale))
    };
  }
}
