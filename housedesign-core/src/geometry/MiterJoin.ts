/**
 * Miter Join - 墙体交点斜角处理
 * 用于多墙交点的平滑连接
 */

import type { Vec2 } from './Vec2';
import * as Vec2Math from './Vec2';

export interface MiterResult {
  inner: Vec2[]; // 内侧顶点
  outer: Vec2[]; // 外侧顶点
}

/**
 * 计算两段墙体在转折点的斜角连接
 * @param p1 前一段的起点
 * @param p2 转折点
 * @param p3 后一段的终点
 * @param thickness 墙体厚度
 */
export function calculateMiterJoint(
  p1: Vec2,
  p2: Vec2,
  p3: Vec2,
  thickness: number
): MiterResult {
  // 计算两段的方向向量
  const dir1 = Vec2Math.normalize(Vec2Math.sub(p2, p1));
  const dir2 = Vec2Math.normalize(Vec2Math.sub(p3, p2));

  // 计算法向量（垂直方向）
  const n1 = Vec2Math.perpendicular(dir1);
  const n2 = Vec2Math.perpendicular(dir2);

  const offset = thickness / 2;

  // 计算平均法向量
  const avgN = Vec2Math.normalize({
    x: n1.x + n2.x,
    y: n1.y + n2.y,
  });

  // 计算夹角的cos值
  const cosAngle = Vec2Math.dot(n1, n2);

  // 计算miter长度（考虑夹角）
  const miterLength = offset / Math.max(0.3, Math.sqrt((1 + cosAngle) / 2));

  // 限制miter长度，避免过长
  const clampedLength = Math.min(miterLength, thickness * 3);

  return {
    inner: [Vec2Math.add(p2, Vec2Math.scale(avgN, -clampedLength))],
    outer: [Vec2Math.add(p2, Vec2Math.scale(avgN, clampedLength))],
  };
}

/**
 * 计算多个墙体交点的斜角（L型、T型、X型）
 * @param center 交点中心
 * @param directions 所有连接方向的单位向量
 * @param thickness 墙体厚度
 */
export function calculateMultiWayJoint(
  center: Vec2,
  directions: Vec2[],
  thickness: number
): Vec2[] {
  if (directions.length < 2) return [];

  const offset = thickness / 2;
  const points: Vec2[] = [];

  // 按角度排序方向
  const sortedDirs = directions.sort((a, b) => {
    const angleA = Math.atan2(a.y, a.x);
    const angleB = Math.atan2(b.y, b.x);
    return angleA - angleB;
  });

  // 为每对相邻方向计算斜角点
  for (let i = 0; i < sortedDirs.length; i++) {
    const dir1 = sortedDirs[i];
    const dir2 = sortedDirs[(i + 1) % sortedDirs.length];

    // 计算法向量
    const n1 = Vec2Math.perpendicular(dir1);
    const n2 = Vec2Math.perpendicular(dir2);

    // 计算平均法向量
    const avgN = Vec2Math.normalize({
      x: n1.x + n2.x,
      y: n1.y + n2.y,
    });

    // 计算偏移点
    const point = Vec2Math.add(center, Vec2Math.scale(avgN, offset));
    points.push(point);
  }

  return points;
}

/**
 * 计算两条线段的交点
 */
export function lineIntersection(
  p1: Vec2,
  p2: Vec2,
  p3: Vec2,
  p4: Vec2
): Vec2 | null {
  const d1 = Vec2Math.sub(p2, p1);
  const d2 = Vec2Math.sub(p4, p3);

  const cross = Vec2Math.cross(d1, d2);

  // 平行线，无交点
  if (Math.abs(cross) < 1e-10) return null;

  const t = Vec2Math.cross(Vec2Math.sub(p3, p1), d2) / cross;

  return {
    x: p1.x + d1.x * t,
    y: p1.y + d1.y * t,
  };
}

/**
 * 计算墙体的偏移线（用于双线墙体）
 */
export function offsetLine(
  p1: Vec2,
  p2: Vec2,
  offset: number
): { left: [Vec2, Vec2]; right: [Vec2, Vec2] } {
  const dir = Vec2Math.normalize(Vec2Math.sub(p2, p1));
  const n = Vec2Math.perpendicular(dir);

  return {
    left: [
      Vec2Math.add(p1, Vec2Math.scale(n, offset)),
      Vec2Math.add(p2, Vec2Math.scale(n, offset)),
    ],
    right: [
      Vec2Math.add(p1, Vec2Math.scale(n, -offset)),
      Vec2Math.add(p2, Vec2Math.scale(n, -offset)),
    ],
  };
}
