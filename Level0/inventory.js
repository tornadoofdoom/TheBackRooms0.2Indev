// Level0/inventory.js
// UI and state for a simple hotbar (3) + inventory (9) with basic buttons.
// No external frameworks; pure DOM overlay. Works with interaction.js expectations.

import { makeOverlay, makeButton } from "./utils.js";

export function createInventoryState() {
  return {
    hotbar: [null, null, null],   // each item: { id, type, ref, restore? }
    inv: Array(9).fill(null),
    open: false,
    selectedHotbar: 0,
    selectedInv: 0
  };
}

export function createInventoryUI() {
  // Root overlay
  const ui = makeOverlay("invUI", `
    position: fixed; left: 50%; transform: translateX(-50%);
    bottom: 24px; background: rgba(10,10,10,0.65); color: #fff;
    padding: 10px 12px; border: 1px solid rgba(255,255,255,0.12);
    font-family: monospace; display: flex; gap: 12px; z-index: 1000; pointer-events: auto;
  `);

  // Hotbar
  const hotbar = document.createElement("div");
  hotbar.style.cssText = "display:flex; gap:6px;";
  for (let i = 0; i < 3; i++) {
    const slot = document.createElement("div");
    slot.className = "hotSlot";
    slot.dataset.index = i;
    slot.style.cssText = `
      width:64px; height:64px; background:#222; border:1px solid #555;
      display:flex; align-items:center; justify-content:center; cursor:pointer;
    `;
    slot.textContent = "-";
    hotbar.appendChild(slot);
  }

  // Inventory grid
  const inv = document.createElement("div");
  inv.style.cssText = "display:grid; grid-template-columns: repeat(9,64px); gap:6px;";
  for (let i = 0; i < 9; i++) {
    const slot = document.createElement("div");
    slot.className = "invSlot";
    slot.dataset.index = i;
    slot.style.cssText = `
      width:64px; height:64px; background:#1a1a1a; border:1px solid #444;
      display:flex; align-items:center; justify-content:center; cursor:pointer;
    `;
    slot.textContent = "-";
    inv.appendChild(slot);
  }

  // Buttons
  const buttons = document.createElement("div");
  buttons.style.cssText = "display:flex; gap:8px;";
  const btnPick = makeButton("Pick Up");
  const btnDrop = makeButton("Drop");
  const btnUse = makeButton("Use");
  const btnInteract = makeButton("Interact");
  buttons.append(btnPick, btnDrop, btnUse, btnInteract);

  // Compose
  ui.appendChild(hotbar);
  ui.appendChild(inv);
  ui.appendChild(buttons);

  // Hidden by default
  ui.style.display = "none";

  return {
    root: ui,
    hotbar,
    inv,
    buttons,
    show: () => { ui.style.display = "flex"; },
    hide: () => { ui.style.display = "none"; }
  };
}

// Optional: simple wiring to manage selected slots (visual highlight)
export function attachInventorySelection(inventoryState, ui) {
  function clearHighlights() {
    ui.hotbar.querySelectorAll(".hotSlot").forEach(el => el.style.outline = "none");
    ui.inv.querySelectorAll(".invSlot").forEach(el => el.style.outline = "none");
  }
  function highlightSelection() {
    clearHighlights();
    const h = ui.hotbar.querySelector(`.hotSlot[data-index="${inventoryState.selectedHotbar}"]`);
    const v = ui.inv.querySelector(`.invSlot[data-index="${inventoryState.selectedInv}"]`);
    if (h) h.style.outline = "2px solid #88f";
    if (v) v.style.outline = "2px solid #8f8";
  }

  ui.hotbar.addEventListener("click", (e) => {
    const slot = e.target.closest(".hotSlot");
    if (!slot) return;
    inventoryState.selectedHotbar = Number(slot.dataset.index);
    highlightSelection();
  });
  ui.inv.addEventListener("click", (e) => {
    const slot = e.target.closest(".invSlot");
    if (!slot) return;
    inventoryState.selectedInv = Number(slot.dataset.index);
    highlightSelection();
  });

  // Numeric keys to select hotbar slots quickly
  window.addEventListener("keydown", (e) => {
    if (e.code === "Digit1") inventoryState.selectedHotbar = 0;
    if (e.code === "Digit2") inventoryState.selectedHotbar = 1;
    if (e.code === "Digit3") inventoryState.selectedHotbar = 2;
    highlightSelection();
  });

  highlightSelection();
}

// Helper to refresh UI labels from state
export function renderInventory(inventoryState, ui) {
  const invSlots = ui.inv.querySelectorAll(".invSlot");
  inventoryState.inv.forEach((it, i) => {
    invSlots[i].textContent = it ? it.type : "-";
  });
  const hotSlots = ui.hotbar.querySelectorAll(".hotSlot");
  inventoryState.hotbar.forEach((it, i) => {
    hotSlots[i].textContent = it ? it.type : "-";
  });
}
