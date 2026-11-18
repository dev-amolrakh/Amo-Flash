import type { FlashSoundType } from "./types";

export type FlashPosition =
  "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right";

/** Where the auto-dismiss countdown is drawn, or `"none"` to hide it. */
export type FlashCountdown = "close" | "ring" | "outline" | "sweep" | "edge" | "bar" | "none";

export type FlashEntrance = "morph" | "drop" | "slide" | "fade";

/** `deck`: collapsed cards that fan out on hover. `list`: always expanded. */
export type FlashStacking = "deck" | "list";

export type FlashSoundPack = "chime" | "marimba" | "pop" | "bubble" | "digital";

/** `auto` follows the page (`.dark` class, `data-theme`, or the OS setting). */
export type FlashTheme = "auto" | "light" | "dark";

export interface FlashSoundConfig {
  enabled: boolean;
  pack: FlashSoundPack;
  /** 0–1. */
  volume: number;
  playFor: FlashSoundType[];
}

export interface FlashLabels {
  /** Accessible name of the notification region. */
  region: string;
  /** Accessible name of the close button. */
  dismiss: string;
  /** Word used in the ×N counter label: "3 times". */
  times: string;
}

export interface AmoFlashConfig {
  position: FlashPosition;
  stacking: FlashStacking;
  /** Visible flashes before the oldest is dismissed (1–10). */
  maxVisible: number;
  /** Auto-dismiss time in ms (1000–60000). Flashes with an action stay 1.5× longer. */
  duration: number;
  /** Errors stay until dismissed. */
  errorsPersist: boolean;
  pauseOnHover: boolean;
  closeButton: boolean;
  swipeToDismiss: boolean;
  /** Reveal the second line (`message`) on hover / focus. */
  expandOnHover: boolean;
  countdown: FlashCountdown;
  entrance: FlashEntrance;
  /** Pill background as `#rrggbb`; null = the default Signal surface. Text colour adapts automatically. */
  background: string | null;
  theme: FlashTheme;
  /** Distance from the screen edge in px. */
  offset: number;
  zIndex: number;
  sound: FlashSoundConfig;
  labels: FlashLabels;
  /** localStorage key to remember preference changes across reloads, or false. */
  persist: string | false;
  /** Inject the stylesheet automatically. Set false and import `amo-flash/style.css` yourself (e.g. strict CSP). */
  injectStyles: boolean;
}

export type AmoFlashConfigInput = Partial<Omit<AmoFlashConfig, "sound" | "labels">> & {
  sound?: Partial<FlashSoundConfig>;
  labels?: Partial<FlashLabels>;
};

export const DEFAULT_CONFIG: Readonly<AmoFlashConfig> = Object.freeze({
  position: "top-center",
  stacking: "deck",
  maxVisible: 4,
  duration: 4500,
  errorsPersist: true,
  pauseOnHover: true,
  closeButton: true,
  swipeToDismiss: true,
  expandOnHover: true,
  countdown: "close",
  entrance: "morph",
  background: null,
  theme: "auto",
  offset: 16,
  zIndex: 9999,
  sound: Object.freeze({
    enabled: true,
    pack: "chime",
    volume: 0.6,
    playFor: ["success", "error", "warning", "notification"],
  }) as FlashSoundConfig,
  labels: Object.freeze({ region: "Notifications", dismiss: "Dismiss notification", times: "times" }),
  persist: false,
  injectStyles: true,
}) as AmoFlashConfig;

export const POSITIONS: readonly FlashPosition[] = [
  "top-left",
  "top-center",
  "top-right",
  "bottom-left",
  "bottom-center",
  "bottom-right",
];
export const COUNTDOWNS: readonly FlashCountdown[] = [
  "close",
  "ring",
  "outline",
  "sweep",
  "edge",
  "bar",
  "none",
];
export const ENTRANCES: readonly FlashEntrance[] = ["morph", "drop", "slide", "fade"];
export const STACKINGS: readonly FlashStacking[] = ["deck", "list"];
export const SOUND_PACKS: readonly FlashSoundPack[] = ["chime", "marimba", "pop", "bubble", "digital"];
export const THEMES: readonly FlashTheme[] = ["auto", "light", "dark"];
export const SOUND_TYPES: readonly FlashSoundType[] = ["success", "error", "warning", "info", "notification"];

/** Keys remembered by `persist` (end-user preferences, not app wiring). */
const PREFERENCE_KEYS = [
  "position",
  "stacking",
  "maxVisible",
  "duration",
  "errorsPersist",
  "pauseOnHover",
  "closeButton",
  "swipeToDismiss",
  "expandOnHover",
  "countdown",
  "entrance",
  "background",
  "theme",
  "sound",
] as const satisfies readonly (keyof AmoFlashConfig)[];

const HEX6 = /^#[0-9a-f]{6}$/i;
const HEX3 = /^#[0-9a-f]{3}$/i;

/** `#rgb` / `#rrggbb` → lowercase `#rrggbb`; anything else → null. */
export function normalizeColor(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const v = value.trim();
  if (HEX6.test(v)) return v.toLowerCase();
  if (HEX3.test(v)) return `#${[...v.slice(1)].map((c) => c + c).join("")}`.toLowerCase();
  return null;
}

/** WCAG relative luminance of a `#rrggbb` colour (0–1). */
export function relativeLuminance(hex: string): number {
  const channel = (i: number) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

/** True when dark text reads better than white text on this background. */
export function isLightColor(hex: string): boolean {
  // Above ~0.18 black text has a higher contrast ratio than white.
  return relativeLuminance(hex) > 0.18;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}

function bool(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function num(value: unknown, min: number, max: number, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
}

function str(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() !== "" ? value : fallback;
}

/**
 * Merge an untrusted partial config (user input, localStorage, any old shape) onto `base`.
 * Invalid values keep the base value; unknown keys are dropped.
 */
export function sanitizeConfig(input: unknown, base: AmoFlashConfig = DEFAULT_CONFIG): AmoFlashConfig {
  const s = isRecord(input) ? input : {};
  const sound = isRecord(s.sound) ? s.sound : {};
  const labels = isRecord(s.labels) ? s.labels : {};

  let background = base.background;
  if (s.background === null) background = null;
  else if (s.background !== undefined) background = normalizeColor(s.background) ?? base.background;

  const playFor = Array.isArray(sound.playFor)
    ? SOUND_TYPES.filter((t) => (sound.playFor as unknown[]).includes(t))
    : [...base.sound.playFor];

  return {
    position: oneOf(s.position, POSITIONS, base.position),
    stacking: oneOf(s.stacking, STACKINGS, base.stacking),
    maxVisible: Math.round(num(s.maxVisible, 1, 10, base.maxVisible)),
    duration: Math.round(num(s.duration, 1000, 60000, base.duration)),
    errorsPersist: bool(s.errorsPersist, base.errorsPersist),
    pauseOnHover: bool(s.pauseOnHover, base.pauseOnHover),
    closeButton: bool(s.closeButton, base.closeButton),
    swipeToDismiss: bool(s.swipeToDismiss, base.swipeToDismiss),
    expandOnHover: bool(s.expandOnHover, base.expandOnHover),
    countdown: oneOf(s.countdown, COUNTDOWNS, base.countdown),
    entrance: oneOf(s.entrance, ENTRANCES, base.entrance),
    background,
    theme: oneOf(s.theme, THEMES, base.theme),
    offset: Math.round(num(s.offset, 0, 200, base.offset)),
    zIndex: Math.round(num(s.zIndex, 0, 2147483647, base.zIndex)),
    sound: {
      enabled: bool(sound.enabled, base.sound.enabled),
      pack: oneOf(sound.pack, SOUND_PACKS, base.sound.pack),
      volume: num(sound.volume, 0, 1, base.sound.volume),
      playFor,
    },
    labels: {
      region: str(labels.region, base.labels.region),
      dismiss: str(labels.dismiss, base.labels.dismiss),
      times: str(labels.times, base.labels.times),
    },
    persist:
      s.persist === false
        ? false
        : typeof s.persist === "string" && s.persist !== ""
          ? s.persist
          : base.persist,
    injectStyles: bool(s.injectStyles, base.injectStyles),
  };
}

/* ---------- live config ---------- */

type Listener = () => void;

let current: AmoFlashConfig = sanitizeConfig({});
let loadedPersistKey: string | false = false;
const listeners = new Set<Listener>();

function storage(): Storage | null {
  try {
    return typeof window !== "undefined" && window.localStorage ? window.localStorage : null;
  } catch {
    return null;
  }
}

function readSaved(key: string): unknown {
  try {
    const raw = storage()?.getItem(key);
    return raw ? (JSON.parse(raw) as unknown) : null;
  } catch {
    return null;
  }
}

function pickPreferences(config: AmoFlashConfig): Partial<AmoFlashConfig> {
  const out: Record<string, unknown> = {};
  for (const key of PREFERENCE_KEYS) out[key] = config[key];
  return out as Partial<AmoFlashConfig>;
}

function save(config: AmoFlashConfig): void {
  if (!config.persist) return;
  try {
    storage()?.setItem(config.persist, JSON.stringify(pickPreferences(config)));
  } catch {
    // Storage full or blocked: preferences simply aren't remembered.
  }
}

function commit(next: AmoFlashConfig): void {
  current = next;
  save(next);
  for (const listener of [...listeners]) listener();
}

/** The current, fully resolved configuration. */
export function getConfig(): AmoFlashConfig {
  return current;
}

/**
 * Change the configuration (partial, merged onto the current one). Safe to call any time;
 * a mounted viewport re-renders immediately.
 *
 * When `persist` is first set to a key, preferences saved under that key win over the values
 * passed in the same call, so a settings screen's choices survive reloads.
 */
export function configure(input: AmoFlashConfigInput): AmoFlashConfig {
  let next = sanitizeConfig(input, current);
  if (next.persist && next.persist !== loadedPersistKey) {
    loadedPersistKey = next.persist;
    const saved = readSaved(next.persist);
    if (isRecord(saved)) {
      const preferences: Record<string, unknown> = {};
      for (const key of PREFERENCE_KEYS) if (key in saved) preferences[key] = saved[key];
      next = sanitizeConfig(preferences, next);
    }
  }
  commit(next);
  return next;
}

/** Back to the library defaults for every preference (keeps persist, labels, zIndex, offset, injectStyles). */
export function resetConfig(): AmoFlashConfig {
  const { persist, labels, zIndex, offset, injectStyles } = current;
  const next = sanitizeConfig({ persist, labels, zIndex, offset, injectStyles }, DEFAULT_CONFIG);
  commit(next);
  return next;
}

/** Listen for configuration changes. Returns an unsubscribe function. */
export function subscribeConfig(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
