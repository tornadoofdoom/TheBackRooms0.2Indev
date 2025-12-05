// Level0/chunks.js
// Procedural chunk system: rooms, corridors, pitfalls, exit, ceiling detail, streaming

import { vec2Key, gridToWorld, randForChunk } from "./utils.js";
import { makeFluorescent } from "./lighting.js";

const CHUNK_SIZE = 30;    // meters
const CEILING_Y = 3.0;    // ceiling height

export function createChunkSystem(scene, mats) {
  const chunks = new Map();          // key -> chunk data
  const visited = new Set();         // keys visited (for redshift, progression)
  let pitfallsCoords = null;         // single “Pitfalls” room placement
  let exitCoords = null;             // single exit placement

  // Per-chunk procedural flags
  function decide(cx, cy) {
    const r = randForChunk(cx, cy);
    return {
      hasPitfalls: r() < 0.04,
      hasExit:     r() < 0.02,
      unlit:       r() < 0.12,
      openZone:    r() < 0.18
    };
  }

  // Boundary and internal corridor walls
  function buildWalls(area, r) {
    const walls = [];
    const thickness = 0.2;

    const w = BABYLON.MeshBuilder.CreateBox("wall_w", { width: area.w, height: CEILING_Y, depth: thickness }, scene);
    w.position.set(area.x + area.w / 2, CEILING_Y / 2, area.z);
    w.material = mats.wallpaper;

    const e = w.clone("wall_e");
    e.position.set(area.x + area.w / 2, CEILING_Y / 2, area.z + area.d);

    const n = BABYLON.MeshBuilder.CreateBox("wall_n", { width: thickness, height: CEILING_Y, depth: area.d }, scene);
    n.position.set(area.x, CEILING_Y / 2, area.z + area.d / 2);
    n.material = mats.wallpaper;

    const s = n.clone("wall_s");
    s.position.x = area.x + area.w;

    walls.push(w, e, n, s);

    // Random internal segments (dead-ends, loops)
    const segCount = 2 + Math.floor(r() * 6);
    for (let i = 0; i < segCount; i++) {
      const horizontal = r() < 0.5;
      const len = 3 + Math.floor(r() * 10);
      const px = area.x + r() * (area.w - len - 2) + 1;
      const pz = area.z + r() * (area.d - len - 2) + 1;

      const seg = BABYLON.MeshBuilder.CreateBox("seg", {
        width: horizontal ? len : thickness,
        height: CEILING_Y,
        depth: horizontal ? thickness : len
      }, scene);
      seg.position.set(
        px + (horizontal ? len / 2 : 0),
        CEILING_Y / 2,
        pz + (horizontal ? 0 : len / 2)
      );
      seg.material = mats.wallpaper;
      walls.push(seg);
    }

    return walls;
  }

  // Ceiling grid with fixtures, missing tiles, exposed wires/pipes
  function buildCeiling(area, unlit, stressFactor) {
    const ceil = BABYLON.MeshBuilder.CreateGround("ceil", { width: area.w, height: area.d }, scene);
    ceil.position.set(area.x + area.w / 2, CEILING_Y, area.z + area.d / 2);
    ceil.rotation.x = Math.PI;
    ceil.material = mats.ceiling;

    const fixtures = [];
    const spacing = 4;
    for (let x = area.x + 2; x < area.x + area.w - 1; x += spacing) {
      for (let z = area.z + 2; z < area.z + area.d - 1; z += spacing) {
        const { light, mesh } = makeFluorescent(
          scene,
          new BABYLON.Vector3(x, CEILING_Y - 0.2, z),
          unlit ? 0.15 : 0.9,
          true,
          stressFactor
        );
        mesh.material = mats.fixture;
        fixtures.push({ light, mesh });
      }
    }

    // Missing tiles and exposed elements
    const holes = [];
    const wires = [];
    const pipes = [];
    const holeCount = 2 + Math.floor(Math.random() * 3);

    for (let i = 0; i < holeCount; i++) {
      const hx = area.x + 2 + Math.random() * (area.w - 4);
      const hz = area.z + 2 + Math.random() * (area.d - 4);

      // Tile hole (subtle visibility to break uniformity)
      const hole = BABYLON.MeshBuilder.CreateBox("tileHole", { width: 1.0, height: 0.05, depth: 1.0 }, scene);
      hole.position.set(hx, CEILING_Y - 0.02, hz);
      hole.material = mats.ceiling;
      hole.visibility = 0.12;
      holes.push(hole);

      // Dangling wire
      const wire = BABYLON.MeshBuilder.CreateCylinder("wire", { diameter: 0.03, height: 1.2 }, scene);
      wire.position.set(hx + (Math.random() * 0.4 - 0.2), CEILING_Y - 0.6, hz + (Math.random() * 0.4 - 0.2));
      const wireMat = new BABYLON.StandardMaterial("wireMat", scene);
      wireMat.diffuseColor = new BABYLON.Color3(0.05, 0.05, 0.05);
      wireMat.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
      wire.material = wireMat;
      wires.push(wire);

      // Pipe run
      const pipe = BABYLON.MeshBuilder.CreateTube("pipe", {
        path: [
          new BABYLON.Vector3(hx - 1.0, CEILING_Y - 0.4, hz - 0.5),
          new BABYLON.Vector3(hx + 1.0, CEILING_Y - 0.4, hz + 0.5)
        ],
        radius: 0.08,
        tessellation: 16
      }, scene);
      const pipeMat = new BABYLON.StandardMaterial("pipeMat", scene);
      pipeMat.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1);
      pipe.material = pipeMat;
      pipes.push(pipe);
    }

    return { ceil, fixtures, holes, wires, pipes };
  }

  // Damp carpeted floor with puddles
  function buildFloor(area) {
    const floor = BABYLON.MeshBuilder.CreateGround("floor", { width: area.w, height: area.d, subdivisions: 16 }, scene);
    floor.position.set(area.x + area.w / 2, 0, area.z + area.d / 2);
    floor.material = mats.carpet;

    const puddles = [];
    const count = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      const pr = 0.4 + Math.random() * 1.2;
      const px = area.x + 2 + Math.random() * (area.w - 4);
      const pz = area.z + 2 + Math.random() * (area.d - 4);
      const puddle = BABYLON.MeshBuilder.CreateDisc("puddle", { radius: pr, tessellation: 24 }, scene);
      puddle.position.set(px, 0.02, pz);
      puddle.material = mats.puddle;
      puddles.push(puddle);
    }

    return { floor, puddles };
  }

  // Special “Pitfalls” room (beams between pits, visible void below)
  function buildPitfalls(area) {
    const container = new BABYLON.TransformNode("pitfalls");
    const roomW = 20, roomD = 20;
    const originX = area.x + (area.w - roomW) / 2;
    const originZ = area.z + (area.d - roomD) / 2;

    const pitsX = 4, pitsZ = 4;
    const cellW = roomW / pitsX;
    const cellD = roomD / pitsZ;

    // Beams
    for (let ix = 0; ix <= pitsX; ix++) {
      const beam = BABYLON.MeshBuilder.CreateBox("beamX", { width: 0.6, height: 0.15, depth: roomD }, scene);
      beam.position.set(originX + ix * cellW, 0.075, originZ + roomD / 2);
      beam.material = mats.wallpaper;
      beam.parent = container;
    }
    for (let iz = 0; iz <= pitsZ; iz++) {
      const beam = BABYLON.MeshBuilder.CreateBox("beamZ", { width: roomW, height: 0.15, depth: 0.6 }, scene);
      beam.position.set(originX + roomW / 2, 0.075, originZ + iz * cellD);
      beam.material = mats.wallpaper;
      beam.parent = container;
    }

    // Pits
    const pitMeshes = [];
    for (let ix = 0; ix < pitsX; ix++) {
      for (let iz = 0; iz < pitsZ; iz++) {
        const pit = BABYLON.MeshBuilder.CreateBox("pit", { width: cellW - 0.6, height: 1.2, depth: cellD - 0.6 }, scene);
        pit.position.set(originX + ix * cellW + cellW / 2, -0.6, originZ + iz * cellD + cellD / 2);
        const voidMat = new BABYLON.StandardMaterial("voidMat", scene);
        voidMat.diffuseColor = new BABYLON.Color3(0.02, 0.02, 0.02);
        voidMat.specularColor = new BABYLON.Color3(0, 0, 0);
        pit.material = voidMat;
        pit.parent = container;
        pitMeshes.push(pit);
      }
    }

    // Overhead lights for eerie shadows
    const fixtures = [];
    const spacing = 5;
    for (let x = originX + 2; x < originX + roomW - 1; x += spacing) {
      for (let z = originZ + 2; z < originZ + roomD - 1; z += spacing) {
        const { light, mesh } = makeFluorescent(scene, new BABYLON.Vector3(x, CEILING_Y - 0.2, z), 0.8, true, 0.3);
        mesh.material = mats.fixture;
        fixtures.push({ light, mesh });
      }
    }

    return { node: container, pitMeshes, fixtures, bounds: { x: originX, z: originZ, w: roomW, d: roomD } };
  }

  // Unique exit door with discolored frame and local light
  function buildExitDoor(area) {
    const doorW = 1.0, doorH = 2.2, depth = 0.1;
    const door = BABYLON.MeshBuilder.CreateBox("exitDoor", { width: doorW, height: doorH, depth }, scene);
    door.position.set(area.x + area.w - 2, 1.1, area.z + area.d - 2);

    const frame = BABYLON.MeshBuilder.CreateBox("exitFrame", { width: 1.2, height: 2.4, depth: 0.15 }, scene);
    frame.position.copyFrom(door.position);
    frame.position.z -= 0.01;
    frame.material = mats.wallpaper;
    frame.material.diffuseColor = new BABYLON.Color3(0.8, 0.75, 0.5);

    const { light } = makeFluorescent(scene, new BABYLON.Vector3(door.position.x, CEILING_Y - 0.2, door.position.z), 0.6, true, 0.8);
    light.diffuse = new BABYLON.Color3(1.0, 0.95, 0.8);

    door.metadata = { isExit: true };
    return { door, frame, light };
  }

  // Create and register a chunk
  function createChunk(cx, cy) {
    const key = vec2Key(cx, cy);
    if (chunks.has(key)) return chunks.get(key);

    const world = gridToWorld(cx, cy, CHUNK_SIZE);
    const area = { x: world.x, z: world.z, w: CHUNK_SIZE, d: CHUNK_SIZE };
    const r = randForChunk(cx, cy);
    const props = decide(cx, cy);
    const group = new BABYLON.TransformNode(`chunk_${key}`, scene);

    // Stress factor increases flicker near the exit
    const stressFactor = exitCoords
      ? (Math.abs(cx - exitCoords.cx) + Math.abs(cy - exitCoords.cy) <= 1 ? 0.8 : (Math.abs(cx - exitCoords.cx) + Math.abs(cy - exitCoords.cy) <= 2 ? 0.6 : 0.0))
      : 0.0;

    const walls = buildWalls(area, r).map(w => { w.parent = group; return w; });
    const { ceil, fixtures, holes, wires, pipes } = buildCeiling(area, props.unlit, stressFactor);
    ceil.parent = group; fixtures.forEach(f => f.mesh.parent = group);
    holes.forEach(h => h.parent = group); wires.forEach(w => w.parent = group); pipes.forEach(p => p.parent = group);

    const { floor, puddles } = buildFloor(area);
    floor.parent = group; puddles.forEach(p => p.parent = group);

    let pitfalls = null;
    if (props.hasPitfalls && !pitfallsCoords) {
      pitfalls = buildPitfalls(area);
      pitfalls.node.parent = group;
      pitfallsCoords = { cx, cy, bounds: pitfalls.bounds };
    }

    let exit = null;
    if (props.hasExit && !exitCoords) {
      exit = buildExitDoor(area);
      exit.door.parent = group; exit.frame.parent = group;
      exitCoords = { cx, cy, pos: exit.door.position.clone() };
    }

    const chunk = { node: group, props, walls, ceil, fixtures, holes, wires, pipes, floor, puddles, pitfalls, exit, cx, cy, area };
    chunks.set(key, chunk);
    return chunk;
  }

  // Dispose and remove a chunk
  function unloadChunk(cx, cy) {
    const key = vec2Key(cx, cy);
    const c = chunks.get(key);
    if (!c) return;
    c.node.getChildren().forEach(n => n.dispose());
    c.node.dispose();
    chunks.delete(key);
  }

  // Streaming: load visible neighborhood and unload distant chunks
  function updateStreaming(playerPos, radius = 2) {
    const cx = Math.floor(playerPos.x / CHUNK_SIZE);
    const cy = Math.floor(playerPos.z / CHUNK_SIZE);

    for (let x = cx - radius; x <= cx + radius; x++) {
      for (let y = cy - radius; y <= cy + radius; y++) {
        createChunk(x, y);
        visited.add(vec2Key(x, y));
      }
    }

    const limit = radius + 2;
    for (const [key, c] of chunks) {
      const dx = Math.abs(c.cx - cx), dy = Math.abs(c.cy - cy);
      if (dx > limit || dy > limit) unloadChunk(c.cx, c.cy);
    }
  }

  return {
    createChunk,
    unloadChunk,
    updateStreaming,
    getVisitedCount: () => visited.size,
    getExitCoords: () => exitCoords,
    getPitfalls: () => pitfallsCoords,
    CHUNK_SIZE,
    // expose internal map when needed by other systems (e.g., item spawner)
    chunks
  };
}
