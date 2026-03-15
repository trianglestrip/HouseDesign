/**
 * 辅助线系统
 */

import type { Vec2 } from './geometry/Vec2';
import * as Vec2Math from './geometry/Vec2';

/**
 * 辅助线类型
 */
export enum AuxiliaryLineType {
  Horizontal = 'horizontal',
  Vertical = 'vertical',
  Angle = 'angle',
}

/**
 * 辅助线接口
 */
export interface AuxiliaryLine {
  id: string;
  type: AuxiliaryLineType;
  position: Vec2;      // 辅助线经过的点
  angle?: number;      // 仅angle类型使用（度）
  color: string;
  locked: boolean;     // 是否锁定（锁定后不可删除）
  visible: boolean;    // 是否可见
}

/**
 * 辅助线管理器
 */
export class AuxiliaryLineManager {
  private lines: Map<string, AuxiliaryLine> = new Map();
  private nextId = 0;

  /**
   * 添加辅助线
   */
  addLine(
    type: AuxiliaryLineType,
    position: Vec2,
    angle?: number,
    color: string = '#ff6b00'
  ): AuxiliaryLine {
    const id = `aux_line_${this.nextId++}`;
    const line: AuxiliaryLine = {
      id,
      type,
      position,
      angle,
      color,
      locked: false,
      visible: true,
    };
    
    this.lines.set(id, line);
    console.log('[辅助线] 添加:', id, type, position);
    return line;
  }

  /**
   * 删除辅助线
   */
  removeLine(id: string): boolean {
    const line = this.lines.get(id);
    if (!line) return false;
    
    if (line.locked) {
      console.warn('[辅助线] 无法删除锁定的辅助线:', id);
      return false;
    }
    
    this.lines.delete(id);
    console.log('[辅助线] 删除:', id);
    return true;
  }

  /**
   * 切换锁定状态
   */
  toggleLock(id: string): boolean {
    const line = this.lines.get(id);
    if (!line) return false;
    
    line.locked = !line.locked;
    console.log('[辅助线] 切换锁定:', id, line.locked);
    return true;
  }

  /**
   * 切换可见性
   */
  toggleVisibility(id: string): boolean {
    const line = this.lines.get(id);
    if (!line) return false;
    
    line.visible = !line.visible;
    console.log('[辅助线] 切换可见性:', id, line.visible);
    return true;
  }

  /**
   * 获取所有辅助线
   */
  getAllLines(): AuxiliaryLine[] {
    return Array.from(this.lines.values());
  }

  /**
   * 获取可见的辅助线
   */
  getVisibleLines(): AuxiliaryLine[] {
    return Array.from(this.lines.values()).filter(line => line.visible);
  }

  /**
   * 查找最近的辅助线
   */
  findNearestLine(point: Vec2, threshold: number = 20): AuxiliaryLine | null {
    let nearest: AuxiliaryLine | null = null;
    let minDistance = threshold;

    for (const line of this.lines.values()) {
      if (!line.visible) continue;

      let distance: number;

      if (line.type === AuxiliaryLineType.Horizontal) {
        // 水平线：计算到y坐标的距离
        distance = Math.abs(point.y - line.position.y);
      } else if (line.type === AuxiliaryLineType.Vertical) {
        // 垂直线：计算到x坐标的距离
        distance = Math.abs(point.x - line.position.x);
      } else {
        // 角度线：计算点到直线的距离
        if (line.angle === undefined) continue;
        
        const angleRad = (line.angle * Math.PI) / 180;
        const direction = { x: Math.cos(angleRad), y: Math.sin(angleRad) };
        const toPoint = Vec2Math.sub(point, line.position);
        
        // 点到直线的距离 = |toPoint × direction|
        distance = Math.abs(Vec2Math.cross(toPoint, direction));
      }

      if (distance < minDistance) {
        minDistance = distance;
        nearest = line;
      }
    }

    return nearest;
  }

  /**
   * 计算吸附点（如果点靠近辅助线）
   */
  snapToLine(point: Vec2, threshold: number = 20): Vec2 | null {
    const nearestLine = this.findNearestLine(point, threshold);
    if (!nearestLine) return null;

    if (nearestLine.type === AuxiliaryLineType.Horizontal) {
      return { x: point.x, y: nearestLine.position.y };
    } else if (nearestLine.type === AuxiliaryLineType.Vertical) {
      return { x: nearestLine.position.x, y: point.y };
    } else if (nearestLine.angle !== undefined) {
      // 角度线：投影到直线上
      const angleRad = (nearestLine.angle * Math.PI) / 180;
      const direction = { x: Math.cos(angleRad), y: Math.sin(angleRad) };
      const toPoint = Vec2Math.sub(point, nearestLine.position);
      const projection = Vec2Math.dot(toPoint, direction);
      
      return {
        x: nearestLine.position.x + projection * direction.x,
        y: nearestLine.position.y + projection * direction.y,
      };
    }

    return null;
  }

  /**
   * 清空所有辅助线
   */
  clear(): void {
    this.lines.clear();
    console.log('[辅助线] 清空所有辅助线');
  }

  /**
   * 序列化
   */
  toJSON(): any {
    return {
      lines: Array.from(this.lines.values()),
      nextId: this.nextId,
    };
  }

  /**
   * 反序列化
   */
  static fromJSON(data: any): AuxiliaryLineManager {
    const manager = new AuxiliaryLineManager();
    
    if (data.lines) {
      data.lines.forEach((line: AuxiliaryLine) => {
        manager.lines.set(line.id, line);
      });
    }
    
    if (data.nextId !== undefined) {
      manager.nextId = data.nextId;
    }
    
    return manager;
  }
}
