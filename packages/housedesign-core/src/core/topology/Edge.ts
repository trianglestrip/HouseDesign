export class Edge {
  id: string;
  startNodeId: string;
  endNodeId: string;
  halfEdgeIds: string[] = [];
  metadata?: Record<string, any>;

  constructor(id: string, startNodeId: string, endNodeId: string) {
    this.id = id;
    this.startNodeId = startNodeId;
    this.endNodeId = endNodeId;
  }

  addHalfEdge(halfEdgeId: string): void {
    if (!this.halfEdgeIds.includes(halfEdgeId)) {
      this.halfEdgeIds.push(halfEdgeId);
    }
  }

  removeHalfEdge(halfEdgeId: string): void {
    const index = this.halfEdgeIds.indexOf(halfEdgeId);
    if (index !== -1) {
      this.halfEdgeIds.splice(index, 1);
    }
  }

  reverse(): Edge {
    return new Edge(this.id, this.endNodeId, this.startNodeId);
  }

  clone(): Edge {
    const edge = new Edge(this.id, this.startNodeId, this.endNodeId);
    edge.halfEdgeIds = [...this.halfEdgeIds];
    edge.metadata = this.metadata ? { ...this.metadata } : undefined;
    return edge;
  }

  toJSON(): any {
    return {
      id: this.id,
      startNodeId: this.startNodeId,
      endNodeId: this.endNodeId,
      halfEdgeIds: this.halfEdgeIds,
      metadata: this.metadata
    };
  }

  static fromJSON(data: any): Edge {
    const edge = new Edge(data.id, data.startNodeId, data.endNodeId);
    edge.halfEdgeIds = data.halfEdgeIds || [];
    edge.metadata = data.metadata;
    return edge;
  }
}
