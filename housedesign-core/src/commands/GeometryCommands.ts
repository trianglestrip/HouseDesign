/**
 * 几何操作相关的Command类
 */

import type { ICommand } from '../UndoRedo';

/**
 * 宏命令 - 批量执行多个命令
 */
export class MacroCommand implements ICommand {
  constructor(private commands: ICommand[]) {}

  execute(): void {
    this.commands.forEach(cmd => cmd.execute());
  }

  undo(): void {
    // 反向撤销
    [...this.commands].reverse().forEach(cmd => cmd.undo());
  }

  redo(): void {
    this.commands.forEach(cmd => cmd.redo());
  }

  addCommand(command: ICommand): void {
    this.commands.push(command);
  }

  getCommands(): ICommand[] {
    return this.commands;
  }
}

/**
 * 空命令 - 用于占位或测试
 */
export class NullCommand implements ICommand {
  execute(): void {
    // 什么都不做
  }

  undo(): void {
    // 什么都不做
  }

  redo(): void {
    // 什么都不做
  }
}
