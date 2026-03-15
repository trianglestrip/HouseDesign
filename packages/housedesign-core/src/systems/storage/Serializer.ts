import { TopologyGraph } from '../../core/topology/TopologyGraph';
import { Wall } from '../../core/model/Wall';
import { Room } from '../../core/model/Room';
import { Opening } from '../../core/model/Opening';

export interface ProjectData {
  version: string;
  topology: any;
  walls: any[];
  rooms: any[];
  openings: any[];
  metadata?: Record<string, any>;
}

export class Serializer {
  static serialize(
    graph: TopologyGraph,
    walls: Map<string, Wall>,
    rooms: Map<string, Room>,
    openings: Map<string, Opening>
  ): string {
    const data: ProjectData = {
      version: '1.0.0',
      topology: graph.toJSON(),
      walls: Array.from(walls.values()).map(w => w.toJSON()),
      rooms: Array.from(rooms.values()).map(r => r.toJSON()),
      openings: Array.from(openings.values()).map(o => o.toJSON())
    };
    
    return JSON.stringify(data, null, 2);
  }

  static deserialize(json: string): {
    graph: TopologyGraph;
    walls: Map<string, Wall>;
    rooms: Map<string, Room>;
    openings: Map<string, Opening>;
  } {
    const data: ProjectData = JSON.parse(json);
    
    const graph = TopologyGraph.fromJSON(data.topology);
    
    const walls = new Map<string, Wall>();
    if (data.walls) {
      data.walls.forEach(wallData => {
        const wall = Wall.fromJSON(wallData);
        walls.set(wall.id, wall);
      });
    }
    
    const rooms = new Map<string, Room>();
    if (data.rooms) {
      data.rooms.forEach(roomData => {
        const room = Room.fromJSON(roomData);
        rooms.set(room.id, room);
      });
    }
    
    const openings = new Map<string, Opening>();
    if (data.openings) {
      data.openings.forEach(openingData => {
        const opening = Opening.fromJSON(openingData);
        openings.set(opening.id, opening);
      });
    }
    
    return { graph, walls, rooms, openings };
  }

  static serializeToFile(
    graph: TopologyGraph,
    walls: Map<string, Wall>,
    rooms: Map<string, Room>,
    openings: Map<string, Opening>,
    filename: string
  ): Blob {
    const json = this.serialize(graph, walls, rooms, openings);
    return new Blob([json], { type: 'application/json' });
  }

  static async deserializeFromFile(file: File): Promise<{
    graph: TopologyGraph;
    walls: Map<string, Wall>;
    rooms: Map<string, Room>;
    openings: Map<string, Opening>;
  }> {
    const text = await file.text();
    return this.deserialize(text);
  }
}
