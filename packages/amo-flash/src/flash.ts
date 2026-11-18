import { getConfig, subscribeConfig, type FlashSoundPack } from "./config";
import { Viewport } from "./dom/viewport";
import { playSound } from "./sounds";
import { createFlashStore, type FlashState } from "./store";
import type {
  FlashOptions,
  FlashPromiseContent,
  FlashPromiseMessages,
  FlashRecord,
  FlashSoundType,
  FlashType,
  FlashUpdate,
} from "./types";

const isBrowser = (): boolean => typeof window !== "undefined" && typeof document !== "undefined";

/** Whether a flash of this type should make a sound under the current config. */
export function shouldPlaySound(type: FlashType, override: boolean | undefined): boolean {
  if (type === "loading" || override === false) return false;
  const { sound } = getConfig();
  // The global switch always wins (it is the end user's choice); `sound: true` only bypasses playFor.
  if (!sound.enabled) return false;
  return override === true || sound.playFor.includes(type);
}

/** The app-wide queue (one per page). */
export const store = createFlashStore({
  getConfig: () => getConfig(),
  onSound: (type, override) => {
    if (type === "loading" || !shouldPlaySound(type, override)) return;
    const { sound } = getConfig();
    playSound(sound.pack, type, sound.volume);
  },
});

/* ---------- mounting ---------- */

let viewport: Viewport | null = null;
let mounts = 0;
let autoMounted = false;

function createViewport(target: HTMLElement): Viewport {
  return new Viewport({ store, getConfig, subscribeConfig }, target);
}

/**
 * Render the viewport (optional: the first flash mounts it automatically on `document.body`).
 * Call it yourself to choose a container. Idempotent; returns a function that releases this mount.
 */
export function mountFlash(target?: HTMLElement): () => void {
  if (!isBrowser()) return () => undefined;
  mounts += 1;
  if (!viewport) viewport = createViewport(target ?? document.body);
  let released = false;
  return () => {
    if (released) return;
    released = true;
    mounts = Math.max(0, mounts - 1);
    if (mounts === 0 && !autoMounted) unmountFlash();
  };
}

/** Remove the viewport from the page (flashes stay queued and re-render on the next mount). */
export function unmountFlash(): void {
  viewport?.destroy();
  viewport = null;
  mounts = 0;
  autoMounted = false;
}

function ensureMounted(): void {
  if (viewport || !isBrowser() || !document.body) return;
  autoMounted = true;
  viewport = createViewport(document.body);
}

/* ---------- API ---------- */

function show(type: FlashType, title: string, options?: FlashOptions): string {
  if (!isBrowser()) return "";
  ensureMounted();
  return store.add(type, title, options);
}

function resolveContent<T>(content: FlashPromiseContent<T>, value: T): FlashOptions & { title: string } {
  const resolved = typeof content === "function" ? content(value) : content;
  return typeof resolved === "string" ? { title: resolved } : resolved;
}

export const flash = {
  /** Show a flash of any type. Returns its id. */
  show,
  success: (title: string, options?: FlashOptions) => show("success", title, options),
  error: (title: string, options?: FlashOptions) => show("error", title, options),
  warning: (title: string, options?: FlashOptions) => show("warning", title, options),
  info: (title: string, options?: FlashOptions) => show("info", title, options),
  /** A real-time event (new message, mention…). Pair it with a "View" action. */
  notify: (title: string, options?: FlashOptions) => show("notification", title, options),
  /** Stays until updated or dismissed; returns the id to update. */
  loading: (title: string, options?: FlashOptions) => show("loading", title, options),
  /** Morph an existing flash (type, title, message, …) in place. */
  update: (id: string, patch: FlashUpdate): void => store.update(id, patch),
  /**
   * loading → success / error in ONE pill. Accepts a promise or a function returning one.
   * Resolves / rejects with the original promise's result.
   */
  promise: <T>(input: Promise<T> | (() => Promise<T>), messages: FlashPromiseMessages<T>): Promise<T> => {
    const promise = typeof input === "function" ? input() : input;
    const loading = typeof messages.loading === "string" ? { title: messages.loading } : messages.loading;
    const { title, ...loadingOptions } = loading;
    const id = show("loading", title, loadingOptions);
    if (id) {
      promise.then(
        (value) => {
          const { title: doneTitle, ...rest } = resolveContent(messages.success, value);
          store.update(id, { ...rest, type: "success", title: doneTitle, id: undefined });
        },
        (error: unknown) => {
          const { title: failTitle, ...rest } = resolveContent(messages.error, error);
          store.update(id, { ...rest, type: "error", title: failTitle, id: undefined });
        },
      );
    }
    return promise;
  },
  /** Dismiss one flash, or all of them when no id is given. */
  dismiss: (id?: string): void => store.dismiss(id),
  dismissAll: (): void => store.dismissAll(),
} as const;

export type FlashApi = typeof flash;

/* ---------- headless ---------- */

/** Current flashes, newest first (including ones animating out). */
export function getFlashes(): readonly FlashRecord[] {
  return store.getState().items;
}

/** Listen to every queue change — build your own renderer on top of the store. */
export function subscribe(listener: (state: FlashState) => void): () => void {
  return store.subscribe(listener);
}

/** Play a sound pack sample, e.g. from a settings screen. Never throws. */
export function previewSound(pack: FlashSoundPack, type: FlashSoundType = "success", volume?: number): void {
  playSound(pack, type, volume ?? getConfig().sound.volume);
}
