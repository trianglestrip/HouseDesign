import { BaseTool, ToolType } from '../../editor/ToolManager';
import { EditorEngine } from '../../editor/EditorEngine';
import { Vec2 } from '../../core/geometry/Vec2';
import { Node } from '../../core/topology/Node';
import { MoveNodeCommand } from '../../systems/command/NodeCommands';
import { SelectionType } from '../../editor/SelectionManager';

export class MoveTool extends BaseTool {
  private engine: EditorEngine;
  private movingNode: Node | null = null;
  private startPosition: Vec2 | null = null;

  constructor(engine: EditorEngine) {
    super(ToolType.Move, engine.eventBus);
    this.engine = engine;
  }

  activate(): void {
    super.activate();
    this.movingNode = null;
    this.startPosition = null;
  }

  deactivate(): void {
    super.deactivate();
    this.movingNode = null;
    this.startPosition = null;
  }

  handleMouseDown(position: Vec2): void {
    if (!this.active) return;

    const node = this.engine.getGraph().findNodeAt(position, 10);
    if (node) {
      this.movingNode = node;
      this.startPosition = node.position.clone();
      this.eventBus.emit('move:started', node);
    }
  }

  handleMouseMove(position: Vec2): void {
    if (!this.active || !this.movingNode) return;

    this.movingNode.position = position;
    this.eventBus.emit('move:preview', { node: this.movingNode, position });
  }

  handleMouseUp(position: Vec2): void {
    if (!this.active || !this.movingNode || !this.startPosition) return;

    if (!position.equals(this.startPosition)) {
      const command = new MoveNodeCommand(this.movingNode, position);
      this.engine.undoRedo.execute(command);
      this.eventBus.emit('move:completed', { node: this.movingNode, position });
    } else {
      this.movingNode.position = this.startPosition;
    }

    this.movingNode = null;
    this.startPosition = null;
  }

  handleKeyPress(key: string): void {
    if (!this.active) return;

    if (key === 'Escape' && this.movingNode && this.startPosition) {
      this.movingNode.position = this.startPosition;
      this.movingNode = null;
      this.startPosition = null;
      this.eventBus.emit('move:cancelled');
    }
  }
}
