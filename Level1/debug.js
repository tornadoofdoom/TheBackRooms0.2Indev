// Level1/debug.js
let panel,
  visible = false;

export function initDebug() {
  panel = document.getElementById("debugPanel");
}

export function toggleDebug() {
  visible = !visible;
  panel.style.display = visible ? "block" : "none";
}

export function updateDebug({
  fps,
  pos,
  floor,
  zone,
  chunk,
  smilersTotal = 0,
  smilersChasing = 0,
  smilersIdle = 0,
}) {
  if (!panel || !visible) return;
  panel.innerHTML = `
    <div class="row"><span class="label">FPS</span><span class="value">${fps}</span></div>
    <div class="row"><span class="label">Position</span><span class="value">${pos.x.toFixed(
      2
    )}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)}</span></div>
    <div class="row"><span class="label">Chunk</span><span class="value">${
      chunk.cx
    }, ${chunk.cz}</span></div>
    <div class="row"><span class="label">Floor</span><span class="value">${floor}</span></div>
    <div class="row"><span class="label">Zone</span><span class="value">${zone}</span></div>
    <div class="row"><span class="label">Smilers</span><span class="value">total: ${smilersTotal} | chasing: ${smilersChasing} | idle: ${smilersIdle}</span></div>
  `;
}
