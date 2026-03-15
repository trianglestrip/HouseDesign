/**
 * 撤销/重做 - 命令模式实现
 */
export interface ICommand {
  execute(): void;
  undo(): void;
  redo(): void;
}

export interface UndoRedoOptions {
  maxHistorySize?: number;
}

export class UndoRedoManager {
  private readonly undoStack: ICommand[] = [];
  private readonly redoStack: ICommand[] = [];
  private readonly maxHistorySize: number;

  constructor(options: UndoRedoOptions = {}) {
    this.maxHistorySize = options.maxHistorySize ?? 100;
  }

  execute(command: ICommand): void {
    command.execute();
    this.undoStack.push(command);
    if (this.undoStack.length > this.maxHistorySize) {
      this.undoStack.shift();
    }
    this.redoStack.length = 0;
  }

  undo(): boolean {
    const command = this.undoStack.pop();
    if (!command) return false;
    command.undo();
    this.redoStack.push(command);
    return true;
  }

  redo(): boolean {
    const command = this.redoStack.pop();
    if (!command) return false;
    command.redo();
    this.undoStack.push(command);
    return true;
  }

  get canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  get canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  clear(): void {
    this.undoStack.length = 0;
    this.redoStack.length = 0;
  }
}
