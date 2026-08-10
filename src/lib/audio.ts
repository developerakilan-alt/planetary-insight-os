/**
 * Ambient cockpit audio — a very low, soft deep-space hum generated with the
 * Web Audio API (no audio files needed). Never autoplays: it starts only after
 * a user gesture and the preference is persisted.
 */

let ctx: AudioContext | null = null;
let gainNode: GainNode | null = null;

const STORAGE_KEY = "cosmos-ambient-v1";

export function isAmbientEnabled(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function setStored(v: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, v ? "1" : "0");
  } catch {
    /* storage unavailable */
  }
}

function buildAmbient(ac: AudioContext) {
  const master = ac.createGain();
  master.gain.value = 0;

  const osc = ac.createOscillator();
  osc.type = "sine";
  osc.frequency.value = 54;
  const osc2 = ac.createOscillator();
  osc2.type = "sine";
  osc2.frequency.value = 55.4;
  const sub = ac.createGain();
  sub.gain.value = 0.5;
  osc.connect(sub);
  osc2.connect(sub);
  sub.connect(master);

  const noiseBuf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
  const data = noiseBuf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const noise = ac.createBufferSource();
  noise.buffer = noiseBuf;
  noise.loop = true;
  const lp = ac.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 320;
  const noiseGain = ac.createGain();
  noiseGain.gain.value = 0.06;
  noise.connect(lp);
  lp.connect(noiseGain);
  noiseGain.connect(master);

  master.connect(ac.destination);
  osc.start();
  osc2.start();
  noise.start();
  return master;
}

function startAmbient() {
  if (typeof window === "undefined") return;
  const AC =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  gainNode = buildAmbient(ctx);
  void ctx.resume();
  gainNode.gain.setTargetAtTime(0.35, ctx.currentTime, 1.2);
}

function stopAmbient() {
  if (!ctx || !gainNode) return;
  gainNode.gain.setTargetAtTime(0, ctx.currentTime, 0.4);
  const ac = ctx;
  setTimeout(() => {
    void ac.close();
    ctx = null;
    gainNode = null;
  }, 800);
}

export function setAmbientEnabled(v: boolean) {
  setStored(v);
  if (v) startAmbient();
  else stopAmbient();
}

export function toggleAmbient(): boolean {
  const next = !isAmbientEnabled();
  setAmbientEnabled(next);
  return next;
}

/** Resume the persisted ambient hum on the first user gesture of a session. */
export function primeAmbient() {
  if (typeof window === "undefined") return;
  if (!isAmbientEnabled()) return;
  const prime = () => {
    if (isAmbientEnabled() && !ctx) startAmbient();
  };
  window.addEventListener("pointerdown", prime, { once: true });
  window.addEventListener("keydown", prime, { once: true });
}
