export type FlashType = "success" | "error" | "warning" | "info" | "notification" | "loading";

/** Types that can carry a sound (loading never plays one). */
export type FlashSoundType = Exclude<FlashType, "loading">;

export type FlashAction = { label: string; onClick: () => void };

/** Milliseconds, or `"persist"` to stay until dismissed. */
export type FlashDuration = number | "persist";

export interface FlashOptions {
  /** Stable id: showing a flash with an id that is already on screen updates it in place. */
  id?: string;
  /** Second line, revealed when the pill expands on hover / focus. */
  message?: string;
  /** One inline text action, e.g. "Undo" or "View". Clicking it also dismisses the flash. */
  action?: FlashAction;
  /** Overrides the configured auto-dismiss time for this flash. */
  duration?: FlashDuration;
  /** Per-call sound override: `false` never plays, `true` plays even if the type is not in `sound.playFor`. */
  sound?: boolean;
  /** Identical flashes are merged into one pill with a ×N counter. Defaults to `type|title|message`. */
  dedupeKey?: string;
  /** Free-form origin tag (module or feature name). Available to headless renderers. */
  source?: string;
}

export interface FlashUpdate extends FlashOptions {
  type?: FlashType;
  title?: string;
}

/** One flash as held by the store (read it via `subscribe()` / `getFlashes()` for custom renderers). */
export interface FlashRecord {
  id: string;
  type: FlashType;
  title: string;
  message?: string;
  action?: FlashAction;
  source?: string;
  dedupeKey: string;
  /** Resolved duration in ms, or null when it stays until dismissed. */
  total: number | null;
  /** Ms left on the timer when it was last (re)started or paused. */
  remaining: number | null;
  /** Epoch ms the running timer started; null while paused or persistent. */
  startedAt: number | null;
  /** How many identical flashes were merged into this one (1 = no repeats). */
  count: number;
  /** Increments on every dedupe hit (drives the "bump"). */
  bump: number;
  /** Increments on every update() (drives icon choreography + width morph). */
  version: number;
  /** Increments whenever the timer restarts (restarts the countdown). */
  timerKey: number;
  createdAt: number;
  /** True while the exit animation runs. */
  leaving: boolean;
}

/** Content accepted by `flash.promise` for each phase. */
export type FlashPromiseContent<T> =
  string | (FlashOptions & { title: string }) | ((value: T) => string | (FlashOptions & { title: string }));

export type FlashPromiseMessages<T> = {
  loading: string | (FlashOptions & { title: string });
  success: FlashPromiseContent<T>;
  error: FlashPromiseContent<unknown>;
};
