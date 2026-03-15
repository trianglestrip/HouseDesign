import { Wall } from '../../core/model/Wall';
import { TopologyGraph } from '../../core/topology/TopologyGraph';

export interface Wall3DRenderData {
  wallId: string;
  vertices: number[];
  indices: number[];
  normals: number[];
  uvs: number[];
}

export class Wall3DAdapter {
  private wall: Wall;
  private topology: TopologyGraph;

  constructor(wall: Wall, topology: TopologyGraph) {
    this.wall = wall;
    this.topology = topology;
  }

  getRenderData(): Wall3DRenderData | null {
    return null;
  }

  getWall(): Wall {
    return this.wall;
  }

  getTopology(): TopologyGraph {
    return this.topology;
  }
}
