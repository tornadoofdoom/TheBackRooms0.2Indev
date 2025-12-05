// Level0/items.js
// Procedural item spawning per chunk: flashlight and Almond Water.
// No external models; meshes and labels are generated. Items get usable metadata,
// spawn probabilities, and are parented to their chunk group for clean unload.

import { randForChunk } from "./utils.js";

export function spawnItemsForChunk(chunk, scene, mats) {
  if (!chunk || chunk.items) return chunk.items || [];

  const r = randForChunk(chunk.cx, chunk.cy);
  const items = [];

  // Spawn rules (tunable)
  const spawnFlashlight = r() < 0.15;     // 15% chance per chunk
  const spawnAlmond = r() < 0.25;         // 25% chance per chunk
  const safeMargin = 2.0;

  // Helper: random floor position within chunk bounds
  function randomFloorPos() {
    const x = chunk.area.x + safeMargin + r() * (chunk.area.w - safeMargin * 2);
    const z = chunk.area.z + safeMargin + r() * (chunk.area.d - safeMargin * 2);
    return new BABYLON.Vector3(x, 0.12, z);
  }

  // Flashlight: body cylinder + head ring
  function makeFlashlight() {
    const node = new BABYLON.TransformNode("flashlightNode", scene);

    const body = BABYLON.MeshBuilder.CreateCylinder("flash_body", {
      diameterTop: 0.05,
      diameterBottom: 0.05,
      height: 0.18,
      tessellation: 24
    }, scene);
    body.material = mats.flashlight;
    body.rotation.x = Math.PI / 2;
    body.parent = node;

    const head = BABYLON.MeshBuilder.CreateTorus("flash_head", {
      diameter: 0.08,
      thickness: 0.02,
      tessellation: 24
    }, scene);
    head.material = mats.flashlight;
    head.position.y = 0.0;
    head.parent = node;

    node.position = randomFloorPos();
    node.metadata = { type: "flashlight", usable: true };

    return node;
  }

  // Almond Water: bottle cylinder + cap + label dynamic texture
  function makeAlmondWater() {
    const node = new BABYLON.TransformNode("almondNode", scene);

    const bottle = BABYLON.MeshBuilder.CreateCylinder("almond_bottle", {
      diameterTop: 0.05,
      diameterBottom: 0.06,
      height: 0.22,
      tessellation: 24
    }, scene);
    bottle.material = mats.bottle;
    bottle.parent = node;

    const cap = BABYLON.MeshBuilder.CreateCylinder("almond_cap", {
      diameter: 0.055,
      height: 0.02,
      tessellation: 16
    }, scene);
    const capMat = new BABYLON.StandardMaterial("almondCapMat", scene);
    capMat.diffuseColor = new BABYLON.Color3(0.8, 0.8, 0.85);
    cap.material = capMat;
    cap.position.y = 0.12;
    cap.parent = node;

    // Label (procedural dynamic texture on a thin box)
    const labelTex = new BABYLON.DynamicTexture("almondLabel", { width: 256, height: 128 }, scene, false);
    const ctx = labelTex.getContext();
    ctx.fillStyle = "#fafafa";
    ctx.fillRect(0, 0, 256, 128);
    ctx.fillStyle = "#222";
    ctx.font = "bold 28px monospace";
    ctx.fillText("ALMOND WATER", 20, 56);
    ctx.font = "14px monospace";
    ctx.fillText("restores sanity", 20, 90);
    labelTex.update();

    const labelMat = new BABYLON.StandardMaterial("almondLabelMat", scene);
    labelMat.diffuseTexture = labelTex;
    labelMat.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);

    const label = BABYLON.MeshBuilder.CreateBox("almond_label", { width: 0.09, height: 0.05, depth: 0.002 }, scene);
    label.material = labelMat;
    label.position.set(0.0, 0.02, 0.032);
    label.parent = node;

    node.position = randomFloorPos();
    node.metadata = { type: "almond_water", usable: true, restore: 0.35 };

    return node;
  }

  if (spawnFlashlight) {
    const f = makeFlashlight();
    f.parent = chunk.node;
    items.push(f);
  }

  if (spawnAlmond) {
    const a = makeAlmondWater();
    a.parent = chunk.node;
    items.push(a);
  }

  chunk.items = items;
  return items;
}

// Optional: respawn items in a chunk (clear and re-spawn using same rules)
export function respawnItemsForChunk(chunk, scene, mats) {
  if (!chunk) return [];
  if (chunk.items) {
    for (const it of chunk.items) it.dispose();
  }
  chunk.items = null;
  return spawnItemsForChunk(chunk, scene, mats);
}
