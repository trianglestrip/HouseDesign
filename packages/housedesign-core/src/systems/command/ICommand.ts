export interface ICommand {
  execute(): void;
  undo(): void;
  redo(): void;
  canUndo(): boolean;
  canRedo(): boolean;
  getDescription(): string;
}

export abstract class BaseCommand implements ICommand {
  protected executed: boolean = false;

  abstract execute(): void;
  abstract undo(): void;

  redo(): void {
    this.execute();
  }

  canUndo(): boolean {
    return this.executed;
  }

  canRedo(): boolean {
    return !this.executed;
  }

  abstract getDescription(): string;
}
