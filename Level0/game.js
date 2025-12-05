// Level0/game.js
// Scene orchestration: engine, materials, lighting, audio, player, chunks,
// item spawning, interaction, redshift, flicker updates, progression.

import * as BABYLON from "babylonjs";

// If your UI uses Babylon GUI, ensure inventory.js imports babylonjs-gui where needed.
// npm install babylonjs babylonjs-gui
// Example inside inventory.js: import * as GUI from "babylonjs-gui";

import { createMaterials } from "./materials.js";
import { setupLighting, updateFlicker } from "./lighting.js";
import { setupAudio } from "./audio.js";
import { createPlayer } from "./player.js";
import { createChunkSystem } from "./chunks.js";
import { spawnItemsForChunk } from "./items.js";
import { createInventoryUI, createInventoryState } from "./inventory.js";
import { createInteraction } from "./interaction.js";
import { createRedShift } from "./redshift.js";

// Grab canvas and guard against missing DOM
const canvas = document.getElementById("renderCanvas");
if (!canvas) {
  console.error("renderCanvas not found. Ensure Level0v2.html includes <canvas id=\"renderCanvas\">.");
  throw new Error("Missing renderCanvas");
}

// Engine/scene
const engine = new BABYLON.Engine(canvas, true, { stencil: true });
const scene = new BABYLON.Scene(engine);
scene.collisionsEnabled = true;

// DEBUG: show something even if chunks fail (remove after verification)
{
  const light = new BABYLON.HemisphericLight("bootLight", new BABYLON.Vector3(0, 1, 0), scene);
  light.intensity = 0.6;
  const cam = new BABYLON.UniversalCamera("bootCam", new BABYLON.Vector3(0, 2, -6), scene);
  cam.attachControl(canvas, true);
  BABYLON.MeshBuilder.CreateBox("bootBox", { size: 1.2 }, scene).position.y = 1;
}

// Core systems
const mats = createMaterials(scene);
const { hemi } = setupLighting(scene); // keep reference if you modulate intensity elsewhere
const audio = setupAudio(scene);
const player = createPlayer(scene, canvas);
const chunks = createChunkSystem(scene, mats);
const inventoryState = createInventoryState();
const inventoryUI = createInventoryUI(); // ensure this appends to DOM or GUI layer internally
const interact = createInteraction(scene, player, inventoryState, inventoryUI);
const redshift = createRedShift(scene);

// Runtime
let lastTime = performance.now();
let redShiftTravelChunks = 0;
let lastChunkKey = null;

// Utility: spawn items for all chunks (called when new chunks appear)
function spawnItemsForVisibleChunks() {
  for (const [, chunk] of chunks.chunks) {
    if (!chunk.items) spawnItemsForChunk(chunk, scene, mats);
  }
}

// Main loop
engine.runRenderLoop(() => {
  const now = performance.now();
  const dt = (now - lastTime) / 1000;
  lastTime = now;

  // Stream chunks around player; small radius for performance
  chunks.updateStreaming(player.camera.position, 2);

  // Ensure items exist for newly created chunks
  spawnItemsForVisibleChunks();

  // Environmental heuristics (placeholder values; you can sample actual fixture data)
  const lightFactor = 0.7;
  const isolatedFactor = 0.2;

  // Player movement and meters
  player.update(dt, lightFactor, isolatedFactor);

  // Interaction pass (hover/pickable/exit)
  interact.update();

  // Red Shift state and coupling to audio
  redshift.update(dt, chunks.getVisitedCount());
  audio.setZoneIntensity(redshift.isActive() ? 1.0 : 0.5);

  // Flicker update for all fluorescent fixtures
  updateFlicker(scene, dt);

  // Red Shift progression on chunk traversal
  const cs = chunks.CHUNK_SIZE;
  const cx = Math.floor(player.camera.position.x / cs);
  const cz = Math.floor(player.camera.position.z / cs);
  const key = `${cx},${cz}`;
  if (key !== lastChunkKey) {
    if (redshift.isActive()) redShiftTravelChunks++;
    lastChunkKey = key;
  }
  if (redshift.isActive() && redShiftTravelChunks >= 5) {
    // Transition to next level when traversing ≥5 chunks during Red Shift
    window.location.href = "Level0_1.html";
  }

  // Safety: reset if player falls into pits
  if (player.camera.position.y < -0.4) {
    player.camera.position.y = 1.7;
    // Optional: camera shake or audio burst can be added here
  }

  scene.render();
});

// Resize
window.addEventListener("resize", () => engine.resize());
