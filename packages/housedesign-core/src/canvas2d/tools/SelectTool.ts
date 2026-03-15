import { BaseTool, ToolType } from '../../editor/ToolManager';
import { EditorEngine } from '../../editor/EditorEngine';
import { Vec2 } from '../../core/geometry/Vec2';
import { SelectionType } from '../../editor/SelectionManager';

export class SelectTool extends BaseTool {
  private engine: EditorEngine;

  constructor(engine: EditorEngine) {
    super(ToolType.Select, engine.eventBus);
    this.engine = engine;
  }

  handleMouseClick(position: Vec2, multiSelect: boolean = false): void {
    if (!this.active) return;

    if (!multiSelect) {
      this.engine.selectionManager.clearSelection();
    }

    const node = this.engine.getGraph().findNodeAt(position, 10);
    if (node) {
      this.engine.selectionManager.toggle(SelectionType.Node, node.id);
      this.eventBus.emit('select:node', node);
      return;
    }

    const edge = this.engine.getGraph().findEdgeAt(position, 10);
    if (edge) {
      this.engine.selectionManager.toggle(SelectionType.Edge, edge.id);
      this.eventBus.emit('select:edge', edge);
      return;
    }

    for (const [wallId, wall] of this.engine.getWalls()) {
      const centerEdge = this.engine.getGraph().getEdge(wall.centerEdgeId);
      if (centerEdge) {
        const startNode = this.engine.getGraph().getNode(centerEdge.startNodeId);
        const endNode = this.engine.getGraph().getNode(centerEdge.endNodeId);
        
        if (startNode && endNode) {
          const distance = this.pointToSegmentDistance(
            position,
            startNode.position,
            endNode.position
          );
          
          if (distance <= 10) {
            this.engine.selectionManager.toggle(SelectionType.Wall, wallId);
            this.eventBus.emit('select:wall', wall);
            return;
          }
        }
      }
    }

    if (!multiSelect) {
      this.eventBus.emit('select:none');
    }
  }

  private pointToSegmentDistance(point: Vec2, start: Vec2, end: Vec2): number {
    const line = end.sub(start);
    const len = line.lengthSquared();
    
    if (len === 0) return point.distance(start);
    
    const t = Math.max(0, Math.min(1, point.sub(start).dot(line) / len));
    const projection = start.add(line.mul(t));
    return point.distance(projection);
  }
}
