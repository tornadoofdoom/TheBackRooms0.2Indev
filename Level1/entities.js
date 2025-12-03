// Level1/entities.js
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.155.0/build/three.module.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.155.0/examples/jsm/loaders/GLTFLoader.js";

let sceneRef = null;
let smilers = [];
const loader = new GLTFLoader();

export function initEntities(scene) {
  sceneRef = scene;
}

// Apparition fallback
function createSmilerApparition() {
  const group = new THREE.Group();
  const eyeGeo = new THREE.CircleGeometry(0.1, 32);
  const glowMat = (color, intensity) =>
    new THREE.MeshStandardMaterial({
      emissive: color,
      emissiveIntensity: intensity,
      side: THREE.DoubleSide,
    });

  const leftEye = new THREE.Mesh(eyeGeo, glowMat(0xffffff, 2.5));
  const rightEye = new THREE.Mesh(eyeGeo, glowMat(0xffffff, 2.5));
  leftEye.position.set(-0.35, 1.65, 0.01);
  rightEye.position.set(0.35, 1.65, 0.01);
  group.add(leftEye, rightEye);

  const toothGeo = new THREE.ConeGeometry(0.06, 0.15, 4);
  const whiteMat = new THREE.MeshStandardMaterial({
    emissive: 0xffffff,
    emissiveIntensity: 1.8,
  });
  for (let i = -6; i <= 6; i++) {
    const t = i / 6,
      angle = t * Math.PI * 0.5;
    const x = Math.sin(angle) * 0.55,
      y = 1.3 - Math.cos(angle) * 0.12;
    const tooth = new THREE.Mesh(toothGeo, whiteMat);
    tooth.position.set(x, y, 0.01);
    tooth.lookAt(0, y, 0);
    group.add(tooth);
  }
  group.userData = { type: "smiler", state: "idle", noAI: false };
  return group;
}

// GLB model loader
async function createSmilerModel() {
  try {
    const gltf = await loader.loadAsync("/assets/models/smiler.glb");
    const obj = gltf.scene;

    obj.scale.set(0.001, 0.001, 0.001); // scale down hard
    obj.position.set(0, 0, -20); // place away from camera

    obj.traverse((child) => {
      if (child.isMesh) {
        // force safe material if needed
        if (!(child.material instanceof THREE.MeshStandardMaterial)) {
          child.material = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });
        }
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    obj.userData = { type: "smiler", state: "idle", noAI: false };
    return obj;
  } catch (err) {
    console.error("Model load failed, using apparition fallback:", err);
    return createSmilerApparition();
  }
}

// Spawn
export async function spawnSmiler(
  position,
  { noAI = false, useModel = false } = {}
) {
  if (!sceneRef) return null;
  const obj = useModel ? await createSmilerModel() : createSmilerApparition();
  obj.position.set(position.x, position.y, position.z);
  obj.userData.noAI = noAI;
  sceneRef.add(obj);
  smilers.push(obj);
  return obj;
}

// Update
export function updateSmilers(playerPos, dt = 1 / 60, playerZone = "parking") {
  smilers.forEach((smiler) => {
    smiler.lookAt(playerPos.x, smiler.position.y, playerPos.z);
    if (smiler.userData.noAI) return;
    const dx = playerPos.x - smiler.position.x,
      dz = playerPos.z - smiler.position.z;
    const dist = Math.hypot(dx, dz);
    if (playerZone === "parking" && dist < 20) {
      smiler.userData.state = "chasing";
      const speed = 1.6;
      smiler.position.x += (dx / dist) * speed * dt;
      smiler.position.z += (dz / dist) * speed * dt;
    } else smiler.userData.state = "idle";
  });
}

export function getSmilerStats() {
  let chasing = 0,
    idle = 0;
  smilers.forEach((s) => {
    if (s.userData.noAI) return;
    if (s.userData.state === "chasing") chasing++;
    else idle++;
  });
  return { total: smilers.length, chasing, idle };
}
