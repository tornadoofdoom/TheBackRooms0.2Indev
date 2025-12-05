// Level0/redshift.js
// Progressive environmental shift after sustained exploration.
// Adds red-tinged fog/clearColor, optional luminance falloff and coupling hooks
// for flashlight tint and shadow darkness. Triggers progression after traversal.

export function createRedShift(scene, opts = {}) {
  // Config
  const cfg = {
    visitThreshold: 20,   // chunks visited before Red Shift begins
    travelThreshold: 5,   // chunks to traverse while active to trigger next level
    fogColorBase: new BABYLON.Color3(0.08, 0.08, 0.08),
    fogColorRed: new BABYLON.Color3(0.08, 0.02, 0.02),
    clearBase: new BABYLON.Color3(0.02, 0.02, 0.02),
    clearRedMin: new BABYLON.Color3(0.08, 0.01, 0.01),
    progressRate: 0.015,  // speed of visual ramp
    flashlightTint: new BABYLON.Color3(1.0, 0.92, 0.92),
    shadowDarknessBoost: 0.1,
    onBegin: null,        // callback when Red Shift begins
    onProgress: null,     // callback during active updates
    onTrigger: null,      // callback when progression threshold reached
    ...opts
  };

  // State
  let active = false;
  let progress = 0;         // 0..1 visual ramp
  let travelChunks = 0;     // chunks traversed while active
  let lastKey = null;       // last chunk key for traversal counting

  // Begin Red Shift visuals
  function begin() {
    if (active) return;
    active = true;
    progress = 0;
    scene.fogColor = cfg.fogColorRed.clone();
    if (typeof cfg.onBegin === "function") cfg.onBegin({ progress, active: true });
  }

  // End/reset Red Shift (not used by default, but provided for future control)
  function end() {
    if (!active) return;
    active = false;
    progress = 0;
    scene.fogColor = cfg.fogColorBase.clone();
    scene.clearColor = cfg.clearBase.clone();
  }

  // Visual ramp
  function applyVisuals(dt) {
    if (!active) return;
    progress = Math.min(1, progress + dt * cfg.progressRate);
    const r = progress;

    // Clear color ramps toward red min
    const clear = new BABYLON.Color3(
      BABYLON.Scalar.Lerp(cfg.clearBase.r, cfg.clearRedMin.r, r),
      BABYLON.Scalar.Lerp(cfg.clearBase.g, cfg.clearRedMin.g, r),
      BABYLON.Scalar.Lerp(cfg.clearBase.b, cfg.clearRedMin.b, r)
    );
    scene.clearColor = clear;

    // Optional per-frame hook
    if (typeof cfg.onProgress === "function") cfg.onProgress({ progress });
  }

  // Public update: pass dt and visited count,
  // plus current chunk indices to count traversal during Red Shift.
  function update(dt, visitedCount, cx = null, cy = null) {
    if (!active && visitedCount >= cfg.visitThreshold) begin();
    applyVisuals(dt);

    if (active && cx !== null && cy !== null) {
      const key = `${cx},${cy}`;
      if (key !== lastKey) {
        travelChunks++;
        lastKey = key;
      }
      if (travelChunks >= cfg.travelThreshold) {
        if (typeof cfg.onTrigger === "function") {
          cfg.onTrigger({ travelChunks, progress });
        } else {
          // Default progression: navigate to next level file
          window.location.href = "Level0_1.html";
        }
      }
    }
  }

  // Optional coupling: tint flashlight and adjust shadow darkness while active
  function applyFlashlightCoupling(flashlight) {
    if (!flashlight || !flashlight.light) return;
    if (active) {
      flashlight.light.diffuse = cfg.flashlightTint.clone();
      if (flashlight.sg) flashlight.sg.darkness = Math.min(1.0, 0.6 + cfg.shadowDarknessBoost);
    } else {
      flashlight.light.diffuse = new BABYLON.Color3(1.0, 1.0, 0.95);
      if (flashlight.sg) flashlight.sg.darkness = 0.6;
    }
  }

  // Reset traversal counters (useful when reloading level or debugging)
  function resetTraversal() {
    travelChunks = 0;
    lastKey = null;
  }

  return {
    isActive: () => active,
    progress: () => progress,
    travelChunks: () => travelChunks,
    update,
    resetTraversal,
    begin,
    end,
    applyFlashlightCoupling
  };
}
