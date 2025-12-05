// Level0/materials.js
// Procedural materials tuned for sterile, damp, reflective office vibes.
// Includes dynamic grime, damp carpet fibers, puddle clear coat, ceiling tiles,
// fluorescent fixture emissive, flashlight body, and Almond Water bottle.

export function createMaterials(scene) {
  const mats = {};

  // Wallpaper: pale mono-yellow with subtle grime, reflective patches
  const wallpaper = new BABYLON.StandardMaterial("wallpaper", scene);
  wallpaper.diffuseColor = new BABYLON.Color3(0.95, 0.93, 0.70);
  wallpaper.specularColor = new BABYLON.Color3(0.22, 0.22, 0.22);
  wallpaper.specularPower = 64;

  const wallTex = new BABYLON.DynamicTexture("wallTex", { width: 512, height: 512 }, scene, false);
  const wctx = wallTex.getContext();
  // Base tone
  wctx.fillStyle = "#f2efb3";
  wctx.fillRect(0, 0, 512, 512);
  // Subtle vertical paper texture
  for (let x = 0; x < 512; x += 2) {
    const alpha = 0.02 + Math.random() * 0.02;
    wctx.strokeStyle = `rgba(210,205,160,${alpha})`;
    wctx.beginPath();
    wctx.moveTo(x, 0);
    wctx.lineTo(x, 512);
    wctx.stroke();
  }
  // Random grime stains, torn patches hints
  for (let i = 0; i < 500; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const r = 8 + Math.random() * 36;
    wctx.fillStyle = `rgba(145,135,95,${Math.random() * 0.15})`;
    wctx.beginPath();
    wctx.arc(x, y, r, 0, Math.PI * 2);
    wctx.fill();

    if (Math.random() < 0.12) {
      // Tear hint (jagged rect)
      const w = 10 + Math.random() * 24;
      const h = 6 + Math.random() * 18;
      wctx.strokeStyle = `rgba(100,90,70,${0.3 + Math.random() * 0.2})`;
      wctx.lineWidth = 1;
      wctx.strokeRect(x - w / 2, y - h / 2, w, h);
    }
  }
  wallTex.update();
  wallpaper.diffuseTexture = wallTex;

  // Damp carpet: fiber lines, slight sheen for wet patches
  const carpet = new BABYLON.StandardMaterial("carpet", scene);
  carpet.diffuseColor = new BABYLON.Color3(0.42, 0.43, 0.44);
  carpet.specularColor = new BABYLON.Color3(0.06, 0.06, 0.06);
  carpet.specularPower = 32;

  const carpetTex = new BABYLON.DynamicTexture("carpetTex", { width: 512, height: 512 }, scene, false);
  const cctx = carpetTex.getContext();
  cctx.fillStyle = "#6b6e70";
  cctx.fillRect(0, 0, 512, 512);
  // Fiber striations
  for (let y = 0; y < 512; y += 2) {
    const jitter = (Math.random() - 0.5) * 0.8;
    cctx.strokeStyle = `rgba(255,255,255,${0.015 + Math.random() * 0.02})`;
    cctx.beginPath();
    cctx.moveTo(0, y);
    cctx.lineTo(512, y + jitter);
    cctx.stroke();
  }
  // Damp blotches
  for (let i = 0; i < 60; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const w = 10 + Math.random() * 60;
    const h = 6 + Math.random() * 40;
    cctx.fillStyle = `rgba(40,42,44,${0.08 + Math.random() * 0.12})`;
    cctx.beginPath();
    cctx.ellipse(x, y, w, h, Math.random() * Math.PI, 0, Math.PI * 2);
    cctx.fill();
  }
  carpetTex.update();
  carpet.diffuseTexture = carpetTex;

  // Puddle: thin glossy surface with clear coat and subtle tint
  const puddle = new BABYLON.PBRMaterial("puddle", scene);
  puddle.albedoColor = new BABYLON.Color3(0.18, 0.18, 0.22);
  puddle.metallic = 0.0;
  puddle.roughness = 0.05;
  puddle.clearCoat.isEnabled = true;
  puddle.clearCoat.intensity = 1.0;
  puddle.clearCoat.roughness = 0.02;

  // Ceiling tiles: neutral white with tiny speck pattern
  const ceiling = new BABYLON.StandardMaterial("ceiling", scene);
  ceiling.diffuseColor = new BABYLON.Color3(0.95, 0.95, 0.95);
  ceiling.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);

  const ceilTex = new BABYLON.DynamicTexture("ceilTex", { width: 256, height: 256 }, scene, false);
  const cc = ceilTex.getContext();
  cc.fillStyle = "#f2f2f2";
  cc.fillRect(0, 0, 256, 256);
  // Speckles
  for (let i = 0; i < 1200; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    cc.fillStyle = `rgba(200,200,200,${Math.random() * 0.5})`;
    cc.fillRect(x, y, 1, 1);
  }
  ceilTex.update();
  ceiling.diffuseTexture = ceilTex;

  // Fluorescent fixture casing
  const fixture = new BABYLON.StandardMaterial("fixture", scene);
  fixture.diffuseColor = new BABYLON.Color3(0.88, 0.88, 0.9);
  fixture.emissiveColor = new BABYLON.Color3(1.0, 1.0, 0.95);

  // Flashlight body: matte black with mild spec
  const flashlight = new BABYLON.StandardMaterial("flashlight", scene);
  flashlight.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1);
  flashlight.specularColor = new BABYLON.Color3(0.4, 0.4, 0.4);
  flashlight.specularPower = 64;

  // Almond Water bottle: semi-transparent PBR with mild gloss
  const bottle = new BABYLON.PBRMaterial("bottle", scene);
  bottle.albedoColor = new BABYLON.Color3(0.95, 0.95, 1.0);
  bottle.metallic = 0.0;
  bottle.roughness = 0.1;
  bottle.alpha = 0.65;
  bottle.transparencyMode = BABYLON.PBRMaterial.PBRMATERIAL_ALPHABLEND;

  // Export bundle
  mats.wallpaper = wallpaper;
  mats.carpet = carpet;
  mats.puddle = puddle;
  mats.ceiling = ceiling;
  mats.fixture = fixture;
  mats.flashlight = flashlight;
  mats.bottle = bottle;

  return mats;
}
