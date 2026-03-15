import { Vec2 } from '../../core/geometry/Vec2';

export enum ConstraintType {
  Horizontal = 'horizontal',
  Vertical = 'vertical',
  Parallel = 'parallel',
  Perpendicular = 'perpendicular',
  Distance = 'distance',
  Angle = 'angle'
}

export interface Constraint {
  type: ConstraintType;
  entityIds: string[];
  value?: number;
}

export class ConstraintSolver {
  private constraints: Map<string, Constraint> = new Map();

  addConstraint(id: string, constraint: Constraint): void {
    this.constraints.set(id, constraint);
  }

  removeConstraint(id: string): void {
    this.constraints.delete(id);
  }

  getConstraint(id: string): Constraint | undefined {
    return this.constraints.get(id);
  }

  getAllConstraints(): Constraint[] {
    return Array.from(this.constraints.values());
  }

  solve(): boolean {
    return true;
  }

  clear(): void {
    this.constraints.clear();
  }
}
