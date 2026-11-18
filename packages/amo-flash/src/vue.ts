import { configure, flash, mountFlash, type AmoFlashConfigInput, type FlashApi } from "amo-flash";

export * from "amo-flash";

/** The parts of a Vue 3 `App` the plugin uses (keeps `vue` out of the dependency list). */
export interface VueAppLike {
  config: { globalProperties: Record<string, unknown> };
  provide: (key: string | symbol, value: unknown) => unknown;
  onUnmount?: (callback: () => void) => void;
}

/** Injection key: `inject(AMO_FLASH_KEY)` returns the `flash` API. */
export const AMO_FLASH_KEY = "amo-flash";

/**
 * Vue 3 plugin: mounts the viewport, exposes `this.$flash` and `inject(AMO_FLASH_KEY)`.
 *
 * ```ts
 * app.use(createAmoFlash({ position: "bottom-right" }))
 * ```
 */
export function createAmoFlash(options?: AmoFlashConfigInput) {
  return {
    install(app: VueAppLike): void {
      if (options) configure(options);
      app.config.globalProperties.$flash = flash;
      app.provide(AMO_FLASH_KEY, flash);
      if (typeof window !== "undefined") {
        const release = mountFlash();
        app.onUnmount?.(release);
      }
    },
  };
}

/** Same object as `createAmoFlash()` with no options: `app.use(AmoFlashPlugin)`. */
export const AmoFlashPlugin = createAmoFlash();

/** Composable: `const flash = useFlash()`. Works anywhere, no injection context needed. */
export function useFlash(): FlashApi {
  return flash;
}
