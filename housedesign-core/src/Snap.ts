/**
 * Snap吸附系统
 * 合并自：snap/SnapSystem.ts
 */

import type { Vec2 } from './geometry/Vec2';
import * as Vec2Math from './geometry/Vec2';
import type { Node } from './Topology';
import type { Edge } from './Topology';

export enum SnapType {
  Endpoint = 'endpoint',
  Midpoint = 'midpoint',
  Horizontal = 'horizontal',
  Vertical = 'vertical',
  Angle = 'angle',
  Extension = 'extension',
  Grid = 'grid',
}

export interface SnapResult {
  position: Vec2;
  type: SnapType;
  priority: number;
  targetId?: string;
}

export class SnapSystem {
  private snapDistance: number = 15;
  private gridSize: number = 100;
  private angleStep: number = 15;

  constructor(snapDistance: number = 15, gridSize: number = 100) {
    this.snapDistance = snapDistance;
    this.gridSize = gridSize;
  }

  findBestSnap(
    position: Vec2,
    nodes: Node[],
    edges: Edge[],
    nodePositions: Map<string, Vec2>,
    excludeNodeId?: string
  ): SnapResult | null {
    const candidates: SnapResult[] = [];

    // 端点吸附
    nodes.forEach((node) => {
      if (node.id === excludeNodeId) return;

      const dist = Vec2Math.distance(position, node.position);
      if (dist < this.snapDistance) {
        candidates.push({
          position: node.position,
          type: SnapType.Endpoint,
          priority: 1,
          targetId: node.id,
        });
      }
    });

    // 中点吸附
    edges.forEach((edge) => {
      const nodeA = nodePositions.get(edge.nodeA);
      const nodeB = nodePositions.get(edge.nodeB);
      if (!nodeA || !nodeB) return;

      const midpoint = Vec2Math.lerp(nodeA, nodeB, 0.5);
      const dist = Vec2Math.distance(position, midpoint);

      if (dist < this.snapDistance) {
        candidates.push({
          position: midpoint,
          type: SnapType.Midpoint,
          priority: 2,
          targetId: edge.id,
        });
      }
    });

    // 网格吸附
    const gridX = Math.round(position.x / this.gridSize) * this.gridSize;
    const gridY = Math.round(position.y / this.gridSize) * this.gridSize;
    const gridPoint = { x: gridX, y: gridY };
    const gridDist = Vec2Math.distance(position, gridPoint);

    if (gridDist < this.snapDistance) {
      candidates.push({
        position: gridPoint,
        type: SnapType.Grid,
        priority: 5,
      });
    }

    if (candidates.length === 0) return null;

    candidates.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      const distA = Vec2Math.distance(position, a.position);
      const distB = Vec2Math.distance(position, b.position);
      return distA - distB;
    });

    return candidates[0];
  }

  snapToAxis(position: Vec2, reference: Vec2): SnapResult | null {
    const dx = Math.abs(position.x - reference.x);
    const dy = Math.abs(position.y - reference.y);

    if (dy < this.snapDistance && dx > dy) {
      return {
        position: { x: position.x, y: reference.y },
        type: SnapType.Horizontal,
        priority: 3,
      };
    }

    if (dx < this.snapDistance && dy > dx) {
      return {
        position: { x: reference.x, y: position.y },
        type: SnapType.Vertical,
        priority: 3,
      };
    }

    return null;
  }

  snapToAngle(position: Vec2, reference: Vec2): SnapResult | null {
    const dir = Vec2Math.sub(position, reference);
    const currentAngle = Vec2Math.angle(dir) * (180 / Math.PI);
    const len = Vec2Math.length(dir);

    if (len < 1) return null;

    const snappedAngle = Math.round(currentAngle / this.angleStep) * this.angleStep;
    const angleDiff = Math.abs(currentAngle - snappedAngle);

    if (angleDiff < 5) {
      const rad = (snappedAngle * Math.PI) / 180;
      const snappedPos = {
        x: reference.x + Math.cos(rad) * len,
        y: reference.y + Math.sin(rad) * len,
      };

      return {
        position: snappedPos,
        type: SnapType.Angle,
        priority: 4,
      };
    }

    return null;
  }

  setSnapDistance(distance: number): void {
    this.snapDistance = distance;
  }

  setGridSize(size: number): void {
    this.gridSize = size;
  }

  setAngleStep(step: number): void {
    this.angleStep = step;
  }
}
