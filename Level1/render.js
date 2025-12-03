// Level1/render.js
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.155.0/build/three.module.js";

export async function initRendererSceneCamera({ bg = 0x0b0b0b } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  document.body.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(bg);

  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    200
  );
  camera.position.set(0, 1.7, 6);

  return { renderer, scene, camera };
}

export function addFogAndLights(scene) {
  scene.fog = new THREE.FogExp2(0x0b0b0b, 0.02);

  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambient);

  const dir = new THREE.DirectionalLight(0xffffff, 1);
  dir.position.set(5, 10, 5);
  dir.castShadow = true;
  scene.add(dir);
}
