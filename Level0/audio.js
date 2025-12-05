// Level0/audio.js
// Procedural ambience: fluorescent hum, distant mechanical thumps, zone intensity,
// optional flicker surge coupling and redshift tint via EQ shaping.

export function setupAudio(scene, opts = {}) {
  const cfg = {
    humFreq: 55,              // base hum frequency (Hz)
    humGainBase: 0.02,        // baseline hum gain
    humGainDarkBoost: 0.02,   // boost in darker zones
    thumpIntervalMin: 4.5,    // seconds
    thumpIntervalMax: 8.0,
    thumpGainMin: 0.002,
    thumpGainMax: 0.012,
    flickerSurgeGain: 0.01,   // brief gain added during a flicker blackout
    redshiftEq: true,         // slightly emphasize low-mid under Red Shift
    ...opts
  };

  // Context
  const ctx = BABYLON.Engine.audioEngine?.audioContext || new (window.AudioContext || window.webkitAudioContext)();

  // Master bus
  const masterGain = ctx.createGain();
  masterGain.gain.value = 1.0;
  masterGain.connect(ctx.destination);

  // Hum chain (osc + subtle harmonics + gentle lowpass)
  const humOsc = ctx.createOscillator();
  humOsc.type = "sine";
  humOsc.frequency.value = cfg.humFreq;

  const humHarm = ctx.createOscillator();
  humHarm.type = "sine";
  humHarm.frequency.value = cfg.humFreq * 2.01;

  const humGain = ctx.createGain();
  humGain.gain.value = cfg.humGainBase;

  const humHarmGain = ctx.createGain();
  humHarmGain.gain.value = cfg.humGainBase * 0.35;

  const humLP = ctx.createBiquadFilter();
  humLP.type = "lowpass";
  humLP.frequency.value = 350;

  humOsc.connect(humGain).connect(humLP).connect(masterGain);
  humHarm.connect(humHarmGain).connect(humLP);

  humOsc.start();
  humHarm.start();

  // Distant mechanical thumps (noise bursts shaped by envelope and bandpass)
  const thumpBP = ctx.createBiquadFilter();
  thumpBP.type = "bandpass";
  thumpBP.frequency.value = 180;
  thumpBP.Q.value = 0.8;

  const thumpGain = ctx.createGain();
  thumpGain.gain.value = 0.0;
  thumpGain.connect(masterGain);
  thumpBP.connect(thumpGain);

  let thumpTimer = null;

  function scheduleThump() {
    const interval = cfg.thumpIntervalMin + Math.random() * (cfg.thumpIntervalMax - cfg.thumpIntervalMin);
    thumpTimer = setTimeout(() => {
      const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.45), ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        // Exponential decay noise
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.18));
      }
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.playbackRate.value = 0.7 + Math.random() * 0.5;
      src.connect(thumpBP);
      const g = cfg.thumpGainMin + Math.random() * (cfg.thumpGainMax - cfg.thumpGainMin);
      thumpGain.gain.setValueAtTime(g, ctx.currentTime);
      src.start();
      // fade out
      thumpGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
      scheduleThump();
    }, interval * 1000);
  }
  scheduleThump();

  // Optional Red Shift EQ tilt (more ominous low-mid)
  const redEq = ctx.createBiquadFilter();
  redEq.type = "lowshelf";
  redEq.frequency.value = 220;
  redEq.gain.value = 0; // engaged when active
  // Place EQ after masterGain by default (or rewire chain if needed)
  masterGain.disconnect();
  masterGain.connect(redEq).connect(ctx.destination);

  // Public API
  const audio = {
    // Darker zones ⇒ louder hum
    setZoneIntensity: (factor) => {
      const base = cfg.humGainBase;
      humGain.gain.value = base + factor * cfg.humGainDarkBoost;
      humHarmGain.gain.value = (base * 0.35) + factor * (cfg.humGainDarkBoost * 0.25);
    },

    // Brief surge tied to visual flicker events (call when a hard dip occurs)
    flickerSurge: () => {
      const now = ctx.currentTime;
      const surge = cfg.flickerSurgeGain;
      humGain.gain.cancelScheduledValues(now);
      humGain.gain.setValueAtTime(humGain.gain.value + surge, now);
      humGain.gain.exponentialRampToValueAtTime(Math.max(cfg.humGainBase, humGain.gain.value - surge), now + 0.35);
    },

    // Red Shift coupling: tilt EQ
    setRedShiftActive: (active) => {
      if (!cfg.redshiftEq) return;
      redEq.gain.value = active ? 4.5 : 0.0; // subtle but present
    },

    // Dispose cleanly
    dispose: () => {
      try { humOsc.stop(); humHarm.stop(); } catch {}
      clearTimeout(thumpTimer);
      humOsc.disconnect(); humHarm.disconnect();
      humGain.disconnect(); humHarmGain.disconnect();
      humLP.disconnect(); thumpBP.disconnect(); thumpGain.disconnect();
      masterGain.disconnect(); redEq.disconnect();
      // Do not close shared audioContext; leave it alive
    },

    // Expose context for advanced hooks
    ctx
  };

  // Pause/resume on scene or page visibility changes
  document.addEventListener("visibilitychange", () => {
    // Keep ambience subtle even when tab hidden
    if (document.hidden) {
      masterGain.gain.setTargetAtTime(0.6, ctx.currentTime, 0.25);
    } else {
      masterGain.gain.setTargetAtTime(1.0, ctx.currentTime, 0.25);
    }
  });

  return audio;
}
