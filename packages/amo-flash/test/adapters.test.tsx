import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/sounds", () => ({
  playSound: vi.fn(),
  primeAudioOnGesture: vi.fn(),
}));

import { AmoFlash, useFlashConfig } from "../src/react";
import { flashConfig, flashes, initFlash } from "../src/svelte";
import { AMO_FLASH_KEY, createAmoFlash } from "../src/vue";
import { flash, getConfig, resetConfig, unmountFlash, type AmoFlashConfig } from "../src/index";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

afterEach(() => {
  flash.dismissAll();
  unmountFlash();
  resetConfig();
});

describe("React adapter", () => {
  it("<AmoFlash /> mounts once, applies props and unmounts cleanly", () => {
    const container = document.createElement("div");
    const root = createRoot(container);
    let seen: AmoFlashConfig | null = null;
    function Probe() {
      seen = useFlashConfig();
      return null;
    }

    act(() => {
      root.render(
        <>
          <AmoFlash position="bottom-left" stacking="list" />
          <Probe />
        </>,
      );
    });
    expect(document.querySelectorAll(".af-viewport")).toHaveLength(1);
    expect(getConfig().position).toBe("bottom-left");
    expect(seen).toMatchObject({ position: "bottom-left", stacking: "list" });

    act(() => root.unmount());
    expect(document.querySelector(".af-viewport")).toBeNull();
  });
});

describe("Svelte adapter", () => {
  it("stores follow the contract: immediate value + updates + unsubscribe", () => {
    const seen: number[] = [];
    const off = flashes.subscribe((list) => seen.push(list.length));
    flash.info("One");
    off();
    flash.info("Two");
    expect(seen[0]).toBe(0);
    expect(seen.at(-1)).toBe(1);

    flashConfig.update((c) => ({ ...c, position: "top-right" }));
    expect(getConfig().position).toBe("top-right");

    const release = initFlash({ entrance: "slide" });
    expect(getConfig().entrance).toBe("slide");
    expect(document.querySelector(".af-viewport")).not.toBeNull();
    release();
  });
});

describe("Vue adapter", () => {
  it("installs $flash, provides the API and mounts", () => {
    const provided = new Map<string | symbol, unknown>();
    const app = {
      config: { globalProperties: {} as Record<string, unknown> },
      provide: (key: string | symbol, value: unknown) => provided.set(key, value),
      onUnmount: vi.fn(),
    };
    createAmoFlash({ position: "bottom-center" }).install(app);
    expect(app.config.globalProperties.$flash).toBe(flash);
    expect(provided.get(AMO_FLASH_KEY)).toBe(flash);
    expect(getConfig().position).toBe("bottom-center");
    expect(document.querySelector(".af-viewport")).not.toBeNull();
    expect(app.onUnmount).toHaveBeenCalledTimes(1);
  });
});
