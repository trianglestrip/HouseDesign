/**
 * 墙体相关的Command类
 */

import type { ICommand } from '../UndoRedo';
import type { GeometryKernel } from '../GeometryKernel';
import type { Vec2 } from '../geometry/Vec2';

/**
 * 创建墙体命令
 */
export class CreateWallCommand implements ICommand {
  private wallId?: string;

  constructor(
    private kernel: GeometryKernel,
    private start: Vec2,
    private end: Vec2,
    private thickness: number
  ) {}

  execute(): void {
    const result = this.kernel.createWall(this.start, this.end, this.thickness);
    this.wallId = result.wall.id;
  }

  undo(): void {
    if (this.wallId) {
      this.kernel.deleteWall(this.wallId);
    }
  }

  redo(): void {
    this.execute();
  }
}

/**
 * 删除墙体命令
 */
export class DeleteWallCommand implements ICommand {
  private wallData?: {
    thickness: number;
    nodeAPos: Vec2;
    nodeBPos: Vec2;
  };

  constructor(
    private kernel: GeometryKernel,
    private wallId: string
  ) {}

  execute(): void {
    const wall = this.kernel.getWall(this.wallId);
    if (!wall) return;

    const edge = this.kernel.getTopology().getEdge(wall.edgeId);
    if (!edge) return;

    const nodeA = this.kernel.getTopology().getNode(edge.nodeA);
    const nodeB = this.kernel.getTopology().getNode(edge.nodeB);
    if (!nodeA || !nodeB) return;

    // 保存数据用于撤销
    this.wallData = {
      thickness: wall.thickness,
      nodeAPos: { ...nodeA.position },
      nodeBPos: { ...nodeB.position },
    };

    this.kernel.deleteWall(this.wallId);
  }

  undo(): void {
    if (!this.wallData) return;

    // 重新创建墙体
    this.kernel.createWall(
      this.wallData.nodeAPos,
      this.wallData.nodeBPos,
      this.wallData.thickness
    );
  }

  redo(): void {
    this.execute();
  }
}

/**
 * 添加墙体点命令（连续绘制）
 */
export class AddWallPointCommand implements ICommand {
  private nodeId?: string;
  private wallId?: string;

  constructor(
    private kernel: GeometryKernel,
    private position: Vec2,
    private prevNodeId?: string,
    private thickness: number = 200
  ) {}

  execute(): void {
    const result = this.kernel.addWallPoint(this.position, this.prevNodeId, this.thickness);
    this.nodeId = result.node.id;
    this.wallId = result.wall?.id;
  }

  undo(): void {
    if (this.wallId) {
      this.kernel.deleteWall(this.wallId);
    }
    // 注意：节点可能被其他墙体共享，不能直接删除
  }

  redo(): void {
    this.execute();
  }

  getNodeId(): string | undefined {
    return this.nodeId;
  }

  getWallId(): string | undefined {
    return this.wallId;
  }
}

/**
 * 更新墙体厚度命令
 */
export class UpdateWallThicknessCommand implements ICommand {
  private oldThickness?: number;

  constructor(
    private kernel: GeometryKernel,
    private wallId: string,
    private newThickness: number
  ) {}

  execute(): void {
    const wall = this.kernel.getWall(this.wallId);
    if (!wall) return;

    this.oldThickness = wall.thickness;
    this.kernel.updateWallThickness(this.wallId, this.newThickness);
  }

  undo(): void {
    if (this.oldThickness !== undefined) {
      this.kernel.updateWallThickness(this.wallId, this.oldThickness);
    }
  }

  redo(): void {
    this.kernel.updateWallThickness(this.wallId, this.newThickness);
  }
}

/**
 * 偏移复制墙体命令
 */
export class OffsetWallCommand implements ICommand {
  private newWallId?: string;

  constructor(
    private kernel: GeometryKernel,
    private wallId: string,
    private distance: number,
    private side: 'left' | 'right'
  ) {}

  execute(): void {
    const result = this.kernel.offsetWall(this.wallId, this.distance, this.side);
    if (result) {
      this.newWallId = result.wall.id;
    }
  }

  undo(): void {
    if (this.newWallId) {
      this.kernel.deleteWall(this.newWallId);
    }
  }

  redo(): void {
    this.execute();
  }

  getNewWallId(): string | undefined {
    return this.newWallId;
  }
}
