/**
 * Amo Flash — beautiful, framework-agnostic flash messages.
 * https://github.com/dev-amolrakh/amo-flash · MIT
 */
export {
  flash,
  mountFlash,
  unmountFlash,
  getFlashes,
  subscribe,
  previewSound,
  shouldPlaySound,
  type FlashApi,
} from "./flash";
export {
  configure,
  getConfig,
  resetConfig,
  subscribeConfig,
  sanitizeConfig,
  normalizeColor,
  isLightColor,
  relativeLuminance,
  DEFAULT_CONFIG,
  POSITIONS,
  COUNTDOWNS,
  ENTRANCES,
  STACKINGS,
  SOUND_PACKS,
  SOUND_TYPES,
  THEMES,
  type AmoFlashConfig,
  type AmoFlashConfigInput,
  type FlashPosition,
  type FlashCountdown,
  type FlashEntrance,
  type FlashStacking,
  type FlashSoundPack,
  type FlashSoundConfig,
  type FlashTheme,
  type FlashLabels,
} from "./config";
export { createFlashStore, REPEAT_WINDOW_MS, EXIT_MS, ACTION_DURATION_FACTOR } from "./store";
export type { FlashStore, FlashState, StoreConfig, StoreDeps } from "./store";
export { injectStyles, detectScheme } from "./dom/viewport";
export { primeAudioOnGesture } from "./sounds";
export type {
  FlashType,
  FlashSoundType,
  FlashAction,
  FlashDuration,
  FlashOptions,
  FlashUpdate,
  FlashRecord,
  FlashPromiseContent,
  FlashPromiseMessages,
} from "./types";

export const VERSION = "1.0.0";
