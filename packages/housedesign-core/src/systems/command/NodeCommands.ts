import { BaseCommand } from './ICommand';
import { Node } from '../../core/topology/Node';
import { TopologyGraph } from '../../core/topology/TopologyGraph';
import { Vec2 } from '../../core/geometry/Vec2';

export class MoveNodeCommand extends BaseCommand {
  private node: Node;
  private oldPosition: Vec2;
  private newPosition: Vec2;

  constructor(node: Node, newPosition: Vec2) {
    super();
    this.node = node;
    this.oldPosition = node.position.clone();
    this.newPosition = newPosition;
  }

  execute(): void {
    this.node.position = this.newPosition;
    this.executed = true;
  }

  undo(): void {
    this.node.position = this.oldPosition;
    this.executed = false;
  }

  getDescription(): string {
    return `移动节点 ${this.node.id}`;
  }
}

export class MergeNodesCommand extends BaseCommand {
  private graph: TopologyGraph;
  private nodeId1: string;
  private nodeId2: string;
  private node2Backup?: Node;

  constructor(graph: TopologyGraph, nodeId1: string, nodeId2: string) {
    super();
    this.graph = graph;
    this.nodeId1 = nodeId1;
    this.nodeId2 = nodeId2;
  }

  execute(): void {
    const node2 = this.graph.getNode(this.nodeId2);
    if (node2) {
      this.node2Backup = node2.clone();
    }
    
    this.graph.mergeNodes(this.nodeId1, this.nodeId2);
    this.executed = true;
  }

  undo(): void {
    if (this.node2Backup) {
      this.graph.addNode(this.node2Backup);
      
      for (const edgeId of this.node2Backup.edgeIds) {
        const edge = this.graph.getEdge(edgeId);
        if (edge) {
          if (edge.startNodeId === this.nodeId1) {
            edge.startNodeId = this.nodeId2;
          }
          if (edge.endNodeId === this.nodeId1) {
            edge.endNodeId = this.nodeId2;
          }
        }
      }
    }
    
    this.executed = false;
  }

  getDescription(): string {
    return `合并节点 ${this.nodeId1} 和 ${this.nodeId2}`;
  }
}
