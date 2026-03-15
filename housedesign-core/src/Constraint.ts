/**
 * 约束系统 - Constraint/ConstraintSolver
 * 合并自：constraint/Constraint.ts, ConstraintSolver.ts
 */

// ============ Constraint ============
export enum ConstraintType {
  Horizontal = 'horizontal',
  Vertical = 'vertical',
  Parallel = 'parallel',
  Perpendicular = 'perpendicular',
  EqualLength = 'equal_length',
  FixedLength = 'fixed_length',
}

export abstract class Constraint {
  id: string;
  type: ConstraintType;
  enabled: boolean = true;

  constructor(id: string, type: ConstraintType) {
    this.id = id;
    this.type = type;
  }

  abstract solve(nodes: Map<string, { x: number; y: number }>): void;
  abstract isSatisfied(nodes: Map<string, { x: number; y: number }>): boolean;
  abstract toJSON(): object;
}

export class HorizontalConstraint extends Constraint {
  edgeId: string;
  nodeA: string;
  nodeB: string;

  constructor(id: string, edgeId: string, nodeA: string, nodeB: string) {
    super(id, ConstraintType.Horizontal);
    this.edgeId = edgeId;
    this.nodeA = nodeA;
    this.nodeB = nodeB;
  }

  solve(nodes: Map<string, { x: number; y: number }>): void {
    const a = nodes.get(this.nodeA);
    const b = nodes.get(this.nodeB);
    if (!a || !b) return;

    const avgY = (a.y + b.y) / 2;
    a.y = avgY;
    b.y = avgY;
  }

  isSatisfied(nodes: Map<string, { x: number; y: number }>): boolean {
    const a = nodes.get(this.nodeA);
    const b = nodes.get(this.nodeB);
    if (!a || !b) return false;

    return Math.abs(a.y - b.y) < 1;
  }

  toJSON(): object {
    return {
      id: this.id,
      type: this.type,
      edgeId: this.edgeId,
      nodeA: this.nodeA,
      nodeB: this.nodeB,
    };
  }
}

export class VerticalConstraint extends Constraint {
  edgeId: string;
  nodeA: string;
  nodeB: string;

  constructor(id: string, edgeId: string, nodeA: string, nodeB: string) {
    super(id, ConstraintType.Vertical);
    this.edgeId = edgeId;
    this.nodeA = nodeA;
    this.nodeB = nodeB;
  }

  solve(nodes: Map<string, { x: number; y: number }>): void {
    const a = nodes.get(this.nodeA);
    const b = nodes.get(this.nodeB);
    if (!a || !b) return;

    const avgX = (a.x + b.x) / 2;
    a.x = avgX;
    b.x = avgX;
  }

  isSatisfied(nodes: Map<string, { x: number; y: number }>): boolean {
    const a = nodes.get(this.nodeA);
    const b = nodes.get(this.nodeB);
    if (!a || !b) return false;

    return Math.abs(a.x - b.x) < 1;
  }

  toJSON(): object {
    return {
      id: this.id,
      type: this.type,
      edgeId: this.edgeId,
      nodeA: this.nodeA,
      nodeB: this.nodeB,
    };
  }
}

export class FixedLengthConstraint extends Constraint {
  edgeId: string;
  nodeA: string;
  nodeB: string;
  length: number;

  constructor(id: string, edgeId: string, nodeA: string, nodeB: string, length: number) {
    super(id, ConstraintType.FixedLength);
    this.edgeId = edgeId;
    this.nodeA = nodeA;
    this.nodeB = nodeB;
    this.length = length;
  }

  solve(nodes: Map<string, { x: number; y: number }>): void {
    const a = nodes.get(this.nodeA);
    const b = nodes.get(this.nodeB);
    if (!a || !b) return;

    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const currentLength = Math.sqrt(dx * dx + dy * dy);

    if (currentLength < 1) return;

    const dir = { x: dx / currentLength, y: dy / currentLength };

    b.x = a.x + dir.x * this.length;
    b.y = a.y + dir.y * this.length;
  }

  isSatisfied(nodes: Map<string, { x: number; y: number }>): boolean {
    const a = nodes.get(this.nodeA);
    const b = nodes.get(this.nodeB);
    if (!a || !b) return false;

    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const currentLength = Math.sqrt(dx * dx + dy * dy);

    return Math.abs(currentLength - this.length) < 1;
  }

  toJSON(): object {
    return {
      id: this.id,
      type: this.type,
      edgeId: this.edgeId,
      nodeA: this.nodeA,
      nodeB: this.nodeB,
      length: this.length,
    };
  }
}

// ============ ConstraintSolver ============
export class ConstraintSolver {
  private constraints: Map<string, Constraint> = new Map();
  private maxIterations: number = 10;

  addConstraint(constraint: Constraint): void {
    this.constraints.set(constraint.id, constraint);
  }

  removeConstraint(constraintId: string): void {
    this.constraints.delete(constraintId);
  }

  solve(nodes: Map<string, { x: number; y: number }>): void {
    if (this.constraints.size === 0) return;

    for (let iter = 0; iter < this.maxIterations; iter++) {
      let allSatisfied = true;

      this.constraints.forEach((constraint) => {
        if (!constraint.enabled) return;

        if (!constraint.isSatisfied(nodes)) {
          constraint.solve(nodes);
          allSatisfied = false;
        }
      });

      if (allSatisfied) break;
    }
  }

  checkAll(nodes: Map<string, { x: number; y: number }>): boolean {
    for (const constraint of this.constraints.values()) {
      if (constraint.enabled && !constraint.isSatisfied(nodes)) {
        return false;
      }
    }
    return true;
  }

  getConstraints(): Constraint[] {
    return Array.from(this.constraints.values());
  }

  clear(): void {
    this.constraints.clear();
  }

  setMaxIterations(max: number): void {
    this.maxIterations = max;
  }
}
