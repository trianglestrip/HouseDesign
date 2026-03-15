import { Room } from '../../core/model/Room';
import { TopologyGraph } from '../../core/topology/TopologyGraph';
import { Vec2 } from '../../core/geometry/Vec2';
import { Polygon } from '../../core/geometry/Polygon';

export interface Room2DRenderData {
  roomId: string;
  name: string;
  vertices: Vec2[];
  area: number;
  centroid: Vec2;
}

export class Room2DAdapter {
  private room: Room;
  private topology: TopologyGraph;
  private cachedRenderData?: Room2DRenderData;

  constructor(room: Room, topology: TopologyGraph) {
    this.room = room;
    this.topology = topology;
  }

  getRenderData(): Room2DRenderData | null {
    if (this.cachedRenderData) {
      return this.cachedRenderData;
    }

    const vertices: Vec2[] = [];
    
    for (const edgeId of this.room.boundaryEdges) {
      const edge = this.topology.getEdge(edgeId);
      if (edge) {
        const startNode = this.topology.getNode(edge.startNodeId);
        if (startNode) {
          vertices.push(startNode.position);
        }
      }
    }

    if (vertices.length < 3) return null;

    const area = Polygon.area(vertices);
    const centroid = Polygon.centroid(vertices);

    this.cachedRenderData = {
      roomId: this.room.id,
      name: this.room.name,
      vertices,
      area,
      centroid
    };

    return this.cachedRenderData;
  }

  invalidateCache(): void {
    this.cachedRenderData = undefined;
  }

  getRoom(): Room {
    return this.room;
  }

  getTopology(): TopologyGraph {
    return this.topology;
  }
}
