export interface IRenderer3D {
  clear(): void;
  render(): void;
  setCamera(position: number[], target: number[]): void;
}

export class Renderer3D implements IRenderer3D {
  private canvas: any;

  constructor(canvas: any) {
    this.canvas = canvas;
  }

  clear(): void {
  }

  render(): void {
  }

  setCamera(position: number[], target: number[]): void {
  }
}
