import { useEffect, useSyncExternalStore } from "react";

import {
  configure,
  flash,
  getConfig,
  getFlashes,
  mountFlash,
  subscribe,
  subscribeConfig,
  type AmoFlashConfig,
  type AmoFlashConfigInput,
  type FlashApi,
  type FlashRecord,
} from "amo-flash";

export * from "amo-flash";

export type AmoFlashProps = AmoFlashConfigInput & {
  /** Element to render the viewport into (default `document.body`). Used on first mount only. */
  container?: HTMLElement | null;
};

/**
 * Mount Amo Flash once near the root of your app. Every prop is optional and maps to `configure()`.
 *
 * ```tsx
 * <AmoFlash position="bottom-right" sound={{ enabled: true }} />
 * ```
 */
export function AmoFlash({ container, ...config }: AmoFlashProps): null {
  // Props are plain data: a serialized key keeps the effect stable across renders.
  const key = JSON.stringify(config);

  useEffect(() => {
    configure(JSON.parse(key) as AmoFlashConfigInput);
  }, [key]);

  useEffect(() => mountFlash(container ?? undefined), [container]);

  return null;
}

/** The `flash` API, for components that prefer a hook. */
export function useFlash(): FlashApi {
  return flash;
}

/** The live configuration (re-renders when `configure()` changes it). */
export function useFlashConfig(): AmoFlashConfig {
  return useSyncExternalStore(subscribeConfig, getConfig, getConfig);
}

const emptyList: readonly FlashRecord[] = [];

/** The live queue, newest first — for custom / headless renderers. */
export function useFlashes(): readonly FlashRecord[] {
  return useSyncExternalStore(subscribe, getFlashes, () => emptyList);
}
