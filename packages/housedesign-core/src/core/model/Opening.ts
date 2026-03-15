export enum OpeningType {
  Door = 'door',
  Window = 'window',
  Arch = 'arch'
}

export interface OpeningSize {
  width: number;
  height: number;
}

export class Opening {
  id: string;
  wallId: string;
  type: OpeningType;
  position: number;
  size: OpeningSize;
  metadata?: Record<string, any>;

  constructor(
    id: string,
    wallId: string,
    type: OpeningType,
    position: number,
    size: OpeningSize
  ) {
    this.id = id;
    this.wallId = wallId;
    this.type = type;
    this.position = position;
    this.size = size;
  }

  clone(): Opening {
    const opening = new Opening(
      this.id,
      this.wallId,
      this.type,
      this.position,
      { ...this.size }
    );
    opening.metadata = this.metadata ? { ...this.metadata } : undefined;
    return opening;
  }

  toJSON(): any {
    return {
      id: this.id,
      wallId: this.wallId,
      type: this.type,
      position: this.position,
      size: this.size,
      metadata: this.metadata
    };
  }

  static fromJSON(data: any): Opening {
    const opening = new Opening(
      data.id,
      data.wallId,
      data.type,
      data.position,
      data.size
    );
    opening.metadata = data.metadata;
    return opening;
  }
}
