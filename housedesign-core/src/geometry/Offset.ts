/**
 * 偏移复制算法
 */

import type { Vec2 } from './Vec2';
import * as Vec2Math from './Vec2';
import type { Wall } from '../Semantic';
import type { TopologyGraph } from '../Topology';

/**
 * 偏移墙体
 * @param wall 要偏移的墙体
 * @param distance 偏移距离（mm）
 * @param side 偏移方向（'left' 或 'right'）
 * @param topology 拓扑图
 * @returns 偏移后的起点和终点
 */
export function offsetWall(
  wall: Wall,
  distance: number,
  side: 'left' | 'right',
  topology: TopologyGraph
): { start: Vec2; end: Vec2 } | null {
  const edge = topology.getEdge(wall.edgeId);
  if (!edge) return null;

  const nodeA = topology.getNode(edge.nodeA);
  const nodeB = topology.getNode(edge.nodeB);
  if (!nodeA || !nodeB) return null;

  // 计算墙体中心线方向
  const direction = Vec2Math.sub(nodeB.position, nodeA.position);
  const length = Vec2Math.length(direction);
  if (length < 1e-10) return null;

  const normalized = Vec2Math.normalize(direction);

  // 计算垂直方向（逆时针旋转90度）
  const perpendicular = Vec2Math.perpendicular(normalized);

  // 根据side决定偏移方向
  const offsetDirection = side === 'left' ? perpendicular : Vec2Math.scale(perpendicular, -1);

  // 计算偏移后的起点和终点
  const start = {
    x: nodeA.position.x + offsetDirection.x * distance,
    y: nodeA.position.y + offsetDirection.y * distance,
  };

  const end = {
    x: nodeB.position.x + offsetDirection.x * distance,
    y: nodeB.position.y + offsetDirection.y * distance,
  };

  return { start, end };
}

/**
 * 偏移多个墙体（保持拓扑关系）
 */
export function offsetWalls(
  walls: Wall[],
  distance: number,
  side: 'left' | 'right',
  topology: TopologyGraph
): Array<{ start: Vec2; end: Vec2 }> {
  const results: Array<{ start: Vec2; end: Vec2 }> = [];

  walls.forEach(wall => {
    const result = offsetWall(wall, distance, side, topology);
    if (result) {
      results.push(result);
    }
  });

  return results;
}

/**
 * 计算偏移预览线
 */
export function previewOffset(
  wall: Wall,
  distance: number,
  side: 'left' | 'right',
  topology: TopologyGraph
): { start: Vec2; end: Vec2 } | null {
  return offsetWall(wall, distance, side, topology);
}
