/**
 * 墙体修剪/延伸算法
 */

import type { Vec2 } from './Vec2';
import * as Vec2Math from './Vec2';
import type { Wall } from '../Semantic';
import type { TopologyGraph } from '../Topology';

/**
 * 线段交点计算
 */
export function lineIntersection(
  p1: Vec2,
  p2: Vec2,
  p3: Vec2,
  p4: Vec2
): Vec2 | null {
  const x1 = p1.x, y1 = p1.y;
  const x2 = p2.x, y2 = p2.y;
  const x3 = p3.x, y3 = p3.y;
  const x4 = p4.x, y4 = p4.y;

  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  
  // 平行或重合
  if (Math.abs(denom) < 1e-10) {
    return null;
  }

  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
  const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;

  // 检查交点是否在两条线段上
  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return {
      x: x1 + t * (x2 - x1),
      y: y1 + t * (y2 - y1),
    };
  }

  return null;
}

/**
 * 检测两个墙体是否相交
 */
export function detectWallIntersection(
  wall1: Wall,
  wall2: Wall,
  topology: TopologyGraph
): Vec2 | null {
  // 获取墙体的中心线端点
  const edge1 = topology.getEdge(wall1.edgeId);
  const edge2 = topology.getEdge(wall2.edgeId);
  
  if (!edge1 || !edge2) return null;
  
  const node1A = topology.getNode(edge1.nodeA);
  const node1B = topology.getNode(edge1.nodeB);
  const node2A = topology.getNode(edge2.nodeA);
  const node2B = topology.getNode(edge2.nodeB);
  
  if (!node1A || !node1B || !node2A || !node2B) return null;
  
  // 计算中心线交点
  return lineIntersection(
    node1A.position,
    node1B.position,
    node2A.position,
    node2B.position
  );
}

/**
 * 延伸墙体到目标点
 */
export function extendWallToPoint(
  wall: Wall,
  targetPoint: Vec2,
  topology: TopologyGraph,
  extendStart: boolean = false
): boolean {
  const edge = topology.getEdge(wall.edgeId);
  if (!edge) return false;
  
  const nodeA = topology.getNode(edge.nodeA);
  const nodeB = topology.getNode(edge.nodeB);
  if (!nodeA || !nodeB) return false;
  
  // 计算墙体方向
  const direction = Vec2Math.sub(nodeB.position, nodeA.position);
  const length = Vec2Math.length(direction);
  if (length < 1e-10) return false;
  
  const normalized = Vec2Math.normalize(direction);
  
  // 计算目标点在墙体方向上的投影
  const toTarget = Vec2Math.sub(targetPoint, nodeA.position);
  const projection = Vec2Math.dot(toTarget, normalized);
  
  if (extendStart) {
    // 延伸起点
    if (projection < 0) {
      nodeA.position = {
        x: nodeA.position.x + projection * normalized.x,
        y: nodeA.position.y + projection * normalized.y,
      };
      return true;
    }
  } else {
    // 延伸终点
    if (projection > length) {
      nodeB.position = {
        x: nodeA.position.x + projection * normalized.x,
        y: nodeA.position.y + projection * normalized.y,
      };
      return true;
    }
  }
  
  return false;
}

/**
 * 自动检测并处理墙体相交
 */
export function autoTrimExtendWalls(
  walls: Map<string, Wall>,
  topology: TopologyGraph
): number {
  let processedCount = 0;
  const wallArray = Array.from(walls.values());
  
  // 检测所有墙体对
  for (let i = 0; i < wallArray.length; i++) {
    for (let j = i + 1; j < wallArray.length; j++) {
      const wall1 = wallArray[i];
      const wall2 = wallArray[j];
      
      // 检测交点
      const intersection = detectWallIntersection(wall1, wall2, topology);
      
      if (intersection) {
        // TODO: 实现自动修剪逻辑
        // 这里需要判断是否需要在交点处分割墙体
        console.log('[自动修剪] 检测到墙体相交:', wall1.id, wall2.id, '交点:', intersection);
        processedCount++;
      }
    }
  }
  
  return processedCount;
}
