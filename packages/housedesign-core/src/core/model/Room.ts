export class Room {
  id: string;
  name: string;
  boundaryEdges: string[];
  area: number;
  metadata?: Record<string, any>;

  constructor(id: string, name: string, boundaryEdges: string[] = []) {
    this.id = id;
    this.name = name;
    this.boundaryEdges = boundaryEdges;
    this.area = 0;
  }

  addBoundaryEdge(edgeId: string): void {
    if (!this.boundaryEdges.includes(edgeId)) {
      this.boundaryEdges.push(edgeId);
    }
  }

  removeBoundaryEdge(edgeId: string): void {
    const index = this.boundaryEdges.indexOf(edgeId);
    if (index !== -1) {
      this.boundaryEdges.splice(index, 1);
    }
  }

  setArea(area: number): void {
    this.area = area;
  }

  clone(): Room {
    const room = new Room(this.id, this.name, [...this.boundaryEdges]);
    room.area = this.area;
    room.metadata = this.metadata ? { ...this.metadata } : undefined;
    return room;
  }

  toJSON(): any {
    return {
      id: this.id,
      name: this.name,
      boundaryEdges: this.boundaryEdges,
      area: this.area,
      metadata: this.metadata
    };
  }

  static fromJSON(data: any): Room {
    const room = new Room(data.id, data.name, data.boundaryEdges || []);
    room.area = data.area || 0;
    room.metadata = data.metadata;
    return room;
  }
}
