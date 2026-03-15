import { Wall } from '../../core/model/Wall';
import { TopologyGraph } from '../../core/topology/TopologyGraph';
import { Vec2 } from '../../core/geometry/Vec2';
import { generateWallMesh, WallMeshData } from '../../core/kernel/WallMesh';

export interface Wall2DRenderData {
  wallId: string;
  centerLine: [Vec2, Vec2];
  outline1: [Vec2, Vec2];
  outline2: [Vec2, Vec2];
  polygon: Vec2[];
  thickness: number;
  style: string;
  color?: string;
}

export class Wall2DAdapter {
  private wall: Wall;
  private topology: TopologyGraph;
  private cachedRenderData?: Wall2DRenderData;

  constructor(wall: Wall, topology: TopologyGraph) {
    this.wall = wall;
    this.topology = topology;
  }

  getRenderData(): Wall2DRenderData | null {
    if (this.cachedRenderData) {
      return this.cachedRenderData;
    }

    const centerEdge = this.topology.getEdge(this.wall.centerEdgeId);
    if (!centerEdge) return null;

    const startNode = this.topology.getNode(centerEdge.startNodeId);
    const endNode = this.topology.getNode(centerEdge.endNodeId);
    
    if (!startNode || !endNode) return null;

    const mesh = generateWallMesh(
      startNode.position,
      endNode.position,
      this.wall.thickness
    );

    this.cachedRenderData = {
      wallId: this.wall.id,
      centerLine: mesh.centerLine,
      outline1: mesh.outline1,
      outline2: mesh.outline2,
      polygon: mesh.polygon,
      thickness: this.wall.thickness,
      style: this.wall.style,
      color: this.wall.color
    };

    return this.cachedRenderData;
  }

  invalidateCache(): void {
    this.cachedRenderData = undefined;
  }

  getWall(): Wall {
    return this.wall;
  }

  getTopology(): TopologyGraph {
    return this.topology;
  }
}
