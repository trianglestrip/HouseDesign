import { EventBus } from './EventBus';

export enum SelectionType {
  Node = 'node',
  Edge = 'edge',
  Wall = 'wall',
  Room = 'room',
  Opening = 'opening'
}

export interface Selection {
  type: SelectionType;
  id: string;
}

export class SelectionManager {
  private selections: Set<string> = new Set();
  private eventBus: EventBus;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
  }

  select(type: SelectionType, id: string): void {
    const key = `${type}:${id}`;
    this.selections.add(key);
    this.eventBus.emit('selection:changed', this.getSelections());
  }

  deselect(type: SelectionType, id: string): void {
    const key = `${type}:${id}`;
    this.selections.delete(key);
    this.eventBus.emit('selection:changed', this.getSelections());
  }

  toggle(type: SelectionType, id: string): void {
    const key = `${type}:${id}`;
    if (this.selections.has(key)) {
      this.deselect(type, id);
    } else {
      this.select(type, id);
    }
  }

  clearSelection(): void {
    this.selections.clear();
    this.eventBus.emit('selection:changed', []);
  }

  isSelected(type: SelectionType, id: string): boolean {
    const key = `${type}:${id}`;
    return this.selections.has(key);
  }

  getSelections(): Selection[] {
    return Array.from(this.selections).map(key => {
      const [type, id] = key.split(':');
      return { type: type as SelectionType, id };
    });
  }

  getSelectedIds(type?: SelectionType): string[] {
    const selections = this.getSelections();
    if (type) {
      return selections.filter(s => s.type === type).map(s => s.id);
    }
    return selections.map(s => s.id);
  }

  hasSelection(): boolean {
    return this.selections.size > 0;
  }

  getSelectionCount(): number {
    return this.selections.size;
  }
}
