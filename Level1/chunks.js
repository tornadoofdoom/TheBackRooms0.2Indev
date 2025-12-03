// Level1/chunks.js
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.155.0/build/three.module.js";

export class ChunkManager {
  constructor(
    scene,
    { chunkSize = 12, radius = 3, materialColor = 0x1f1f1f } = {}
  ) {
    this.scene = scene;
    this.chunkSize = chunkSize;
    this.radius = radius;
    this.material = new THREE.MeshStandardMaterial({
      color: materialColor,
      roughness: 0.9,
    });
    this.active = new Map();
  }

  key(cx, cz) {
    return `${cx},${cz}`;
  }

  makeChunk(cx, cz) {
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(this.chunkSize, this.chunkSize),
      this.material
    );
    plane.rotation.x = -Math.PI / 2;
    plane.position.set(cx * this.chunkSize, 0, cz * this.chunkSize);
    plane.receiveShadow = true;
    return plane;
  }

  update(playerPos) {
    const cx = Math.floor(playerPos.x / this.chunkSize);
    const cz = Math.floor(playerPos.z / this.chunkSize);

    const needed = new Set();
    for (let dx = -this.radius; dx <= this.radius; dx++) {
      for (let dz = -this.radius; dz <= this.radius; dz++) {
        const k = this.key(cx + dx, cz + dz);
        needed.add(k);
        if (!this.active.has(k)) {
          const mesh = this.makeChunk(cx + dx, cz + dz);
          this.scene.add(mesh);
          this.active.set(k, mesh);
        }
      }
    }

    for (const [k, mesh] of this.active.entries()) {
      if (!needed.has(k)) {
        this.scene.remove(mesh);
        mesh.geometry.dispose();
        mesh.material.dispose();
        this.active.delete(k);
      }
    }
  }

  getChunkIndex(pos) {
    return {
      cx: Math.floor(pos.x / this.chunkSize),
      cz: Math.floor(pos.z / this.chunkSize),
    };
  }

  getZoneForPosition(pos) {
    const { cx, cz } = this.getChunkIndex(pos);
    return (cx + cz) % 2 === 0 ? "parking" : "hallway";
  }

  getFloorForPosition(pos) {
    return 0;
  }
}
