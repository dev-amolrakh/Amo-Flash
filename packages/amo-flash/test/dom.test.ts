import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/sounds", () => ({
  playSound: vi.fn(),
  primeAudioOnGesture: vi.fn(),
}));

import { configure, EXIT_MS, flash, mountFlash, resetConfig, unmountFlash } from "../src/index";
import { computeLayouts } from "../src/dom/viewport";
import type { FlashRecord } from "../src/types";

const viewport = () => document.querySelector<HTMLOListElement>(".af-viewport");
const pills = () => [...document.querySelectorAll<HTMLElement>(".af-pill")];

describe("DOM renderer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetConfig();
  });
  afterEach(() => {
    flash.dismissAll();
    vi.advanceTimersByTime(EXIT_MS + 100);
    unmountFlash();
    vi.useRealTimers();
    document.documentElement.className = "";
  });

  it("auto-mounts on the first flash and injects the stylesheet once", () => {
    expect(viewport()).toBeNull();
    flash.success("Saved");
    flash.info("Synced");
    expect(viewport()).not.toBeNull();
    expect(document.querySelectorAll("style[data-amo-flash]")).toHaveLength(1);
    expect(document.querySelector("section")?.getAttribute("aria-label")).toBe("Notifications");
  });

  it("renders title, message, type and live-region roles", () => {
    flash.success("Saved", { message: "All changes synced" });
    flash.error("Couldn't save");
    const [error, success] = pills();
    expect(success?.dataset.type).toBe("success");
    expect(success?.getAttribute("role")).toBe("status");
    expect(success?.getAttribute("aria-live")).toBe("polite");
    expect(success?.querySelector(".af-title")?.textContent).toBe("Saved");
    expect(success?.querySelector(".af-msg")?.textContent).toBe("All changes synced");
    expect(error?.getAttribute("role")).toBe("alert");
    expect(error?.getAttribute("aria-live")).toBe("assertive");
  });

  it("never renders titles as HTML", () => {
    flash.info("<img src=x onerror=alert(1)>");
    expect(document.querySelector(".af-title img")).toBeNull();
    expect(document.querySelector(".af-title")?.textContent).toBe("<img src=x onerror=alert(1)>");
  });

  it("close button and action dismiss; action runs its handler", () => {
    const onClick = vi.fn();
    flash.success("Member removed", { action: { label: "Undo", onClick } });
    document.querySelector<HTMLButtonElement>(".af-action")?.click();
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(pills()[0]?.classList.contains("af-exit")).toBe(true);

    flash.info("Another");
    const close = document.querySelector<HTMLButtonElement>(".af-pill:not(.af-exit) .af-close");
    expect(close?.getAttribute("aria-label")).toBe("Dismiss notification");
    close?.click();
    vi.advanceTimersByTime(EXIT_MS + 10);
    expect(pills()).toHaveLength(0);
  });

  it("Escape dismisses the focused flash", () => {
    flash.info("Press escape");
    const close = document.querySelector<HTMLButtonElement>(".af-close");
    close?.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(pills()[0]?.classList.contains("af-exit")).toBe(true);
  });

  it("shows a ×N counter for deduped repeats", () => {
    flash.error("Network down");
    flash.error("Network down");
    flash.error("Network down");
    expect(pills()).toHaveLength(1);
    const count = document.querySelector(".af-count");
    expect(count?.textContent).toBe("×3");
    expect(count?.getAttribute("aria-label")).toBe("3 times");
  });

  it("applies position, colour tone, offset and z-index from config", () => {
    configure({ position: "bottom-right", background: "#ffffff", offset: 24, zIndex: 50 });
    flash.info("Hi");
    const vp = viewport();
    expect(vp?.classList.contains("af-pos-bottom-right")).toBe(true);
    expect(vp?.classList.contains("af-bottom")).toBe(true);
    expect(vp?.dataset.tone).toBe("light");
    expect(vp?.style.getPropertyValue("--af-surface")).toBe("#ffffff");
    expect(vp?.style.getPropertyValue("--af-offset")).toBe("24px");
    expect(vp?.style.getPropertyValue("--af-z")).toBe("50");

    configure({ background: null });
    expect(vp?.dataset.tone).toBe("dark");
    expect(vp?.style.getPropertyValue("--af-surface")).toBe("");
  });

  it("follows the page colour scheme in auto mode", async () => {
    flash.info("Hi");
    expect(viewport()?.dataset.scheme).toBe("light");
    document.documentElement.classList.add("dark");
    await vi.waitFor(() => expect(viewport()?.dataset.scheme).toBe("dark"));
    configure({ theme: "light" });
    expect(viewport()?.dataset.scheme).toBe("light");
  });

  it("draws the countdown where configured, and none for persistent errors", () => {
    flash.success("Countdown ring");
    expect(document.querySelector(".af-close .af-ring-close")).not.toBeNull();
    configure({ countdown: "bar" });
    expect(document.querySelector(".af-cd-bar")).not.toBeNull();
    expect(document.querySelector(".af-ring-close")).toBeNull();
    flash.error("Stays");
    expect(pills()[0]?.querySelector(".af-cd")).toBeNull();
  });

  it("removes the close button when closeButton is off", () => {
    configure({ closeButton: false });
    flash.info("No close");
    expect(document.querySelector(".af-close")).toBeNull();
    expect(pills()[0]?.classList.contains("af-no-close")).toBe(true);
  });

  it("mountFlash is idempotent and renders into a custom container", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const release = mountFlash(host);
    const again = mountFlash(document.body);
    expect(host.querySelector(".af-viewport")).not.toBeNull();
    expect(document.querySelectorAll(".af-viewport")).toHaveLength(1);
    again();
    release();
    expect(document.querySelector(".af-viewport")).toBeNull();
    host.remove();
  });
});

describe("computeLayouts", () => {
  const record = (id: string, leaving = false) => ({ id, leaving }) as FlashRecord;
  const sizes = new Map([
    ["a", { w: 200, h: 40 }],
    ["b", { w: 260, h: 60 }],
    ["c", { w: 180, h: 40 }],
  ]);

  it("deck: offsets, scales and front-size cards behind", () => {
    const { layouts, height } = computeLayouts([record("a"), record("b"), record("c")], sizes, false, 1);
    expect(layouts.get("a")).toMatchObject({ y: 0, scale: 1, behindSize: null });
    expect(layouts.get("b")).toMatchObject({ y: 12, behindSize: { w: 200, h: 40 } });
    expect(layouts.get("c")?.scale).toBeCloseTo(0.88);
    expect(height).toBe(40 + 24);
  });

  it("list: stacks by measured height with a gap, upward at the bottom edge", () => {
    const { layouts, height } = computeLayouts([record("a"), record("b")], sizes, true, -1);
    expect(layouts.get("b")?.y).toBe(-(40 + 10));
    expect(height).toBe(40 + 10 + 60);
  });
});
