import { Vec2 } from '../geometry/Vec2';
import { Line } from '../geometry/Line';

export interface TrimResult {
  trimmed: boolean;
  newStart?: Vec2;
  newEnd?: Vec2;
}

export class TrimExtend {
  static trim(
    lineStart: Vec2,
    lineEnd: Vec2,
    cutterStart: Vec2,
    cutterEnd: Vec2
  ): TrimResult {
    const intersection = Line.intersectionSegment(
      lineStart, lineEnd,
      cutterStart, cutterEnd
    );
    
    if (!intersection) {
      return { trimmed: false };
    }
    
    const distToStart = intersection.distance(lineStart);
    const distToEnd = intersection.distance(lineEnd);
    
    if (distToStart < distToEnd) {
      return {
        trimmed: true,
        newStart: intersection,
        newEnd: lineEnd
      };
    } else {
      return {
        trimmed: true,
        newStart: lineStart,
        newEnd: intersection
      };
    }
  }

  static extend(
    lineStart: Vec2,
    lineEnd: Vec2,
    targetStart: Vec2,
    targetEnd: Vec2
  ): TrimResult {
    const intersection = Line.intersection(
      lineStart, lineEnd,
      targetStart, targetEnd
    );
    
    if (!intersection) {
      return { trimmed: false };
    }
    
    const direction = lineEnd.sub(lineStart);
    const toIntersection = intersection.sub(lineStart);
    const t = direction.dot(toIntersection) / direction.lengthSquared();
    
    if (t < 0) {
      return {
        trimmed: true,
        newStart: intersection,
        newEnd: lineEnd
      };
    } else if (t > 1) {
      return {
        trimmed: true,
        newStart: lineStart,
        newEnd: intersection
      };
    }
    
    return { trimmed: false };
  }

  static trimMultiple(
    lineStart: Vec2,
    lineEnd: Vec2,
    cutters: Array<[Vec2, Vec2]>
  ): TrimResult[] {
    const results: TrimResult[] = [];
    
    for (const [cutterStart, cutterEnd] of cutters) {
      const result = this.trim(lineStart, lineEnd, cutterStart, cutterEnd);
      if (result.trimmed) {
        results.push(result);
      }
    }
    
    return results;
  }
}
