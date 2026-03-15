import { WallStyle } from './WallStyle';

export class Wall {
  id: string;
  centerEdgeId: string;
  outline1EdgeId?: string;
  outline2EdgeId?: string;
  thickness: number;
  height: number;
  style: WallStyle;
  openings: string[] = [];
  material?: string;
  color?: string;

  constructor(
    id: string,
    centerEdgeId: string,
    thickness: number = 200,
    height: number = 2800
  ) {
    this.id = id;
    this.centerEdgeId = centerEdgeId;
    this.thickness = thickness;
    this.height = height;
    this.style = WallStyle.Normal;
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
    const wall = new Wall(this.id, this.centerEdgeId, this.thickness, this.height);
    wall.outline1EdgeId = this.outline1EdgeId;
    wall.outline2EdgeId = this.outline2EdgeId;
    wall.style = this.style;
    wall.openings = [...this.openings];
    wall.material = this.material;
    wall.color = this.color;
    return wall;
  }

  toJSON(): any {
    return {
      id: this.id,
      centerEdgeId: this.centerEdgeId,
      outline1EdgeId: this.outline1EdgeId,
      outline2EdgeId: this.outline2EdgeId,
      thickness: this.thickness,
      height: this.height,
      style: this.style,
      openings: this.openings,
      material: this.material,
      color: this.color
    };
  }

  static fromJSON(data: any): Wall {
    const wall = new Wall(
      data.id,
      data.centerEdgeId,
      data.thickness ?? 200,
      data.height ?? 2800
    );
    wall.outline1EdgeId = data.outline1EdgeId;
    wall.outline2EdgeId = data.outline2EdgeId;
    wall.style = data.style ?? WallStyle.Normal;
    wall.openings = data.openings ?? [];
    wall.material = data.material;
    wall.color = data.color;
    return wall;
  }
}
