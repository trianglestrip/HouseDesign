export class HalfEdge {
  id: string;
  edgeId: string;
  faceId?: string;
  nextHalfEdgeId?: string;
  prevHalfEdgeId?: string;
  twinHalfEdgeId?: string;

  constructor(id: string, edgeId: string) {
    this.id = id;
    this.edgeId = edgeId;
  }

  setFace(faceId: string): void {
    this.faceId = faceId;
  }

  setNext(nextHalfEdgeId: string): void {
    this.nextHalfEdgeId = nextHalfEdgeId;
  }

  setPrev(prevHalfEdgeId: string): void {
    this.prevHalfEdgeId = prevHalfEdgeId;
  }

  setTwin(twinHalfEdgeId: string): void {
    this.twinHalfEdgeId = twinHalfEdgeId;
  }

  clone(): HalfEdge {
    const halfEdge = new HalfEdge(this.id, this.edgeId);
    halfEdge.faceId = this.faceId;
    halfEdge.nextHalfEdgeId = this.nextHalfEdgeId;
    halfEdge.prevHalfEdgeId = this.prevHalfEdgeId;
    halfEdge.twinHalfEdgeId = this.twinHalfEdgeId;
    return halfEdge;
  }

  toJSON(): any {
    return {
      id: this.id,
      edgeId: this.edgeId,
      faceId: this.faceId,
      nextHalfEdgeId: this.nextHalfEdgeId,
      prevHalfEdgeId: this.prevHalfEdgeId,
      twinHalfEdgeId: this.twinHalfEdgeId
    };
  }

  static fromJSON(data: any): HalfEdge {
    const halfEdge = new HalfEdge(data.id, data.edgeId);
    halfEdge.faceId = data.faceId;
    halfEdge.nextHalfEdgeId = data.nextHalfEdgeId;
    halfEdge.prevHalfEdgeId = data.prevHalfEdgeId;
    halfEdge.twinHalfEdgeId = data.twinHalfEdgeId;
    return halfEdge;
  }
}
