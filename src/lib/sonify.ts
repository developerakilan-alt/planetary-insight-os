/**
 * Sonification engine — maps scientific telemetry values to sound using the
 * Web Audio API. Values are log-scaled into a musical pitch space so that
 * planets with wildly different magnitudes (gravity, temperature, pressure)
 * remain audibly distinct and pleasant.
 */

export interface SonifyValue {
  label: string;
  value: number;
  /** the value range used for normalisation (defaults to a sensible span) */
  range?: [number, number];
}

const A4 = 440;
const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export function midiFromFrequency(freq: number): number {
  return 69 + 12 * Math.log2(freq / A4);
}

export function frequencyFromMidi(midi: number): number {
  return A4 * Math.pow(2, (midi - 69) / 12);
}

export function noteName(midi: number): string {
  const m = Math.round(midi);
  return `${NOTE_NAMES[((m % 12) + 12) % 12]}${Math.floor(m / 12) - 1}`;
}

export function normalise(value: number, range: [number, number]): number {
  const [min, max] = range;
  if (max - min === 0) return 0.5;
  return Math.min(1, Math.max(0, (value - min) / (max - min)));
}

/**
 * Map a telemetry value to a note number. Uses a log scale when the span is
 * more than a couple of orders of magnitude so small values stay resolvable.
 */
export function valueToMidi(value: number, range: [number, number]): number {
  const [min, max] = range;
  const span = max - min;
  if (span <= 0) return 60;
  if (span > 100) {
    const lv = Math.log10(value <= 0 ? 1e-6 : Math.abs(value));
    const lMin = Math.log10(Math.abs(min) || 1e-6);
    const lMax = Math.log10(Math.abs(max));
    const t = Math.min(1, Math.max(0, (lv - lMin) / (lMax - lMin || 1)));
    return 36 + t * 60;
  }
  return 36 + normalise(value, range) * 60;
}

interface Scheduler {
  ctx: AudioContext;
  master: GainNode;
  running: boolean;
}

let state: Scheduler | null = null;

export function getScheduler(): Scheduler | null {
  if (typeof window === "undefined") return null;
  if (!state) {
    const ctx = new AudioContext();
    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    state = { ctx, master, running: false };
  }
  return state;
}

/** Start/resume the audio graph. Must be called from a user gesture. */
export function startSonification(): void {
  const s = getScheduler();
  if (!s) return;
  if (s.ctx.state === "suspended") void s.ctx.resume();
  s.master.gain.cancelScheduledValues(s.ctx.currentTime);
  s.master.gain.linearRampToValueAtTime(0.5, s.ctx.currentTime + 0.1);
  s.running = true;
}

export function stopSonification(): void {
  const s = state;
  if (!s) return;
  s.master.gain.cancelScheduledValues(s.ctx.currentTime);
  s.master.gain.linearRampToValueAtTime(0, s.ctx.currentTime + 0.08);
  s.running = false;
}

export function isSonifying(): boolean {
  return !!state?.running;
}

function now() {
  return state!.ctx.currentTime;
}

/** Play one value as a tone with a soft envelope and gentle vibrato. */
export function playValue(v: SonifyValue): void {
  const s = state;
  if (!s || !s.running) return;
  const { ctx, master } = s;
  const range = v.range ?? [0, 100];
  const midi = valueToMidi(v.value, range);
  const freq = frequencyFromMidi(midi);
  const t = now();
  const dur = 1.6;

  const osc = ctx.createOscillator();
  osc.type = "triangle";
  osc.frequency.value = freq;
  const vib = ctx.createOscillator();
  vib.frequency.value = 5.2;
  const vibGain = ctx.createGain();
  vibGain.gain.value = 3;
  vib.connect(vibGain).connect(osc.frequency);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.22, t + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain).connect(master);
  osc.start(t);
  vib.start(t);
  osc.stop(t + dur);
  vib.stop(t + dur);
}

/** Play an ordered chord/arpeggio representing a set of values. */
export function playSequence(values: SonifyValue[], gapSeconds = 0.24): void {
  const s = state;
  if (!s || !s.running) return;
  const { ctx, master } = s;
  const t0 = ctx.currentTime + 0.02;
  values.forEach((v, i) => {
    const range = v.range ?? [0, 100];
    const midi = valueToMidi(v.value, range);
    const freq = frequencyFromMidi(midi);
    const t = t0 + i * gapSeconds;
    const dur = 1.2 + gapSeconds;
    const osc = ctx.createOscillator();
    osc.type = i % 3 === 2 ? "sine" : "triangle";
    osc.frequency.value = freq;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.18, t + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(master);
    osc.start(t);
    osc.stop(t + dur);
  });
}

/** Play the current ISS-ish "blip" pulse. */
export function playPulse(rate = 0.7): void {
  const s = state;
  if (!s || !s.running) return;
  const { ctx, master } = s;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.value = 660;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.08, t + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
  osc.connect(gain).connect(master);
  osc.start(t);
  osc.stop(t + 0.1);
}
