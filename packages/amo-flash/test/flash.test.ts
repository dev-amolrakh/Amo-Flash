import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/sounds", () => ({
  playSound: vi.fn(),
  primeAudioOnGesture: vi.fn(),
}));

import {
  configure,
  DEFAULT_CONFIG,
  EXIT_MS,
  flash,
  getConfig,
  getFlashes,
  isLightColor,
  normalizeColor,
  resetConfig,
  sanitizeConfig,
  shouldPlaySound,
  subscribe,
  subscribeConfig,
  unmountFlash,
} from "../src/index";
import { playSound } from "../src/sounds";

const live = () => getFlashes().filter((i) => !i.leaving);

describe("flash API", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetConfig();
  });
  afterEach(() => {
    flash.dismissAll();
    vi.advanceTimersByTime(EXIT_MS + 2000);
    vi.useRealTimers();
    unmountFlash();
    vi.mocked(playSound).mockClear();
  });

  it("each helper creates its own type", () => {
    configure({ maxVisible: 6 });
    flash.success("A");
    flash.error("B");
    flash.warning("C");
    flash.info("D");
    flash.notify("E");
    flash.loading("F");
    expect(live().map((i) => i.type)).toEqual([
      "loading",
      "notification",
      "info",
      "warning",
      "error",
      "success",
    ]);
  });

  it("promise: loading → success in one pill with one id", async () => {
    let resolve: (value: string) => void = () => undefined;
    const pending = new Promise<string>((r) => {
      resolve = r;
    });
    const result = flash.promise(pending, {
      loading: "Exporting",
      success: (file) => ({ title: "Exported", message: file }),
      error: "Export failed",
    });

    expect(live()).toHaveLength(1);
    const id = live()[0]?.id;
    expect(live()[0]?.type).toBe("loading");

    resolve("orders.csv");
    await expect(result).resolves.toBe("orders.csv");
    expect(live()).toHaveLength(1);
    expect(live()[0]).toMatchObject({ id, type: "success", title: "Exported", message: "orders.csv" });
  });

  it("promise: loading → error keeps the same pill and rethrows", async () => {
    const result = flash.promise(() => Promise.reject(new Error("boom")), {
      loading: "Exporting",
      success: "Exported",
      error: (e) => `Export failed: ${(e as Error).message}`,
    });
    await expect(result).rejects.toThrow("boom");
    expect(live()).toHaveLength(1);
    expect(live()[0]).toMatchObject({ type: "error", title: "Export failed: boom" });
  });

  it("loading → update morphs one pill", () => {
    const id = flash.loading("Uploading", { message: "40%" });
    flash.update(id, { type: "success", title: "Uploaded", message: "report.pdf" });
    expect(live()).toHaveLength(1);
    expect(live()[0]).toMatchObject({ id, type: "success", title: "Uploaded", version: 1 });
  });

  it("uses the configured duration live", () => {
    configure({ duration: 2000 });
    flash.info("Short");
    vi.advanceTimersByTime(2000);
    expect(live()).toHaveLength(0);
  });

  it("notifies headless subscribers", () => {
    const listener = vi.fn();
    const off = subscribe(listener);
    flash.success("Saved");
    expect(listener).toHaveBeenCalled();
    off();
  });

  it("plays sounds only when enabled, and never for loading", () => {
    flash.success("Silent by default");
    expect(playSound).not.toHaveBeenCalled();

    configure({ sound: { enabled: true, pack: "pop" } });
    flash.success("Ding");
    expect(playSound).toHaveBeenCalledWith("pop", "success", DEFAULT_CONFIG.sound.volume);
    flash.loading("Working");
    expect(playSound).toHaveBeenCalledTimes(1);
  });

  it("per-call sound override respects the global switch", () => {
    expect(shouldPlaySound("info", true)).toBe(false);
    configure({ sound: { enabled: true } });
    expect(shouldPlaySound("info", undefined)).toBe(false); // info is not in playFor by default
    expect(shouldPlaySound("info", true)).toBe(true);
    expect(shouldPlaySound("success", false)).toBe(false);
  });
});

describe("config", () => {
  beforeEach(() => {
    resetConfig();
    localStorage.clear();
  });

  it("sanitizes untrusted input onto the base", () => {
    const config = sanitizeConfig({
      position: "middle",
      maxVisible: 99,
      duration: -5,
      sound: { volume: 4, pack: "nope", playFor: ["error", "bogus"] },
      background: "red",
      extra: true,
    });
    expect(config.position).toBe(DEFAULT_CONFIG.position);
    expect(config.maxVisible).toBe(10);
    expect(config.duration).toBe(1000);
    expect(config.sound).toEqual({ enabled: false, pack: "chime", volume: 1, playFor: ["error"] });
    expect(config.background).toBeNull();
    expect("extra" in config).toBe(false);
  });

  it("normalizes colours and picks a readable text tone", () => {
    expect(normalizeColor("#ABC")).toBe("#aabbcc");
    expect(normalizeColor(" #FFAA00 ")).toBe("#ffaa00");
    expect(normalizeColor("rgb(0,0,0)")).toBeNull();
    expect(isLightColor("#ffffff")).toBe(true);
    expect(isLightColor("#fcc419")).toBe(true);
    expect(isLightColor("#111113")).toBe(false);
    expect(isLightColor("#1971c2")).toBe(false);
  });

  it("configure merges, notifies, and null clears the background", () => {
    const listener = vi.fn();
    const off = subscribeConfig(listener);
    configure({ position: "bottom-right", background: "#ffffff" });
    expect(getConfig()).toMatchObject({ position: "bottom-right", background: "#ffffff", stacking: "deck" });
    configure({ background: null });
    expect(getConfig().background).toBeNull();
    expect(listener).toHaveBeenCalledTimes(2);
    off();
  });

  it("persist: saved preferences win on first load and later changes are saved", () => {
    localStorage.setItem(
      "my-flash",
      JSON.stringify({ position: "top-left", zIndex: 1, sound: { enabled: true } }),
    );
    configure({ persist: "my-flash", position: "bottom-center" });
    expect(getConfig().position).toBe("top-left");
    expect(getConfig().sound.enabled).toBe(true);
    expect(getConfig().zIndex).toBe(DEFAULT_CONFIG.zIndex); // not a preference key

    configure({ stacking: "list" });
    const saved = JSON.parse(localStorage.getItem("my-flash") ?? "{}") as Record<string, unknown>;
    expect(saved.stacking).toBe("list");
    expect(saved.position).toBe("top-left");
    expect("persist" in saved).toBe(false);
  });

  it("resetConfig restores preferences but keeps wiring", () => {
    configure({ position: "bottom-left", zIndex: 50, labels: { dismiss: "Fermer" } });
    resetConfig();
    expect(getConfig().position).toBe(DEFAULT_CONFIG.position);
    expect(getConfig().zIndex).toBe(50);
    expect(getConfig().labels.dismiss).toBe("Fermer");
    configure({ zIndex: DEFAULT_CONFIG.zIndex, labels: DEFAULT_CONFIG.labels, persist: false });
  });
});
