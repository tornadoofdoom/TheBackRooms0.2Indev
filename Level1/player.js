// Level1/player.js
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.155.0/build/three.module.js";

let playerObj,
  cameraRef,
  domRef,
  pointerLocked = false;

// Player state
const state = {
  pos: { x: 0, y: 0, z: 0 },
  yaw: 0,
  pitch: 0,
  speed: 2.0,
  sprintMult: 1.7,
  stamina: 1.0,
  sanity: 1.0,
  sprintDrain: 0.35,
  staminaRegen: 0.25,
  sanityDrainBase: 0.0015,
  keys: {},
};

// Settings state (default to apparition)
export const settings = {
  smilerType: "apparition",
};

export function initPlayerControls(camera, domElement) {
  cameraRef = camera;
  domRef = domElement;

  // Player pivot
  playerObj = new THREE.Object3D();
  playerObj.position.set(0, 0, 0);
  playerObj.add(cameraRef);
  cameraRef.position.set(0, 1.7, 0);

  // Pointer lock
  domRef.addEventListener("click", () => domRef.requestPointerLock());
  document.addEventListener("pointerlockchange", () => {
    pointerLocked = document.pointerLockElement === domRef;
  });
  document.addEventListener("pointerlockerror", () => {
    console.warn("Pointer lock failed");
  });

  // Mouse look
  document.addEventListener("mousemove", (e) => {
    if (!pointerLocked) return;
    const sensitivity = 0.002;
    state.yaw += e.movementX * sensitivity;
    state.pitch -= e.movementY * sensitivity; // natural: up = look up
    const limit = Math.PI / 2 - 0.01;
    state.pitch = Math.max(-limit, Math.min(limit, state.pitch));
  });

  // Keys
  window.addEventListener("keydown", (e) => {
    state.keys[e.key.toLowerCase()] = true;
  });
  window.addEventListener("keyup", (e) => {
    state.keys[e.key.toLowerCase()] = false;
  });

  // Build settings menu
  buildSettingsMenu();
}

export function updatePlayer(dt = 1 / 60) {
  const forward = { x: -Math.sin(state.yaw), z: -Math.cos(state.yaw) };
  const right = { x: Math.cos(state.yaw), z: -Math.sin(state.yaw) };

  let moveX = 0,
    moveZ = 0;
  if (state.keys["w"]) {
    moveX += forward.x;
    moveZ += forward.z;
  }
  if (state.keys["s"]) {
    moveX -= forward.x;
    moveZ -= forward.z;
  }
  if (state.keys["a"]) {
    moveX += -right.x;
    moveZ += -right.z;
  }
  if (state.keys["d"]) {
    moveX += right.x;
    moveZ += right.z;
  }

  const mag = Math.hypot(moveX, moveZ) || 1;
  moveX /= mag;
  moveZ /= mag;

  const wantsSprint = !!state.keys["shift"];
  const canSprint = state.stamina > 0.05;
  const speed = state.speed * (wantsSprint && canSprint ? state.sprintMult : 1);

  state.pos.x += moveX * speed * dt;
  state.pos.z += moveZ * speed * dt;

  if (wantsSprint && Math.abs(moveX) + Math.abs(moveZ) > 0) {
    state.stamina = Math.max(0, state.stamina - state.sprintDrain * dt);
  } else {
    state.stamina = Math.min(1, state.stamina + state.staminaRegen * dt);
  }

  state.sanity = Math.max(0, state.sanity - state.sanityDrainBase);

  // Apply transforms
  playerObj.position.set(state.pos.x, state.pos.y, state.pos.z);
  playerObj.rotation.y = state.yaw;
  cameraRef.rotation.x = state.pitch;
}

export function getPlayerState() {
  return {
    position: { x: state.pos.x, y: state.pos.y, z: state.pos.z },
    stamina: state.stamina,
    sanity: state.sanity,
  };
}

export function getPlayerObject() {
  return playerObj;
}

// --- Settings Menu ---
function buildSettingsMenu() {
  const menu = document.createElement("div");
  menu.id = "settingsMenu";
  menu.innerHTML = `
    <label><input type="radio" name="smilerType" value="apparition" checked> Apparition</label><br>
    <label><input type="radio" name="smilerType" value="model"> Model</label>
  `;
  Object.assign(menu.style, {
    position: "fixed",
    bottom: "10px",
    left: "10px",
    background: "rgba(0,0,0,0.7)",
    color: "#fff",
    padding: "8px",
    border: "1px solid #888",
    fontFamily: "monospace",
    zIndex: 20,
  });
  document.body.appendChild(menu);

  menu.querySelectorAll('input[name="smilerType"]').forEach((radio) => {
    radio.addEventListener("change", (e) => {
      settings.smilerType = e.target.value;
      console.log("Smiler type set to", settings.smilerType);
    });
  });
}
