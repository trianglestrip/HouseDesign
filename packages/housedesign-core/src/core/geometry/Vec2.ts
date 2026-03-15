export class Vec2 {
  constructor(public x: number, public y: number) {}

  static zero(): Vec2 {
    return new Vec2(0, 0);
  }

  static from(x: number, y: number): Vec2 {
    return new Vec2(x, y);
  }

  static fromArray(arr: [number, number]): Vec2 {
    return new Vec2(arr[0], arr[1]);
  }

  toArray(): [number, number] {
    return [this.x, this.y];
  }

  clone(): Vec2 {
    return new Vec2(this.x, this.y);
  }

  add(v: Vec2): Vec2 {
    return new Vec2(this.x + v.x, this.y + v.y);
  }

  sub(v: Vec2): Vec2 {
    return new Vec2(this.x - v.x, this.y - v.y);
  }

  mul(scalar: number): Vec2 {
    return new Vec2(this.x * scalar, this.y * scalar);
  }

  div(scalar: number): Vec2 {
    if (scalar === 0) throw new Error('Division by zero');
    return new Vec2(this.x / scalar, this.y / scalar);
  }

  dot(v: Vec2): number {
    return this.x * v.x + this.y * v.y;
  }

  cross(v: Vec2): number {
    return this.x * v.y - this.y * v.x;
  }

  length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  lengthSquared(): number {
    return this.x * this.x + this.y * this.y;
  }

  normalize(): Vec2 {
    const len = this.length();
    if (len === 0) return Vec2.zero();
    return this.div(len);
  }

  distance(v: Vec2): number {
    return this.sub(v).length();
  }

  distanceSquared(v: Vec2): number {
    return this.sub(v).lengthSquared();
  }

  perpendicular(): Vec2 {
    return new Vec2(-this.y, this.x);
  }

  angle(): number {
    return Math.atan2(this.y, this.x);
  }

  angleTo(v: Vec2): number {
    const cross = this.cross(v);
    const dot = this.dot(v);
    return Math.atan2(cross, dot);
  }

  rotate(angle: number): Vec2 {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return new Vec2(
      this.x * cos - this.y * sin,
      this.x * sin + this.y * cos
    );
  }

  lerp(v: Vec2, t: number): Vec2 {
    return this.add(v.sub(this).mul(t));
  }

  equals(v: Vec2, epsilon: number = 1e-10): boolean {
    return Math.abs(this.x - v.x) < epsilon && Math.abs(this.y - v.y) < epsilon;
  }

  toString(): string {
    return `Vec2(${this.x.toFixed(2)}, ${this.y.toFixed(2)})`;
  }
}
