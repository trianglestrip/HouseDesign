import { BaseCommand } from './ICommand';
import { Wall } from '../../core/model/Wall';
import { TopologyGraph } from '../../core/topology/TopologyGraph';
import { Edge } from '../../core/topology/Edge';
import { Node } from '../../core/topology/Node';
import { Vec2 } from '../../core/geometry/Vec2';

export class CreateWallCommand extends BaseCommand {
  private wall: Wall;
  private centerEdge: Edge;
  private startNode: Node;
  private endNode: Node;
  private graph: TopologyGraph;
  private walls: Map<string, Wall>;

  constructor(
    wall: Wall,
    centerEdge: Edge,
    startNode: Node,
    endNode: Node,
    graph: TopologyGraph,
    walls: Map<string, Wall>
  ) {
    super();
    this.wall = wall;
    this.centerEdge = centerEdge;
    this.startNode = startNode;
    this.endNode = endNode;
    this.graph = graph;
    this.walls = walls;
  }

  execute(): void {
    this.graph.addNode(this.startNode);
    this.graph.addNode(this.endNode);
    this.graph.addEdge(this.centerEdge);
    this.walls.set(this.wall.id, this.wall);
    this.executed = true;
  }

  undo(): void {
    this.walls.delete(this.wall.id);
    this.graph.removeEdge(this.centerEdge.id);
    
    if (this.startNode.getDegree() === 0) {
      this.graph.removeNode(this.startNode.id);
    }
    if (this.endNode.getDegree() === 0) {
      this.graph.removeNode(this.endNode.id);
    }
    
    this.executed = false;
  }

  getDescription(): string {
    return `创建墙体 ${this.wall.id}`;
  }
}

export class DeleteWallCommand extends BaseCommand {
  private wall: Wall;
  private centerEdge: Edge;
  private graph: TopologyGraph;
  private walls: Map<string, Wall>;
  private shouldDeleteStartNode: boolean = false;
  private shouldDeleteEndNode: boolean = false;

  constructor(
    wall: Wall,
    graph: TopologyGraph,
    walls: Map<string, Wall>
  ) {
    super();
    this.wall = wall;
    this.graph = graph;
    this.walls = walls;
    
    const edge = graph.getEdge(wall.centerEdgeId);
    if (!edge) throw new Error(`Edge ${wall.centerEdgeId} not found`);
    this.centerEdge = edge;
  }

  execute(): void {
    const startNode = this.graph.getNode(this.centerEdge.startNodeId);
    const endNode = this.graph.getNode(this.centerEdge.endNodeId);
    
    this.walls.delete(this.wall.id);
    this.graph.removeEdge(this.centerEdge.id);
    
    if (startNode && startNode.getDegree() === 0) {
      this.shouldDeleteStartNode = true;
      this.graph.removeNode(startNode.id);
    }
    
    if (endNode && endNode.getDegree() === 0) {
      this.shouldDeleteEndNode = true;
      this.graph.removeNode(endNode.id);
    }
    
    this.executed = true;
  }

  undo(): void {
    if (this.shouldDeleteStartNode) {
      const startNode = new Node(
        this.centerEdge.startNodeId,
        this.graph.getNode(this.centerEdge.startNodeId)?.position ?? Vec2.zero()
      );
      this.graph.addNode(startNode);
    }
    
    if (this.shouldDeleteEndNode) {
      const endNode = new Node(
        this.centerEdge.endNodeId,
        this.graph.getNode(this.centerEdge.endNodeId)?.position ?? Vec2.zero()
      );
      this.graph.addNode(endNode);
    }
    
    this.graph.addEdge(this.centerEdge);
    this.walls.set(this.wall.id, this.wall);
    this.executed = false;
  }

  getDescription(): string {
    return `删除墙体 ${this.wall.id}`;
  }
}

export class ModifyWallCommand extends BaseCommand {
  private wall: Wall;
  private oldThickness: number;
  private newThickness: number;

  constructor(wall: Wall, newThickness: number) {
    super();
    this.wall = wall;
    this.oldThickness = wall.thickness;
    this.newThickness = newThickness;
  }

  execute(): void {
    this.wall.thickness = this.newThickness;
    this.executed = true;
  }

  undo(): void {
    this.wall.thickness = this.oldThickness;
    this.executed = false;
  }

  getDescription(): string {
    return `修改墙体厚度 ${this.wall.id}: ${this.oldThickness} -> ${this.newThickness}`;
  }
}
