import { Vec2 } from '../geometry/Vec2';

export class Node {
  id: string;
  position: Vec2;
  edgeIds: string[] = [];

  constructor(id: string, position: Vec2) {
    this.id = id;
    this.position = position;
  }

  addEdge(edgeId: string): void {
    if (!this.edgeIds.includes(edgeId)) {
      this.edgeIds.push(edgeId);
    }
  }

  removeEdge(edgeId: string): void {
    const index = this.edgeIds.indexOf(edgeId);
    if (index !== -1) {
      this.edgeIds.splice(index, 1);
    }
  }

  getDegree(): number {
    return this.edgeIds.length;
  }

  clone(): Node {
    const node = new Node(this.id, this.position.clone());
    node.edgeIds = [...this.edgeIds];
    return node;
  }

  toJSON(): any {
    return {
      id: this.id,
      position: this.position.toArray(),
      edgeIds: this.edgeIds
    };
  }

  static fromJSON(data: any): Node {
    const node = new Node(data.id, Vec2.fromArray(data.position));
    node.edgeIds = data.edgeIds || [];
    return node;
  }
}
