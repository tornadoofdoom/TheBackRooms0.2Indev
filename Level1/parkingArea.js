// Level1/parkingArea.js
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.155.0/build/three.module.js";

export function buildParkingArea(scene) {
  // Floor
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x333333,
    roughness: 0.9,
  });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), floorMat);
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  // Divider lines (two parallel white lines down the middle)
  const lineMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const line1 = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 40), lineMat);
  line1.rotation.x = -Math.PI / 2;
  line1.position.set(-2, 0.01, 0);
  scene.add(line1);

  const line2 = line1.clone();
  line2.position.x = 2;
  scene.add(line2);

  // Pillars
  const pillarMat = new THREE.MeshStandardMaterial({
    color: 0x555555,
    roughness: 1,
  });
  for (let x = -16; x <= 16; x += 8) {
    for (let z = -16; z <= 16; z += 8) {
      const pillar = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 6, 0.6),
        pillarMat
      );
      pillar.position.set(x, 3, z);
      scene.add(pillar);
    }
  }

  // Puddles
  const puddleMat = new THREE.MeshPhysicalMaterial({
    color: 0x222222,
    roughness: 0.1,
    metalness: 0.9,
    clearcoat: 1.0,
    transparent: true,
    opacity: 0.8,
  });
  for (let i = 0; i < 6; i++) {
    const puddle = new THREE.Mesh(
      new THREE.CircleGeometry(Math.random() * 1 + 0.5, 32),
      puddleMat
    );
    puddle.rotation.x = -Math.PI / 2;
    puddle.position.set(
      (Math.random() - 0.5) * 30,
      0.02,
      (Math.random() - 0.5) * 30
    );
    scene.add(puddle);
  }

  // Cars (placeholder boxes)
  const carBodyMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    metalness: 0.8,
    roughness: 0.3,
  });
  const windowMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 1.0,
    roughness: 0.1,
  });
  for (let i = 0; i < 5; i++) {
    const car = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(2, 1, 4), carBodyMat);
    body.position.y = 0.5;
    car.add(body);

    const window = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 0.6, 1.5),
      windowMat
    );
    window.position.set(0, 1, 0);
    car.add(window);

    car.position.set((Math.random() - 0.5) * 30, 0, (Math.random() - 0.5) * 30);
    car.userData.interactable = true;
    scene.add(car);
  }
}
