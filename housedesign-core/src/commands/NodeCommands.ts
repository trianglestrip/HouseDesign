/**
 * 节点相关的Command类
 */

import type { ICommand } from '../UndoRedo';
import type { GeometryKernel } from '../GeometryKernel';
import type { Vec2 } from '../geometry/Vec2';

/**
 * 移动节点命令
 */
export class MoveNodeCommand implements ICommand {
  private oldPosition?: Vec2;

  constructor(
    private kernel: GeometryKernel,
    private nodeId: string,
    private newPosition: Vec2
  ) {}

  execute(): void {
    const node = this.kernel.getTopology().getNode(this.nodeId);
    if (!node) return;

    this.oldPosition = { ...node.position };
    this.kernel.moveNode(this.nodeId, this.newPosition);
  }

  undo(): void {
    if (this.oldPosition) {
      this.kernel.moveNode(this.nodeId, this.oldPosition);
    }
  }

  redo(): void {
    this.kernel.moveNode(this.nodeId, this.newPosition);
  }
}

/**
 * 创建节点命令
 */
export class CreateNodeCommand implements ICommand {
  private nodeId?: string;

  constructor(
    private kernel: GeometryKernel,
    private position: Vec2
  ) {}

  execute(): void {
    const node = this.kernel.getTopology().createNode(this.position);
    this.nodeId = node.id;
  }

  undo(): void {
    // TODO: 实现节点删除逻辑
    // 节点删除需要检查是否有边引用，暂时不实现
    console.warn('CreateNodeCommand.undo() not fully implemented');
  }

  redo(): void {
    this.execute();
  }

  getNodeId(): string | undefined {
    return this.nodeId;
  }
}

/**
 * 删除节点命令
 * 注意：节点通常不能单独删除，因为可能被边引用
 * 这个命令主要用于清理孤立节点
 */
export class DeleteNodeCommand implements ICommand {
  private nodeData?: {
    id: string;
    position: Vec2;
  };

  constructor(
    private kernel: GeometryKernel,
    private nodeId: string
  ) {}

  execute(): void {
    const node = this.kernel.getTopology().getNode(this.nodeId);
    if (!node) return;

    this.nodeData = {
      id: node.id,
      position: { ...node.position },
    };

    // TODO: 实现节点删除逻辑（需要检查是否有边引用）
    console.warn('DeleteNodeCommand.execute() not fully implemented');
  }

  undo(): void {
    if (this.nodeData) {
      this.kernel.getTopology().createNode(this.nodeData.position);
    }
  }

  redo(): void {
    // TODO: 实现节点删除逻辑
    console.warn('DeleteNodeCommand.redo() not fully implemented');
  }
}
