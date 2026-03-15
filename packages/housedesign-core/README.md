# @housedesign/core

Industrial-grade CAD/BIM core library for house design applications.

## Architecture

- **core/model**: Domain models (Wall, Room, Opening)
- **core/topology**: Topology graph structures (Node, Edge, HalfEdge, Face)
- **core/geometry**: Pure mathematical geometry operations
- **core/kernel**: Business-specific geometric algorithms
- **systems/**: Editor systems (snap, command, history, storage, constraint)
- **editor/**: Editor coordination layer
- **canvas2d/**: 2D view adapters, renderers, and tools
- **canvas3d/**: 3D view adapters and renderers (placeholder)
- **config/**: Default rendering configuration

## Installation

```bash
pnpm install
```

## Build

```bash
pnpm build
```

## Development

```bash
pnpm dev
```
