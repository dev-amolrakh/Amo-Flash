import {
  configure,
  getConfig,
  getFlashes,
  mountFlash,
  subscribe,
  subscribeConfig,
  type AmoFlashConfig,
  type AmoFlashConfigInput,
  type FlashRecord,
} from "amo-flash";

export * from "amo-flash";

type Subscriber<T> = (value: T) => void;

/** Svelte store contract (works with `$flashes` in Svelte 3, 4 and 5). */
export interface Readable<T> {
  subscribe: (run: Subscriber<T>) => () => void;
}

export interface Writable<T> extends Readable<T> {
  set: (value: T) => void;
  update: (updater: (value: T) => T) => void;
}

/** The live queue, newest first: `{#each $flashes as f (f.id)}` for a custom renderer. */
export const flashes: Readable<readonly FlashRecord[]> = {
  subscribe(run) {
    run(getFlashes());
    return subscribe((state) => run(state.items));
  },
};

/** The live configuration. `$flashConfig.position = "bottom-right"` works too. */
export const flashConfig: Writable<AmoFlashConfig> = {
  subscribe(run) {
    run(getConfig());
    return subscribeConfig(() => run(getConfig()));
  },
  set(value) {
    configure(value);
  },
  update(updater) {
    configure(updater(getConfig()));
  },
};

/**
 * Call from your root component's `onMount`:
 *
 * ```svelte
 * onMount(() => initFlash({ position: "bottom-right" }));
 * ```
 *
 * Returns the cleanup function, so `onMount` unmounts it for you.
 */
export function initFlash(options?: AmoFlashConfigInput): () => void {
  if (options) configure(options);
  return mountFlash();
}
