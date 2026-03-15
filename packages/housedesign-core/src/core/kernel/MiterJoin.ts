import { Vec2 } from '../geometry/Vec2';
import { Line } from '../geometry/Line';

export interface MiterJoinResult {
  outerPoint: Vec2;
  innerPoint: Vec2;
  miterLength: number;
}

export class MiterJoin {
  static calculate(
    center: Vec2,
    direction1: Vec2,
    direction2: Vec2,
    thickness: number
  ): MiterJoinResult {
    const normal1 = direction1.perpendicular();
    const normal2 = direction2.perpendicular();
    const halfThickness = thickness / 2;
    
    const bisector = normal1.add(normal2).normalize();
    const cross = direction1.cross(direction2);
    
    if (Math.abs(cross) < 1e-10) {
      return {
        outerPoint: center.add(normal1.mul(halfThickness)),
        innerPoint: center.sub(normal1.mul(halfThickness)),
        miterLength: halfThickness
      };
    }
    
    const cosHalfAngle = Math.abs(normal1.dot(bisector));
    const miterLength = halfThickness / Math.max(cosHalfAngle, 0.1);
    
    let outerPoint: Vec2;
    let innerPoint: Vec2;
    
    if (cross > 0) {
      outerPoint = center.add(bisector.mul(miterLength));
      innerPoint = center.sub(bisector.mul(miterLength));
    } else {
      outerPoint = center.sub(bisector.mul(miterLength));
      innerPoint = center.add(bisector.mul(miterLength));
    }
    
    return { outerPoint, innerPoint, miterLength };
  }

  static calculateWithLimit(
    center: Vec2,
    direction1: Vec2,
    direction2: Vec2,
    thickness: number,
    miterLimit: number = 2.0
  ): MiterJoinResult {
    const result = this.calculate(center, direction1, direction2, thickness);
    
    if (result.miterLength > thickness * miterLimit) {
      const normal1 = direction1.perpendicular();
      const halfThickness = thickness / 2;
      
      return {
        outerPoint: center.add(normal1.mul(halfThickness)),
        innerPoint: center.sub(normal1.mul(halfThickness)),
        miterLength: halfThickness
      };
    }
    
    return result;
  }
}
