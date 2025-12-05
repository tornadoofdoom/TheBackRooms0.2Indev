// Level0/utils.js
// Deterministic RNG, hashing, grid helpers, math utils, overlays, and small quality-of-life helpers.

export const RNG = (seed = 1234567) => {
  let s = seed >>> 0;
  return () => {
    s ^= s << 13; s ^= s >>> 17; s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
};

// Stable 2D hash for chunk coordinates (and time offsets if needed)
export const hash2 = (x, y) => {
  let s = (x * 374761393 + y * 668265263) >>> 0;
  s = (s ^ (s >>> 13)) * 1274126177 >>> 0;
  return (s ^ (s >>> 16)) >>> 0;
};

export const randForChunk = (cx, cy, t = 0) => {
  const seed = hash2(cx + t, cy - t);
  return RNG(seed);
};

export const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
export const lerp = (a, b, t) => a + (b - a) * t;

// Easing variants (useful for UI/FX)
export const easeInOutQuad = (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);
export const easeOutExpo = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

// Keys and grid transforms
export const vec2Key = (cx, cy) => `${cx},${cy}`;
export const gridToWorld = (cx, cy, size) => ({ x: cx * size, z: cy * size });

export const now = () => performance.now();

// Minimal overlay creation
export const makeOverlay = (id, css = "") => {
  const el = document.createElement("div");
  el.id = id;
  el.style.cssText = css;
  document.body.appendChild(el);
  return el;
};

// Reticle helper (optional): small center dot for look interactions
export const ensureReticle = () => {
  let r = document.getElementById("reticle");
  if (r) return r;
  r = document.createElement("div");
  r.id = "reticle";
  r.style.cssText = `
    position: fixed; left: 50%; top: 50%; transform: translate(-50%,-50%);
    width: 6px; height: 6px; border-radius: 50%;
    background: rgba(255,255,255,0.7); box-shadow: 0 0 6px rgba(255,255,255,0.6);
    pointer-events: none; z-index: 999;
  `;
  document.body.appendChild(r);
  return r;
};

// Frame throttler (e.g., for expensive operations not needed every frame)
export const makeThrottler = (minIntervalMs = 100) => {
  let last = 0;
  return (fn) => {
    const t = performance.now();
    if (t - last >= minIntervalMs) {
      last = t;
      fn();
    }
  };
};

// Safe DOM button creator
export const makeButton = (label, css = "") => {
  const b = document.createElement("button");
  b.textContent = label;
  b.style.cssText = css || "padding:6px 10px; background:#333; color:#eee; border:1px solid #555; cursor:pointer;";
  return b;
};

// Simple 2D manhattan distance (useful for stress near exit)
export const manhattan2 = (ax, ay, bx, by) => Math.abs(ax - bx) + Math.abs(ay - by);
