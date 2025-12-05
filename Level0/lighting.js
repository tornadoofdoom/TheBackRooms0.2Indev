// Level0/lighting.js
// Handles global lighting, fluorescent fixtures, and flicker logic

export function setupLighting(scene) {
  scene.clearColor = new BABYLON.Color3(0.02, 0.02, 0.02);
  scene.fogMode = BABYLON.Scene.FOGMODE_EXP;
  scene.fogDensity = 0.004;
  scene.fogColor = new BABYLON.Color3(0.08, 0.08, 0.08);

  const hemi = new BABYLON.HemisphericLight("hemi", new BABYLON.Vector3(0, 1, 0), scene);
  hemi.intensity = 0.2;

  const reflectionProbe = new BABYLON.ReflectionProbe("reflect", 256, scene);
  reflectionProbe.refreshRate = BABYLON.RenderTargetTexture.REFRESHRATE_RENDER_ONEEVERYFOURFRAMES;

  return { hemi, reflectionProbe };
}

// Create fluorescent fixture with optional flicker
export function makeFluorescent(scene, position, intensity = 1.0, flicker = true, stressFactor = 0.0) {
  const light = new BABYLON.SpotLight(
    `fluoro_${position.x}_${position.z}`,
    new BABYLON.Vector3(position.x, position.y, position.z),
    new BABYLON.Vector3(0, -1, 0),
    Math.PI / 3,
    12,
    scene
  );
  light.intensity = intensity;
  light.shadowEnabled = false;

  const mesh = BABYLON.MeshBuilder.CreateBox("fixtureMesh", { width: 1.2, height: 0.1, depth: 0.2 }, scene);
  mesh.position.set(position.x, position.y + 0.05, position.z);

  mesh.metadata = {
    flicker: {
      enabled: flicker,
      base: intensity,
      phase: Math.random() * Math.PI * 2,
      speed: 2.0 + Math.random() * 1.5,
      stress: stressFactor,
      timer: 0
    }
  };
  light.metadata = { fixtureMeshId: mesh.id };

  return { light, mesh };
}

// Update flicker per frame
export function updateFlicker(scene, dt) {
  for (const l of scene.lights) {
    if (!(l instanceof BABYLON.SpotLight)) continue;
    const meshId = l.metadata?.fixtureMeshId;
    const m = meshId ? scene.getMeshByID(meshId) : null;
    const f = m?.metadata?.flicker;
    if (!f?.enabled) continue;

    f.timer += dt * f.speed;
    const base = f.base;
    const noise = (Math.sin(f.timer + f.phase) + Math.sin(f.timer * 0.7)) * 0.08;
    const stressJitter = f.stress > 0 ? (Math.random() - 0.5) * 0.2 * f.stress : 0;
    const dip = Math.random() < 0.01 ? -0.5 : 0;

    l.intensity = Math.max(0, base + noise + stressJitter + dip);

    if (m.material?.emissiveColor) {
      const ePulse = 0.95 + (l.intensity - base) * 0.2;
      m.material.emissiveColor = new BABYLON.Color3(ePulse, ePulse, 0.95);
    }
  }
}
