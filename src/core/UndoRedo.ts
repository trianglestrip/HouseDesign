/**
 * 撤销/重做 - 命令模式实现
 * 纯 TypeScript，框架无关
 */

/** 命令接口 */
export interface ICommand {
  execute(): void;
  undo(): void;
  redo(): void;
}

export interface UndoRedoOptions {
  maxHistorySize?: number;
}

/**
 * 撤销/重做管理器
 */
export class UndoRedoManager {
  private readonly undoStack: ICommand[] = [];
  private readonly redoStack: ICommand[] = [];
  private readonly maxHistorySize: number;

  constructor(options: UndoRedoOptions = {}) {
    this.maxHistorySize = options.maxHistorySize ?? 100;
  }

  /** 执行命令并加入历史 */
  execute(command: ICommand): void {
    command.execute();
    this.undoStack.push(command);
    if (this.undoStack.length > this.maxHistorySize) {
      this.undoStack.shift();
    }
    this.redoStack.length = 0;
  }

  /** 撤销 */
  undo(): boolean {
    const command = this.undoStack.pop();
    if (!command) return false;
    command.undo();
    this.redoStack.push(command);
    return true;
  }

  /** 重做 */
  redo(): boolean {
    const command = this.redoStack.pop();
    if (!command) return false;
    command.redo();
    this.undoStack.push(command);
    return true;
  }

  /** 是否可撤销 */
  get canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  /** 是否可重做 */
  get canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  /** 清空历史 */
  clear(): void {
    this.undoStack.length = 0;
    this.redoStack.length = 0;
  }
}
