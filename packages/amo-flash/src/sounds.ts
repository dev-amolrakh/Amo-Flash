import type { FlashSoundPack } from "./config";
import type { FlashSoundType } from "./types";

/** One synthesized note: frequency (Hz), optional sweep target, start offset (s), duration (s), gain multiplier. */
type Note = { f: number; f2?: number; t: number; d: number; g?: number };

type PackSpec = {
  wave: OscillatorType;
  /** Pack-level gain multiplier (square waves are loud). */
  gain?: number;
  /** Extra harmonics: [frequency multiple, relative gain]. */
  partials?: ReadonlyArray<readonly [number, number]>;
  notes: Record<FlashSoundType, Note[]>;
};

const MASTER_GAIN = 0.35;
const ATTACK_S = 0.006;
const SWEEP_SHARE = 0.8;

/** Every sound is synthesized with the Web Audio API: no audio files are shipped. */
export const SOUND_PACK_SPECS: Record<FlashSoundPack, PackSpec> = {
  chime: {
    wave: "sine",
    notes: {
      success: [
        { f: 659.3, t: 0, d: 0.35 },
        { f: 987.8, t: 0.09, d: 0.55 },
      ],
      error: [
        { f: 493.9, t: 0, d: 0.3 },
        { f: 349.2, t: 0.12, d: 0.5 },
      ],
      warning: [
        { f: 740, t: 0, d: 0.22 },
        { f: 740, t: 0.17, d: 0.32 },
      ],
      info: [{ f: 880, t: 0, d: 0.45, g: 0.7 }],
      notification: [
        { f: 784, t: 0, d: 0.3 },
        { f: 1046.5, t: 0.08, d: 0.3 },
        { f: 1318.5, t: 0.16, d: 0.55 },
      ],
    },
  },
  marimba: {
    wave: "sine",
    partials: [
      [2, 0.18],
      [4, 0.22],
    ],
    notes: {
      success: [
        { f: 523.3, t: 0, d: 0.45 },
        { f: 784, t: 0.1, d: 0.6 },
      ],
      error: [
        { f: 392, t: 0, d: 0.45 },
        { f: 311.1, t: 0.13, d: 0.6 },
      ],
      warning: [
        { f: 587.3, t: 0, d: 0.35 },
        { f: 587.3, t: 0.16, d: 0.4 },
      ],
      info: [{ f: 659.3, t: 0, d: 0.55 }],
      notification: [
        { f: 523.3, t: 0, d: 0.35 },
        { f: 659.3, t: 0.08, d: 0.35 },
        { f: 784, t: 0.16, d: 0.6 },
      ],
    },
  },
  pop: {
    wave: "triangle",
    notes: {
      success: [{ f: 520, f2: 980, t: 0, d: 0.12 }],
      error: [{ f: 340, f2: 150, t: 0, d: 0.2 }],
      warning: [
        { f: 420, f2: 560, t: 0, d: 0.1 },
        { f: 420, f2: 560, t: 0.13, d: 0.1 },
      ],
      info: [{ f: 600, f2: 760, t: 0, d: 0.1, g: 0.7 }],
      notification: [
        { f: 480, f2: 900, t: 0, d: 0.1 },
        { f: 700, f2: 1250, t: 0.1, d: 0.12 },
      ],
    },
  },
  bubble: {
    wave: "sine",
    notes: {
      success: [
        { f: 400, f2: 1400, t: 0, d: 0.14 },
        { f: 600, f2: 1800, t: 0.1, d: 0.14 },
      ],
      error: [{ f: 900, f2: 240, t: 0, d: 0.28 }],
      warning: [
        { f: 500, f2: 900, t: 0, d: 0.12 },
        { f: 500, f2: 900, t: 0.15, d: 0.12 },
      ],
      info: [{ f: 500, f2: 1200, t: 0, d: 0.14, g: 0.7 }],
      notification: [
        { f: 350, f2: 1000, t: 0, d: 0.14 },
        { f: 500, f2: 1500, t: 0.09, d: 0.14 },
        { f: 700, f2: 2000, t: 0.18, d: 0.14 },
      ],
    },
  },
  digital: {
    wave: "square",
    gain: 0.28,
    notes: {
      success: [
        { f: 1200, t: 0, d: 0.07 },
        { f: 1600, t: 0.09, d: 0.09 },
      ],
      error: [
        { f: 300, t: 0, d: 0.1 },
        { f: 300, t: 0.14, d: 0.1 },
        { f: 220, t: 0.28, d: 0.2 },
      ],
      warning: [
        { f: 900, t: 0, d: 0.08 },
        { f: 900, t: 0.12, d: 0.08 },
      ],
      info: [{ f: 1000, t: 0, d: 0.08 }],
      notification: [
        { f: 1300, t: 0, d: 0.06 },
        { f: 1700, t: 0.08, d: 0.06 },
        { f: 2100, t: 0.16, d: 0.1 },
      ],
    },
  },
};

type AudioContextCtor = new () => AudioContext;

let context: AudioContext | null = null;
let gestureHooked = false;

function audioContextCtor(): AudioContextCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & { webkitAudioContext?: AudioContextCtor };
  return (window.AudioContext as AudioContextCtor | undefined) ?? w.webkitAudioContext ?? null;
}

/** Lazily create the shared AudioContext. Returns null when audio is unavailable. */
function getContext(): AudioContext | null {
  if (context) return context;
  const Ctor = audioContextCtor();
  if (!Ctor) return null;
  try {
    context = new Ctor();
  } catch {
    context = null;
  }
  return context;
}

function resumeContext(): void {
  const ctx = getContext();
  if (ctx && ctx.state === "suspended") {
    ctx.resume().catch(() => undefined);
  }
}

/**
 * Browsers only allow audio after a user gesture: resume (or create) the context on
 * the first pointer/key press. Safe to call many times.
 */
export function primeAudioOnGesture(): void {
  if (gestureHooked || typeof window === "undefined") return;
  gestureHooked = true;
  const unlock = () => {
    resumeContext();
    window.removeEventListener("pointerdown", unlock, true);
    window.removeEventListener("keydown", unlock, true);
  };
  window.addEventListener("pointerdown", unlock, true);
  window.addEventListener("keydown", unlock, true);
}

function scheduleNote(ctx: AudioContext, out: AudioNode, spec: PackSpec, note: Note, start: number): void {
  const voices: ReadonlyArray<readonly [number, number]> = [[1, 1], ...(spec.partials ?? [])];
  const peak = note.g ?? 1;
  const end = start + note.d;

  for (const [multiple, relative] of voices) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = spec.wave;
    osc.frequency.setValueAtTime(note.f * multiple, start);
    if (note.f2 !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(note.f2 * multiple, start + note.d * SWEEP_SHARE);
    }
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, peak * relative), start + ATTACK_S);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    osc.connect(gain);
    gain.connect(out);
    osc.start(start);
    osc.stop(end + 0.05);
  }
}

/** Play one pack sound. Never throws: blocked or missing audio is silently skipped. */
export function playSound(pack: FlashSoundPack, type: FlashSoundType, volume: number): void {
  try {
    const ctx = getContext();
    if (!ctx || volume <= 0) return;
    if (ctx.state === "suspended") ctx.resume().catch(() => undefined);
    const spec = SOUND_PACK_SPECS[pack];
    const master = ctx.createGain();
    master.gain.value = Math.min(1, Math.max(0, volume)) * MASTER_GAIN * (spec.gain ?? 1);
    master.connect(ctx.destination);
    const base = ctx.currentTime + 0.01;
    for (const note of spec.notes[type]) scheduleNote(ctx, master, spec, note, base + note.t);
  } catch {
    // Audio is optional feedback; a blocked or broken AudioContext must never break the UI.
  }
}
