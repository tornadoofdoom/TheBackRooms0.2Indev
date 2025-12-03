// Level1/ui.js
let staminaEl, sanityEl;

export function initUI() {
  staminaEl = document.getElementById("staminaFill");
  sanityEl = document.getElementById("sanityFill");
}

export function setStamina(val) {
  const clamped = Math.max(0, Math.min(1, val));
  staminaEl.style.width = `${clamped * 100}%`;
}

export function setSanity(val) {
  const clamped = Math.max(0, Math.min(1, val));
  sanityEl.style.width = `${clamped * 100}%`;
}
