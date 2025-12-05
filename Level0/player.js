// Level0/player.js
// First-person controller: WASD + mouse look, jump/crouch/sprint, stamina/sanity,
// and a shadowed flashlight cone bound to the camera.

import { clamp } from "./utils.js";

export function createPlayer(scene, canvas) {
  // Camera setup
  const camera = new BABYLON.UniversalCamera("playerCam", new BABYLON.Vector3(0, 1.7, 0), scene);
  camera.attachControl(canvas, true);
  camera.inertia = 0.7;
  camera.speed = 0.25;
  camera.angularSensibility = 2800;
  camera.applyGravity = true;
  camera.ellipsoid = new BABYLON.Vector3(0.4, 0.9, 0.4);
  scene.gravity = new BABYLON.Vector3(0, -0.9, 0);

  // Input state
  const keys = {
    w: false, a: false, s: false, d: false,
    shift: false, space: false, ctrl: false
  };

  window.addEventListener("keydown", (e) => {
    if (e.code === "KeyW") keys.w = true;
    if (e.code === "KeyA") keys.a = true;
    if (e.code === "KeyS") keys.s = true;
    if (e.code === "KeyD") keys.d = true;
    if (e.code === "ShiftLeft" || e.code === "ShiftRight") keys.shift = true;
    if (e.code === "Space") keys.space = true;
    if (e.code === "ControlLeft" || e.code === "ControlRight") keys.ctrl = true;
  });
  window.addEventListener("keyup", (e) => {
    if (e.code === "KeyW") keys.w = false;
    if (e.code === "KeyA") keys.a = false;
    if (e.code === "KeyS") keys.s = false;
    if (e.code === "KeyD") keys.d = false;
    if (e.code === "ShiftLeft" || e.code === "ShiftRight") keys.shift = false;
    if (e.code === "Space") keys.space = false;
    if (e.code === "ControlLeft" || e.code === "ControlRight") keys.ctrl = false;
  });

  // Movement & meters
  const stamina = { value: 1.0, drain: 0.35, regen: 0.25 };
  const sanity = { value: 1.0, drainBase: 0.001, drainDark: 0.003 };

  let onGround = true;
  let vy = 0;
  let targetEye = 1.7; // crouch/stand target eye height
  let flashlight = null; // { light, sg }

  // Flashlight helpers
  function makeFlashlight(scene, camera) {
    const light = new BABYLON.SpotLight("playerFlashlight", camera.position, camera.getForwardRay().direction, Math.PI / 10, 12, scene);
    light.intensity = 2.2;
    light.range = 25;
    light.shadowEnabled = true;
    light.angle = Math.PI / 9;
    light.direction = camera.getForwardRay().direction;
    light.diffuse = new BABYLON.Color3(1.0, 1.0, 0.95);

    const sg = new BABYLON.ShadowGenerator(1024, light);
    sg.usePoissonSampling = true;
    sg.darkness = 0.6;

    return { light, sg };
  }

  function updateFlashlight(flash, camera) {
    if (!flash) return;
    flash.light.position.copyFrom(camera.position);
    flash.light.direction = camera.getForwardRay().direction;
  }

  // Per-frame update
  function update(dt, lightFactor = 1.0, isolatedFactor = 0.0) {
    // Movement vector from camera axes
    const forward = camera.getDirection(BABYLON.Axis.Z);
    const right = camera.getDirection(BABYLON.Axis.X);

    let move = new BABYLON.Vector3(0, 0, 0);
    if (keys.w) move = move.add(forward);
    if (keys.s) move = move.subtract(forward);
    if (keys.a) move = move.subtract(right);
    if (keys.d) move = move.add(right);
    move.y = 0;
    if (move.lengthSquared() > 0) move.normalize();

    // Crouch and eye height
    const crouching = keys.ctrl;
    const standEye = 1.7;
    const crouchEye = 1.3;
    targetEye = crouching ? crouchEye : standEye;
    camera.position.y = BABYLON.Scalar.Lerp(camera.position.y, targetEye, Math.min(1, dt * 12));

    // Sprint logic
    const canSprint = stamina.value > 0.15 && !crouching;
    const sprinting = keys.shift && canSprint;
    const baseSpeed = crouching ? 0.15 : 0.25;
    camera.speed = sprinting ? baseSpeed * 1.5 : baseSpeed;

    // Jump
    if (keys.space && onGround) {
      vy = 0.22;
      onGround = false;
    }

    // Gravity
    vy -= dt * 0.75;
    camera.position.y += vy;

    // Ground collision clamp
    const footY = crouching ? crouchEye : standEye;
    if (camera.position.y <= footY) {
      camera.position.y = footY;
      vy = 0;
      onGround = true;
    }

    // Apply horizontal movement (simple add; collisions handled by ellipsoid)
    camera.position.addInPlace(move.scale(camera.speed));

    // Stamina meter
    stamina.value += sprinting ? -stamina.drain * dt : stamina.regen * dt;
    stamina.value = clamp(stamina.value, 0, 1);

    // Sanity drain: dark + isolation increase rate
    const drainRate = sanity.drainBase + (1 - lightFactor) * sanity.drainDark + isolatedFactor * 0.002;
    sanity.value = clamp(sanity.value - drainRate * dt, 0, 1);

    // Flashlight follow
    updateFlashlight(flashlight, camera);
  }

  // Public API
  return {
    camera,
    keys,
    stamina,
    sanity,
    update,
    toggleFlashlight: () => {
      if (!flashlight) {
        flashlight = makeFlashlight(scene, camera);
      } else {
        flashlight.sg.dispose();
        flashlight.light.dispose();
        flashlight = null;
      }
    },
    hasFlashlight: () => !!flashlight,
    getMeters: () => ({ stamina: stamina.value, sanity: sanity.value })
  };
}
