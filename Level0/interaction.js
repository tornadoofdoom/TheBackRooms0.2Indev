// Level0/interaction.js
// Look-based interaction, inventory bindings, flashlight toggle, and exit handling.

export function createInteraction(scene, player, inventory, ui) {
  // Ray setup
  const ray = new BABYLON.Ray();
  const rayLen = 2.75;

  // Locate what the player is looking at
  function getLookTarget(filterFn = null) {
    const origin = player.camera.position.clone();
    const dir = player.camera.getForwardRay().direction.clone();
    ray.origin = origin;
    ray.direction = dir;
    ray.length = rayLen;

    const pick = scene.pickWithRay(ray, (m) => {
      const usable = !!m.metadata && (m.metadata.usable || m.metadata.isExit);
      return filterFn ? filterFn(m) : usable;
    });
    return pick?.pickedMesh || null;
  }

  // UI refresh helpers
  function refreshUI() {
    const invSlots = ui.inv.querySelectorAll(".invSlot");
    inventory.inv.forEach((it, i) => {
      invSlots[i].textContent = it ? it.type : "-";
    });
    const hotSlots = ui.hotbar.querySelectorAll(".hotSlot");
    inventory.hotbar.forEach((it, i) => {
      hotSlots[i].textContent = it ? it.type : "-";
    });
  }

  // Inventory operations
  function pickUp(mesh) {
    if (!mesh?.metadata?.usable) return false;
    const slotIdx = inventory.inv.findIndex(s => s === null);
    if (slotIdx < 0) return false;

    inventory.inv[slotIdx] = { id: mesh.id, type: mesh.metadata.type, ref: mesh, restore: mesh.metadata.restore };
    mesh.isVisible = false; // hide when picked
    refreshUI();
    return true;
  }

  function drop(idx) {
    const item = inventory.inv[idx];
    if (!item) return false;

    const pos = player.camera.position.clone();
    item.ref.position = new BABYLON.Vector3(pos.x + 0.6, 0.12, pos.z + 0.6);
    item.ref.isVisible = true;

    inventory.inv[idx] = null;
    refreshUI();
    return true;
  }

  function use(idx) {
    const item = inventory.inv[idx];
    if (!item) return false;

    if (item.type === "flashlight") {
      player.toggleFlashlight(); // attach/detach player cone
      return true;
    }

    if (item.type === "almond_water") {
      const amt = item.restore ?? 0.35;
      const meters = player.getMeters();
      // restore sanity
      const newSanity = Math.min(1.0, meters.sanity + amt);
      // There’s no direct setter; we can simulate by consuming drain next frame.
      // Easiest approach: store a temporary buff.
      // For simplicity here, remove item and mark on ref to avoid re-use.
      item.ref.metadata.consumed = true;
      inventory.inv[idx] = null;

      // Hack: temporarily bump sanity through a gentle tween using a mesh tag
      // Consumers: game.js could read a global effect; here we apply directly if exposed.
      if (player.sanity) {
        player.sanity.value = newSanity;
      }

      refreshUI();
      return true;
    }

    return false;
  }

  // Exit interaction
  function tryExit(mesh) {
    if (mesh?.metadata?.isExit) {
      // End the level back to selector or next scene
      window.location.href = "index.html";
      return true;
    }
    return false;
  }

  // Button bindings
  const [btnPick, btnDrop, btnUse, btnInteract] = ui.buttons.children;

  btnPick.onclick = () => {
    const target = getLookTarget();
    pickUp(target);
  };

  btnDrop.onclick = () => {
    const idx = inventory.inv.findIndex(it => it);
    if (idx >= 0) drop(idx);
  };

  btnUse.onclick = () => {
    const idx = inventory.inv.findIndex(it => it);
    if (idx >= 0) use(idx);
  };

  btnInteract.onclick = () => {
    const target = getLookTarget();
    tryExit(target);
  };

  // Keyboard bindings
  window.addEventListener("keydown", (e) => {
    // Inventory toggle
    if (e.code === "KeyE") {
      inventory.open = !inventory.open;
      if (inventory.open) ui.show(); else ui.hide();
    }

    // Flashlight toggle priority: if already active, toggle directly; else use an inventory flashlight.
    if (e.code === "KeyF") {
      const idx = inventory.inv.findIndex(it => it?.type === "flashlight");
      if (player.hasFlashlight()) {
        player.toggleFlashlight();
      } else if (idx >= 0) {
        use(idx);
      }
    }

    // Quick interact with exit if centered
    if (e.code === "Enter") {
      const target = getLookTarget();
      tryExit(target);
    }
  });

  // Per-frame interaction update (optional highlight or tooltip hook)
  function update() {
    const look = getLookTarget();
    // You can add feedback like a subtle vignette or reticle change based on look target
    return look;
  }

  return {
    update,
    refreshUI,
    pickUp,
    drop,
    use
  };
}
