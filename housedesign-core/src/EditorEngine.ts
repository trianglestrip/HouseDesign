/**
 * 编辑器引擎 - 核心逻辑，框架无关
 */

import { EventBus } from './EventBus';
import { UndoRedoManager, type ICommand } from './UndoRedo';
import type { EditorElement, ElementPosition } from './Types';

export const EditorEvents = {
  ELEMENT_ADDED: 'element:added',
  ELEMENT_DELETED: 'element:deleted',
  ELEMENT_MOVED: 'element:moved',
  ELEMENT_UPDATED: 'element:updated',
  SELECTION_CHANGED: 'selection:changed',
} as const;

export type EditorEventType = (typeof EditorEvents)[keyof typeof EditorEvents];

export class EditorEngine {
  private readonly elements = new Map<string, EditorElement>();
  private readonly selection = new Set<string>();
  private readonly eventBus = new EventBus();
  private readonly undoRedo = new UndoRedoManager();

  get events(): EventBus {
    return this.eventBus;
  }

  get commands(): UndoRedoManager {
    return this.undoRedo;
  }

  // ============ 元素管理 ============

  addElement(element: EditorElement): void {
    if (this.elements.has(element.id)) {
      throw new Error(`Element with id "${element.id}" already exists`);
    }
    const cmd: ICommand = {
      execute: () => this.elements.set(element.id, element),
      undo: () => this.elements.delete(element.id),
      redo: () => this.elements.set(element.id, element),
    };
    this.undoRedo.execute(cmd);
    this.eventBus.emit<EditorElement>(EditorEvents.ELEMENT_ADDED, element);
  }

  deleteElement(id: string): void {
    const element = this.elements.get(id);
    if (!element) return;
    const cmd: ICommand = {
      execute: () => this.elements.delete(id),
      undo: () => this.elements.set(id, element),
      redo: () => this.elements.delete(id),
    };
    this.undoRedo.execute(cmd);
    this.selection.delete(id);
    this.eventBus.emit<string>(EditorEvents.ELEMENT_DELETED, id);
    this.eventBus.emit<string[]>(EditorEvents.SELECTION_CHANGED, [
      ...this.selection,
    ]);
  }

  getElement(id: string): EditorElement | undefined {
    return this.elements.get(id);
  }

  getAllElements(): EditorElement[] {
    return Array.from(this.elements.values());
  }

  updateElement(id: string, updates: Partial<EditorElement>): void {
    const element = this.elements.get(id);
    if (!element) return;

    for (const [key, newValue] of Object.entries(updates)) {
      if (key === 'id') continue;
      const oldValue =
        key in element
          ? (element as unknown as Record<string, unknown>)[key]
          : element.properties[key];
      if (oldValue !== newValue) {
        const cmd: ICommand = {
          execute: () => this.setProperty(id, key, newValue),
          undo: () => this.setProperty(id, key, oldValue),
          redo: () => this.setProperty(id, key, newValue),
        };
        this.undoRedo.execute(cmd);
      }
    }
    this.eventBus.emit<{ id: string; updates: Partial<EditorElement> }>(
      EditorEvents.ELEMENT_UPDATED,
      { id, updates }
    );
  }

  private setProperty(
    elementId: string,
    key: string,
    value: unknown
  ): void {
    const element = this.elements.get(elementId);
    if (!element) return;
    const baseKeys = ['x', 'y', 'width', 'height', 'id', 'type'];
    if (baseKeys.includes(key)) {
      (element as unknown as Record<string, unknown>)[key] = value;
    } else {
      element.properties[key] = value;
    }
  }

  moveElement(id: string, toPosition: ElementPosition): void {
    const element = this.elements.get(id);
    if (!element) return;
    const fromPosition: ElementPosition = { x: element.x, y: element.y };
    if (fromPosition.x === toPosition.x && fromPosition.y === toPosition.y) {
      return;
    }
    const cmd: ICommand = {
      execute: () => {
        element.x = toPosition.x;
        element.y = toPosition.y;
      },
      undo: () => {
        element.x = fromPosition.x;
        element.y = fromPosition.y;
      },
      redo: () => {
        element.x = toPosition.x;
        element.y = toPosition.y;
      },
    };
    this.undoRedo.execute(cmd);
    this.eventBus.emit<{ id: string; position: ElementPosition }>(
      EditorEvents.ELEMENT_MOVED,
      { id, position: toPosition }
    );
  }

  // ============ 选择管理 ============

  select(id: string): void {
    if (this.elements.has(id)) {
      this.selection.add(id);
      this.eventBus.emit<string[]>(EditorEvents.SELECTION_CHANGED, [
        ...this.selection,
      ]);
    }
  }

  selectMultiple(ids: string[]): void {
    ids.filter((id) => this.elements.has(id)).forEach((id) => this.selection.add(id));
    if (ids.length > 0) {
      this.eventBus.emit<string[]>(EditorEvents.SELECTION_CHANGED, [
        ...this.selection,
      ]);
    }
  }

  deselect(id: string): void {
    if (this.selection.delete(id)) {
      this.eventBus.emit<string[]>(EditorEvents.SELECTION_CHANGED, [
        ...this.selection,
      ]);
    }
  }

  clearSelection(): void {
    if (this.selection.size > 0) {
      this.selection.clear();
      this.eventBus.emit<string[]>(EditorEvents.SELECTION_CHANGED, []);
    }
  }

  getSelection(): string[] {
    return [...this.selection];
  }

  isSelected(id: string): boolean {
    return this.selection.has(id);
  }

  // ============ 撤销/重做 ============

  undo(): boolean {
    return this.undoRedo.undo();
  }

  redo(): boolean {
    return this.undoRedo.redo();
  }

  get canUndo(): boolean {
    return this.undoRedo.canUndo;
  }

  get canRedo(): boolean {
    return this.undoRedo.canRedo;
  }

  // ============ 内部访问（供 Serializer 等使用） ============

  getElementsMap(): Map<string, EditorElement> {
    return this.elements;
  }
}
