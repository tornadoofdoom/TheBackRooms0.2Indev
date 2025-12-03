// Level1/inventory.js
const hotbar = [{ id: null }, { id: null }, { id: null }];
const inventory = new Array(9).fill(null);

let activeHotbar = 0;
let selectedIndex = 0;
let panelOpen = false;

export function initInventory() {
  renderHotbar();
  renderInventory();
}

export function addTestItems() {
  hotbar[0] = { id: "flashlight", name: "Flashlight" };
  inventory[0] = { id: "almond", name: "Almond Water" };
  renderHotbar();
  renderInventory();
}

export function toggleInventory() {
  panelOpen = !panelOpen;
  document.getElementById("inventoryPanel").style.display = panelOpen
    ? "block"
    : "none";
}

export function setActiveHotbarIndex(i) {
  activeHotbar = Math.max(0, Math.min(2, i));
  renderHotbar();
}

export function useSelected() {
  if (panelOpen) {
    const item = inventory[selectedIndex];
    if (!item) return;
    if (item.id === "almond") {
      window.dispatchEvent(
        new CustomEvent("set-sanity", { detail: { value: 1.0 } })
      );
      inventory[selectedIndex] = null;
      renderInventory();
    }
  } else {
    const item = hotbar[activeHotbar];
    if (!item) return;
    if (item.id === "flashlight") {
      window.dispatchEvent(new CustomEvent("toggle-flashlight"));
    }
  }
}

export function dropSelected() {
  if (!panelOpen) return;
  inventory[selectedIndex] = null;
  renderInventory();
}

function renderHotbar() {
  const slots = Array.from(document.querySelectorAll("#hotbar .slot"));
  slots.forEach((el, i) => {
    el.classList.toggle("active", i === activeHotbar);
    const item = hotbar[i];
    el.textContent = item?.name ? item.name : String(i + 1);
  });
}

function renderInventory() {
  const grid = document.getElementById("inventoryGrid");
  grid.innerHTML = "";
  inventory.forEach((item, i) => {
    const div = document.createElement("div");
    div.className = "invSlot";
    div.textContent = item?.name || "-";
    div.onclick = () => {
      selectedIndex = i;
      highlightSelection(grid, i);
    };
    grid.appendChild(div);
  });
  highlightSelection(grid, selectedIndex);
}

function highlightSelection(grid, idx) {
  Array.from(grid.children).forEach((child, i) => {
    child.style.outline = i === idx ? "2px solid #b0ffb0" : "none";
  });
}

// Flashlight stub feedback (visual only for now)
window.addEventListener("toggle-flashlight", () => {
  const msg = document.getElementById("hint");
  msg.textContent =
    "Flashlight toggled (placeholder). E: Inventory | Esc: Pause | Shift: Sprint | 1-3: Hotbar | F3: Debug";
  setTimeout(() => {
    msg.textContent =
      "E: Inventory | Esc: Pause | Shift: Sprint | 1-3: Hotbar | F3: Debug";
  }, 1200);
});
