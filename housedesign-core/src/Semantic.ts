/**
 * 语义对象 - Wall/Opening/Room
 * 合并自：semantic/Wall.ts, Opening.ts, Room.ts
 */

import type { Vec2 } from './geometry/Vec2';

// ============ Wall ============
export enum WallStyle {
  Solid = 'solid',
  Dashed = 'dashed',
  Double = 'double',
}

export class Wall {
  id: string;
  edgeId: string;
  thickness: number;
  height: number;
  style: WallStyle;
  openings: string[] = [];
  material?: string;
  color?: string;

  constructor(id: string, edgeId: string, thickness: number = 200) {
    this.id = id;
    this.edgeId = edgeId;
    this.thickness = thickness;
    this.height = 2800;
    this.style = WallStyle.Solid;
  }

  addOpening(openingId: string): void {
    if (!this.openings.includes(openingId)) {
      this.openings.push(openingId);
    }
  }

  removeOpening(openingId: string): void {
    const index = this.openings.indexOf(openingId);
    if (index !== -1) {
      this.openings.splice(index, 1);
    }
  }

  clone(): Wall {
    const wall = new Wall(this.id, this.edgeId, this.thickness);
    wall.height = this.height;
    wall.style = this.style;
    wall.openings = [...this.openings];
    wall.material = this.material;
    wall.color = this.color;
    return wall;
  }

  toJSON(): object {
    return {
      id: this.id,
      edgeId: this.edgeId,
      thickness: this.thickness,
      height: this.height,
      style: this.style,
      openings: this.openings,
      material: this.material,
      color: this.color,
    };
  }

  static fromJSON(data: any): Wall {
    const wall = new Wall(data.id, data.edgeId, data.thickness);
    wall.height = data.height || 2800;
    wall.style = data.style || WallStyle.Solid;
    wall.openings = data.openings || [];
    wall.material = data.material;
    wall.color = data.color;
    return wall;
  }
}

// ============ Opening ============
export enum OpeningType {
  Door = 'door',
  Window = 'window',
}

export enum DoorType {
  Single = 'single',
  Double = 'double',
  Sliding = 'sliding',
  Folding = 'folding',
}

export enum WindowType {
  Single = 'single',
  Double = 'double',
  Bay = 'bay',
  Sliding = 'sliding',
}

export class Opening {
  id: string;
  type: OpeningType;
  wallId: string;
  t: number;
  width: number;
  height: number;
  elevation: number;
  subType?: DoorType | WindowType;
  svgPath?: string;

  constructor(
    id: string,
    type: OpeningType,
    wallId: string,
    t: number,
    width: number,
    height: number
  ) {
    this.id = id;
    this.type = type;
    this.wallId = wallId;
    this.t = Math.max(0, Math.min(1, t));
    this.width = width;
    this.height = height;
    this.elevation = type === OpeningType.Door ? 0 : 900;
  }

  calculatePosition(wallStart: Vec2, wallEnd: Vec2): Vec2 {
    return {
      x: wallStart.x + (wallEnd.x - wallStart.x) * this.t,
      y: wallStart.y + (wallEnd.y - wallStart.y) * this.t,
    };
  }

  getWallRange(wallLength: number): { t1: number; t2: number } {
    const halfWidth = this.width / 2;
    const dt = halfWidth / wallLength;

    return {
      t1: Math.max(0, this.t - dt),
      t2: Math.min(1, this.t + dt),
    };
  }

  clone(): Opening {
    const opening = new Opening(this.id, this.type, this.wallId, this.t, this.width, this.height);
    opening.elevation = this.elevation;
    opening.subType = this.subType;
    opening.svgPath = this.svgPath;
    return opening;
  }

  toJSON(): object {
    return {
      id: this.id,
      type: this.type,
      wallId: this.wallId,
      t: this.t,
      width: this.width,
      height: this.height,
      elevation: this.elevation,
      subType: this.subType,
      svgPath: this.svgPath,
    };
  }

  static fromJSON(data: any): Opening {
    const opening = new Opening(data.id, data.type, data.wallId, data.t, data.width, data.height);
    opening.elevation = data.elevation || 0;
    opening.subType = data.subType;
    opening.svgPath = data.svgPath;
    return opening;
  }
}

// ============ Room ============
export enum RoomType {
  LivingRoom = 'living_room',
  Bedroom = 'bedroom',
  Kitchen = 'kitchen',
  Bathroom = 'bathroom',
  Balcony = 'balcony',
  Study = 'study',
  DiningRoom = 'dining_room',
  Corridor = 'corridor',
  Unknown = 'unknown',
}

export class Room {
  id: string;
  faceId: string;
  polygon: Vec2[];
  area: number;
  centroid: Vec2;
  type: RoomType;
  name: string;
  floor: number;

  constructor(id: string, faceId: string, polygon: Vec2[]) {
    this.id = id;
    this.faceId = faceId;
    this.polygon = polygon;
    this.area = 0;
    this.centroid = { x: 0, y: 0 };
    this.type = RoomType.Unknown;
    this.name = '未命名房间';
    this.floor = 1;
  }

  calculateArea(): number {
    if (this.polygon.length < 3) return 0;

    let area = 0;
    for (let i = 0; i < this.polygon.length; i++) {
      const j = (i + 1) % this.polygon.length;
      area += this.polygon[i].x * this.polygon[j].y;
      area -= this.polygon[j].x * this.polygon[i].y;
    }

    this.area = Math.abs(area / 2);
    return this.area;
  }

  calculateCentroid(): Vec2 {
    if (this.polygon.length === 0) return { x: 0, y: 0 };

    let cx = 0;
    let cy = 0;

    for (const p of this.polygon) {
      cx += p.x;
      cy += p.y;
    }

    this.centroid = {
      x: cx / this.polygon.length,
      y: cy / this.polygon.length,
    };

    return this.centroid;
  }

  inferType(): RoomType {
    const areaM2 = this.area / 1000000;

    if (areaM2 > 20) {
      this.type = RoomType.LivingRoom;
      this.name = '客厅';
    } else if (areaM2 > 10) {
      this.type = RoomType.Bedroom;
      this.name = '卧室';
    } else if (areaM2 > 4 && areaM2 <= 10) {
      this.type = RoomType.Kitchen;
      this.name = '厨房';
    } else if (areaM2 <= 4) {
      this.type = RoomType.Bathroom;
      this.name = '卫生间';
    } else {
      this.type = RoomType.Unknown;
      this.name = '未命名房间';
    }

    return this.type;
  }

  clone(): Room {
    const room = new Room(this.id, this.faceId, this.polygon.map((p) => ({ ...p })));
    room.area = this.area;
    room.centroid = { ...this.centroid };
    room.type = this.type;
    room.name = this.name;
    room.floor = this.floor;
    return room;
  }

  toJSON(): object {
    return {
      id: this.id,
      faceId: this.faceId,
      polygon: this.polygon,
      area: this.area,
      centroid: this.centroid,
      type: this.type,
      name: this.name,
      floor: this.floor,
    };
  }

  static fromJSON(data: any): Room {
    const room = new Room(data.id, data.faceId, data.polygon || []);
    room.area = data.area || 0;
    room.centroid = data.centroid || { x: 0, y: 0 };
    room.type = data.type || RoomType.Unknown;
    room.name = data.name || '未命名房间';
    room.floor = data.floor || 1;
    return room;
  }
}
