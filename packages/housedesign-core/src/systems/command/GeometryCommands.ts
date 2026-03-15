import { BaseCommand } from './ICommand';
import { Edge } from '../../core/topology/Edge';
import { Node } from '../../core/topology/Node';
import { TopologyGraph } from '../../core/topology/TopologyGraph';
import { Vec2 } from '../../core/geometry/Vec2';
import { TrimExtend } from '../../core/kernel/TrimExtend';

export class TrimWallCommand extends BaseCommand {
  private edge: Edge;
  private graph: TopologyGraph;
  private oldStartNodeId: string;
  private oldEndNodeId: string;
  private newStartNode?: Node;
  private newEndNode?: Node;

  constructor(edge: Edge, graph: TopologyGraph, trimPoint: Vec2) {
    super();
    this.edge = edge;
    this.graph = graph;
    this.oldStartNodeId = edge.startNodeId;
    this.oldEndNodeId = edge.endNodeId;
  }

  execute(): void {
    this.executed = true;
  }

  undo(): void {
    this.edge.startNodeId = this.oldStartNodeId;
    this.edge.endNodeId = this.oldEndNodeId;
    
    if (this.newStartNode) {
      this.graph.removeNode(this.newStartNode.id);
    }
    if (this.newEndNode) {
      this.graph.removeNode(this.newEndNode.id);
    }
    
    this.executed = false;
  }

  getDescription(): string {
    return `修剪边 ${this.edge.id}`;
  }
}

export class ExtendWallCommand extends BaseCommand {
  private edge: Edge;
  private graph: TopologyGraph;
  private oldStartNodeId: string;
  private oldEndNodeId: string;
  private newStartNode?: Node;
  private newEndNode?: Node;

  constructor(edge: Edge, graph: TopologyGraph, targetEdge: Edge) {
    super();
    this.edge = edge;
    this.graph = graph;
    this.oldStartNodeId = edge.startNodeId;
    this.oldEndNodeId = edge.endNodeId;
  }

  execute(): void {
    this.executed = true;
  }

  undo(): void {
    this.edge.startNodeId = this.oldStartNodeId;
    this.edge.endNodeId = this.oldEndNodeId;
    
    if (this.newStartNode) {
      this.graph.removeNode(this.newStartNode.id);
    }
    if (this.newEndNode) {
      this.graph.removeNode(this.newEndNode.id);
    }
    
    this.executed = false;
  }

  getDescription(): string {
    return `延伸边 ${this.edge.id}`;
  }
}
