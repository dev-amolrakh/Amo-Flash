import type { FlashOptions, FlashRecord, FlashType, FlashUpdate } from "./types";

/** A repeat of something dismissed this recently is treated as a double-fire and ignored. */
export const REPEAT_WINDOW_MS = 1500;
/** How long a dismissed flash stays mounted for its exit animation. */
export const EXIT_MS = 480;
/** Flashes with an action stay on screen longer. */
export const ACTION_DURATION_FACTOR = 1.5;

export type StoreConfig = {
  duration: number;
  errorsPersist: boolean;
  maxVisible: number;
};

export type StoreDeps = {
  getConfig: () => StoreConfig;
  /** Called for a new flash, or an update that changes the type. Not called for deduped repeats. */
  onSound?: (type: FlashType, override: boolean | undefined) => void;
  now?: () => number;
};

export interface FlashState {
  /** Newest first. Includes flashes that are animating out (`leaving`). */
  items: FlashRecord[];
  /** True while every timer is paused (pointer or focus in the viewport). */
  paused: boolean;
}

export interface FlashStore {
  getState: () => FlashState;
  subscribe: (listener: (state: FlashState) => void) => () => void;
  add: (type: FlashType, title: string, options?: FlashOptions) => string;
  update: (id: string, patch: FlashUpdate) => void;
  dismiss: (id?: string) => void;
  dismissAll: () => void;
  /** Final removal after the exit animation (scheduled by the store itself). */
  remove: (id: string) => void;
  pause: () => void;
  resume: () => void;
}

function defaultDedupeKey(type: FlashType, title: string, message?: string): string {
  return `${type}|${title}|${message ?? ""}`;
}

export function createFlashStore(deps: StoreDeps): FlashStore {
  const now = deps.now ?? (() => Date.now());
  const timers = new Map<string, ReturnType<typeof setTimeout>>();
  const exitTimers = new Map<string, ReturnType<typeof setTimeout>>();
  const recentlyDismissed = new Map<string, { at: number; id: string }>();
  const listeners = new Set<(state: FlashState) => void>();
  let state: FlashState = { items: [], paused: false };
  let seq = 0;

  function set(patch: Partial<FlashState>) {
    state = { ...state, ...patch };
    for (const listener of [...listeners]) listener(state);
  }

  function resolveTotal(type: FlashType, options: FlashOptions): number | null {
    if (options.duration === "persist") return null;
    if (typeof options.duration === "number") return Math.max(0, options.duration);
    if (type === "loading") return null;
    const config = deps.getConfig();
    if (type === "error" && config.errorsPersist) return null;
    return Math.round(config.duration * (options.action ? ACTION_DURATION_FACTOR : 1));
  }

  function clearTimer(id: string) {
    const handle = timers.get(id);
    if (handle !== undefined) {
      clearTimeout(handle);
      timers.delete(id);
    }
  }

  function startTimer(id: string, ms: number) {
    clearTimer(id);
    timers.set(
      id,
      setTimeout(() => {
        timers.delete(id);
        store.dismiss(id);
      }, ms),
    );
  }

  /** Restart a flash's countdown from its full duration (respecting pause). */
  function armed(item: FlashRecord): FlashRecord {
    clearTimer(item.id);
    if (item.total === null) {
      return { ...item, remaining: null, startedAt: null, timerKey: item.timerKey + 1 };
    }
    const running = !state.paused;
    if (running) startTimer(item.id, item.total);
    return { ...item, remaining: item.total, startedAt: running ? now() : null, timerKey: item.timerKey + 1 };
  }

  function replace(item: FlashRecord) {
    set({ items: state.items.map((i) => (i.id === item.id ? item : i)) });
  }

  function enforceMaxVisible() {
    const max = Math.max(1, deps.getConfig().maxVisible);
    const visible = state.items.filter((i) => !i.leaving);
    // items are newest first, so everything past `max` is the oldest
    for (const stale of visible.slice(max)) store.dismiss(stale.id);
  }

  function pruneRecent(at: number) {
    for (const [key, entry] of recentlyDismissed) {
      if (at - entry.at > REPEAT_WINDOW_MS) recentlyDismissed.delete(key);
    }
  }

  const store: FlashStore = {
    getState: () => state,

    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    add: (type, title, options = {}) => {
      const existingById = options.id ? state.items.find((i) => i.id === options.id) : undefined;
      if (existingById) {
        const exit = exitTimers.get(existingById.id);
        if (exit !== undefined) {
          clearTimeout(exit);
          exitTimers.delete(existingById.id);
          replace({ ...existingById, leaving: false });
        }
        store.update(existingById.id, { ...options, type, title });
        return existingById.id;
      }

      const dedupeKey = options.dedupeKey ?? defaultDedupeKey(type, title, options.message);
      const duplicate = state.items.find((i) => !i.leaving && i.dedupeKey === dedupeKey);
      if (duplicate) {
        replace(armed({ ...duplicate, count: duplicate.count + 1, bump: duplicate.bump + 1 }));
        return duplicate.id;
      }

      const at = now();
      pruneRecent(at);
      const recent = recentlyDismissed.get(dedupeKey);
      if (recent && at - recent.at <= REPEAT_WINDOW_MS) return recent.id;

      seq += 1;
      const id = options.id ?? `amo-${at.toString(36)}-${seq}`;
      const record = armed({
        id,
        type,
        title,
        message: options.message,
        action: options.action,
        source: options.source,
        dedupeKey,
        total: resolveTotal(type, options),
        remaining: null,
        startedAt: null,
        count: 1,
        bump: 0,
        version: 0,
        timerKey: 0,
        createdAt: at,
        leaving: false,
      });
      set({ items: [record, ...state.items] });
      enforceMaxVisible();
      deps.onSound?.(type, options.sound);
      return id;
    },

    update: (id, patch) => {
      const current = state.items.find((i) => i.id === id);
      if (!current) return;
      const type = patch.type ?? current.type;
      const title = patch.title ?? current.title;
      const message = patch.message !== undefined ? patch.message : current.message;
      const action = patch.action !== undefined ? patch.action : current.action;
      const typeChanged = type !== current.type;
      const total =
        patch.duration !== undefined || typeChanged || patch.action !== undefined
          ? resolveTotal(type, { ...patch, action })
          : current.total;

      replace(
        armed({
          ...current,
          type,
          title,
          message,
          action,
          source: patch.source ?? current.source,
          dedupeKey: patch.dedupeKey ?? defaultDedupeKey(type, title, message),
          total,
          version: current.version + 1,
        }),
      );
      if (typeChanged && type !== "loading") deps.onSound?.(type, patch.sound);
    },

    dismiss: (id) => {
      if (id === undefined) {
        store.dismissAll();
        return;
      }
      const item = state.items.find((i) => i.id === id);
      if (!item || item.leaving) return;
      clearTimer(id);
      recentlyDismissed.set(item.dedupeKey, { at: now(), id });
      replace({ ...item, leaving: true, startedAt: null });
      exitTimers.set(
        id,
        setTimeout(() => {
          exitTimers.delete(id);
          store.remove(id);
        }, EXIT_MS),
      );
    },

    dismissAll: () => {
      for (const item of state.items) {
        if (!item.leaving) store.dismiss(item.id);
      }
    },

    remove: (id) => {
      clearTimer(id);
      const exit = exitTimers.get(id);
      if (exit !== undefined) {
        clearTimeout(exit);
        exitTimers.delete(id);
      }
      set({ items: state.items.filter((i) => i.id !== id) });
    },

    pause: () => {
      if (state.paused) return;
      const at = now();
      const items = state.items.map((item) => {
        if (item.startedAt === null || item.remaining === null || item.leaving) return item;
        clearTimer(item.id);
        return { ...item, remaining: Math.max(0, item.remaining - (at - item.startedAt)), startedAt: null };
      });
      set({ items, paused: true });
    },

    resume: () => {
      if (!state.paused) return;
      const at = now();
      const items = state.items.map((item) => {
        if (item.remaining === null || item.leaving) return item;
        startTimer(item.id, item.remaining);
        return { ...item, startedAt: at };
      });
      set({ items, paused: false });
    },
  };

  return store;
}
