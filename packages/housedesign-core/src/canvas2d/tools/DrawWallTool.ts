import { BaseTool, ToolType } from '../../editor/ToolManager';
import { EventBus } from '../../editor/EventBus';
import { EditorEngine } from '../../editor/EditorEngine';
import { Vec2 } from '../../core/geometry/Vec2';
import { Node } from '../../core/topology/Node';
import { Edge } from '../../core/topology/Edge';
import { Wall } from '../../core/model/Wall';
import { CreateWallCommand } from '../../systems/command/WallCommands';

export class DrawWallTool extends BaseTool {
  private engine: EditorEngine;
  private startNode: Node | null = null;
  private currentPosition: Vec2 | null = null;

  constructor(engine: EditorEngine) {
    super(ToolType.DrawWall, engine.eventBus);
    this.engine = engine;
  }

  activate(): void {
    super.activate();
    this.startNode = null;
    this.currentPosition = null;
  }

  deactivate(): void {
    super.deactivate();
    this.startNode = null;
    this.currentPosition = null;
  }

  handleMouseMove(position: Vec2): void {
    if (!this.active) return;
    
    this.currentPosition = position;
    
    if (this.startNode) {
      this.eventBus.emit('draw:preview', {
        start: this.startNode.position,
        end: position
      });
    }
  }

  handleMouseClick(position: Vec2): void {
    if (!this.active) return;

    if (!this.startNode) {
      const existingNode = this.engine.getGraph().findNodeAt(position, 10);
      
      if (existingNode) {
        this.startNode = existingNode;
      } else {
        const nodeId = this.engine.generateId('node');
        this.startNode = new Node(nodeId, position);
        this.engine.getGraph().addNode(this.startNode);
      }
      
      this.eventBus.emit('draw:started', this.startNode);
    } else {
      const existingNode = this.engine.getGraph().findNodeAt(position, 10);
      let endNode: Node;
      
      if (existingNode && existingNode.id !== this.startNode.id) {
        endNode = existingNode;
      } else {
        const nodeId = this.engine.generateId('node');
        endNode = new Node(nodeId, position);
      }
      
      const edgeId = this.engine.generateId('edge');
      const edge = new Edge(edgeId, this.startNode.id, endNode.id);
      
      const wallId = this.engine.generateId('wall');
      const wall = new Wall(wallId, edgeId, 200, 2800);
      
      const command = new CreateWallCommand(
        wall,
        edge,
        this.startNode,
        endNode,
        this.engine.getGraph(),
        this.engine.getWalls()
      );
      
      this.engine.undoRedo.execute(command);
      
      this.eventBus.emit('draw:completed', { wall, edge, startNode: this.startNode, endNode });
      
      this.startNode = endNode;
    }
  }

  handleKeyPress(key: string): void {
    if (!this.active) return;
    
    if (key === 'Escape') {
      this.startNode = null;
      this.currentPosition = null;
      this.eventBus.emit('draw:cancelled');
    } else if (key === 'Enter' && this.startNode) {
      this.startNode = null;
      this.currentPosition = null;
      this.eventBus.emit('draw:finished');
    }
  }

  getStartNode(): Node | null {
    return this.startNode;
  }

  getCurrentPosition(): Vec2 | null {
    return this.currentPosition;
  }
}
