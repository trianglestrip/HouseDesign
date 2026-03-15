import { ICommand } from '../command/ICommand';

export class UndoRedo {
  private undoStack: ICommand[] = [];
  private redoStack: ICommand[] = [];
  private maxStackSize: number;

  constructor(maxStackSize: number = 100) {
    this.maxStackSize = maxStackSize;
  }

  execute(command: ICommand): void {
    command.execute();
    this.undoStack.push(command);
    this.redoStack = [];
    
    if (this.undoStack.length > this.maxStackSize) {
      this.undoStack.shift();
    }
  }

  undo(): boolean {
    if (this.undoStack.length === 0) return false;
    
    const command = this.undoStack.pop();
    if (command && command.canUndo()) {
      command.undo();
      this.redoStack.push(command);
      return true;
    }
    
    return false;
  }

  redo(): boolean {
    if (this.redoStack.length === 0) return false;
    
    const command = this.redoStack.pop();
    if (command && command.canRedo()) {
      command.redo();
      this.undoStack.push(command);
      return true;
    }
    
    return false;
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }

  getUndoStackSize(): number {
    return this.undoStack.length;
  }

  getRedoStackSize(): number {
    return this.redoStack.length;
  }

  getLastCommand(): ICommand | undefined {
    return this.undoStack[this.undoStack.length - 1];
  }

  getUndoHistory(): string[] {
    return this.undoStack.map(cmd => cmd.getDescription());
  }

  getRedoHistory(): string[] {
    return this.redoStack.map(cmd => cmd.getDescription());
  }
}
