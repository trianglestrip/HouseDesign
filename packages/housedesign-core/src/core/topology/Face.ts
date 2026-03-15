export class Face {
  id: string;
  outerHalfEdgeId?: string;
  innerHalfEdgeIds: string[] = [];
  metadata?: Record<string, any>;

  constructor(id: string) {
    this.id = id;
  }

  setOuterBoundary(halfEdgeId: string): void {
    this.outerHalfEdgeId = halfEdgeId;
  }

  addInnerBoundary(halfEdgeId: string): void {
    if (!this.innerHalfEdgeIds.includes(halfEdgeId)) {
      this.innerHalfEdgeIds.push(halfEdgeId);
    }
  }

  removeInnerBoundary(halfEdgeId: string): void {
    const index = this.innerHalfEdgeIds.indexOf(halfEdgeId);
    if (index !== -1) {
      this.innerHalfEdgeIds.splice(index, 1);
    }
  }

  clone(): Face {
    const face = new Face(this.id);
    face.outerHalfEdgeId = this.outerHalfEdgeId;
    face.innerHalfEdgeIds = [...this.innerHalfEdgeIds];
    face.metadata = this.metadata ? { ...this.metadata } : undefined;
    return face;
  }

  toJSON(): any {
    return {
      id: this.id,
      outerHalfEdgeId: this.outerHalfEdgeId,
      innerHalfEdgeIds: this.innerHalfEdgeIds,
      metadata: this.metadata
    };
  }

  static fromJSON(data: any): Face {
    const face = new Face(data.id);
    face.outerHalfEdgeId = data.outerHalfEdgeId;
    face.innerHalfEdgeIds = data.innerHalfEdgeIds || [];
    face.metadata = data.metadata;
    return face;
  }
}
