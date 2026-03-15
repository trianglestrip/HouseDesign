import { EventBus } from './EventBus';

export enum ToolType {
  Select = 'select',
  DrawWall = 'draw_wall',
  Move = 'move',
  Delete = 'delete',
  Trim = 'trim',
  Extend = 'extend'
}

export interface ITool {
  type: ToolType;
  activate(): void;
  deactivate(): void;
  isActive(): boolean;
}

export abstract class BaseTool implements ITool {
  protected active: boolean = false;
  protected eventBus: EventBus;

  constructor(public type: ToolType, eventBus: EventBus) {
    this.eventBus = eventBus;
  }

  activate(): void {
    this.active = true;
    this.eventBus.emit('tool:activated', this.type);
  }

  deactivate(): void {
    this.active = false;
    this.eventBus.emit('tool:deactivated', this.type);
  }

  isActive(): boolean {
    return this.active;
  }
}

export class ToolManager {
  private tools: Map<ToolType, ITool> = new Map();
  private currentTool: ITool | null = null;
  private eventBus: EventBus;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
  }

  registerTool(tool: ITool): void {
    this.tools.set(tool.type, tool);
  }

  unregisterTool(type: ToolType): void {
    const tool = this.tools.get(type);
    if (tool && tool.isActive()) {
      tool.deactivate();
      this.currentTool = null;
    }
    this.tools.delete(type);
  }

  activateTool(type: ToolType): boolean {
    const tool = this.tools.get(type);
    if (!tool) return false;

    if (this.currentTool && this.currentTool !== tool) {
      this.currentTool.deactivate();
    }

    tool.activate();
    this.currentTool = tool;
    return true;
  }

  deactivateCurrentTool(): void {
    if (this.currentTool) {
      this.currentTool.deactivate();
      this.currentTool = null;
    }
  }

  getCurrentTool(): ITool | null {
    return this.currentTool;
  }

  getCurrentToolType(): ToolType | null {
    return this.currentTool?.type ?? null;
  }

  hasTool(type: ToolType): boolean {
    return this.tools.has(type);
  }

  getAllTools(): ITool[] {
    return Array.from(this.tools.values());
  }
}
