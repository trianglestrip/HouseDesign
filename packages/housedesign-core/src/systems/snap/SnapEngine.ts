import { Vec2 } from '../../core/geometry/Vec2';
import { Line } from '../../core/geometry/Line';
import { TopologyGraph } from '../../core/topology/TopologyGraph';
import { Node } from '../../core/topology/Node';
import { Edge } from '../../core/topology/Edge';
import { SnapType, SnapResult, SnapConfig, defaultSnapConfig, AuxiliaryLine } from './SnapTypes';

export class SnapEngine {
  private config: SnapConfig;

  constructor(config: Partial<SnapConfig> = {}) {
    this.config = { ...defaultSnapConfig, ...config };
  }

  findSnap(
    position: Vec2,
    graph: TopologyGraph,
    excludeNodeIds: string[] = []
  ): SnapResult | null {
    if (!this.config.enabled) {
      return null;
    }

    const snapResults: SnapResult[] = [];

    if (this.config.enabledTypes.has(SnapType.Endpoint)) {
      const endpointSnap = this.snapToEndpoint(position, graph, excludeNodeIds);
      if (endpointSnap) snapResults.push(endpointSnap);
    }

    if (this.config.enabledTypes.has(SnapType.Midpoint)) {
      const midpointSnap = this.snapToMidpoint(position, graph);
      if (midpointSnap) snapResults.push(midpointSnap);
    }

    if (this.config.enabledTypes.has(SnapType.Grid)) {
      const gridSnap = this.snapToGrid(position);
      if (gridSnap) snapResults.push(gridSnap);
    }

    if (snapResults.length === 0) return null;

    snapResults.sort((a, b) => {
      const distA = a.position.distance(position);
      const distB = b.position.distance(position);
      return distA - distB;
    });

    return snapResults[0];
  }

  private snapToEndpoint(
    position: Vec2,
    graph: TopologyGraph,
    excludeNodeIds: string[]
  ): SnapResult | null {
    let closestNode: Node | null = null;
    let minDistance = this.config.tolerance;

    for (const node of graph.getAllNodes()) {
      if (excludeNodeIds.includes(node.id)) continue;

      const distance = position.distance(node.position);
      if (distance < minDistance) {
        minDistance = distance;
        closestNode = node;
      }
    }

    if (closestNode) {
      return {
        type: SnapType.Endpoint,
        position: closestNode.position,
        targetId: closestNode.id,
        message: '端点'
      };
    }

    return null;
  }

  private snapToMidpoint(
    position: Vec2,
    graph: TopologyGraph
  ): SnapResult | null {
    let closestMidpoint: Vec2 | null = null;
    let closestEdge: Edge | null = null;
    let minDistance = this.config.tolerance;

    for (const edge of graph.getAllEdges()) {
      const startNode = graph.getNode(edge.startNodeId);
      const endNode = graph.getNode(edge.endNodeId);

      if (startNode && endNode) {
        const midpoint = Line.midpoint(startNode.position, endNode.position);
        const distance = position.distance(midpoint);

        if (distance < minDistance) {
          minDistance = distance;
          closestMidpoint = midpoint;
          closestEdge = edge;
        }
      }
    }

    if (closestMidpoint && closestEdge) {
      return {
        type: SnapType.Midpoint,
        position: closestMidpoint,
        targetId: closestEdge.id,
        message: '中点'
      };
    }

    return null;
  }

  private snapToGrid(position: Vec2): SnapResult | null {
    const gridSize = this.config.gridSize;
    const snappedX = Math.round(position.x / gridSize) * gridSize;
    const snappedY = Math.round(position.y / gridSize) * gridSize;
    const snappedPos = new Vec2(snappedX, snappedY);

    if (position.distance(snappedPos) < this.config.tolerance) {
      return {
        type: SnapType.Grid,
        position: snappedPos,
        message: '网格'
      };
    }

    return null;
  }

  snapWithConstraints(
    position: Vec2,
    graph: TopologyGraph,
    startPoint: Vec2 | null,
    excludeNodeIds: string[] = []
  ): SnapResult | null {
    const baseSnap = this.findSnap(position, graph, excludeNodeIds);

    if (!startPoint) return baseSnap;

    const auxiliaryLines: AuxiliaryLine[] = [];
    let constrainedPosition = baseSnap ? baseSnap.position : position;

    if (this.config.enabledTypes.has(SnapType.Horizontal)) {
      if (Math.abs(position.y - startPoint.y) < this.config.tolerance) {
        constrainedPosition = new Vec2(constrainedPosition.x, startPoint.y);
        auxiliaryLines.push({
          type: 'horizontal',
          start: new Vec2(startPoint.x - 1000, startPoint.y),
          end: new Vec2(startPoint.x + 1000, startPoint.y),
          style: { color: '#00FF00', dashArray: [5, 5], width: 1 }
        });
      }
    }

    if (this.config.enabledTypes.has(SnapType.Vertical)) {
      if (Math.abs(position.x - startPoint.x) < this.config.tolerance) {
        constrainedPosition = new Vec2(startPoint.x, constrainedPosition.y);
        auxiliaryLines.push({
          type: 'vertical',
          start: new Vec2(startPoint.x, startPoint.y - 1000),
          end: new Vec2(startPoint.x, startPoint.y + 1000),
          style: { color: '#00FF00', dashArray: [5, 5], width: 1 }
        });
      }
    }

    if (auxiliaryLines.length > 0 || baseSnap) {
      return {
        type: baseSnap?.type ?? SnapType.None,
        position: constrainedPosition,
        auxiliaryLines,
        message: baseSnap?.message
      };
    }

    return null;
  }

  setConfig(config: Partial<SnapConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): SnapConfig {
    return { ...this.config };
  }
}
