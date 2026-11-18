import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { EXIT_MS, REPEAT_WINDOW_MS, createFlashStore, type StoreConfig } from "../src/store";

function setup(overrides: Partial<StoreConfig> = {}) {
  const config: StoreConfig = {
    duration: 4500,
    errorsPersist: true,
    maxVisible: 4,
    ...overrides,
  };
  const onSound = vi.fn();
  const store = createFlashStore({ getConfig: () => config, onSound, now: () => Date.now() });
  const live = () => store.getState().items.filter((i) => !i.leaving);
  return { store, onSound, live, config };
}

describe("flash store", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-18T10:00:00Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("adds newest first and auto-dismisses after the configured time", () => {
    const { store, live } = setup();
    store.add("success", "Saved");
    store.add("info", "Synced");
    expect(live().map((i) => i.title)).toEqual(["Synced", "Saved"]);

    vi.advanceTimersByTime(4499);
    expect(live()).toHaveLength(2);
    vi.advanceTimersByTime(1);
    expect(live()).toHaveLength(0);
    vi.advanceTimersByTime(EXIT_MS);
    expect(store.getState().items).toHaveLength(0);
  });

  it("gives items with an action 1.5× the duration", () => {
    const { store, live } = setup();
    store.add("success", "Member removed", { action: { label: "Undo", onClick: () => undefined } });
    vi.advanceTimersByTime(4500 * 1.5 - 1);
    expect(live()).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(live()).toHaveLength(0);
  });

  it("dedupes a visible repeat: bump + counter + timer reset, no second sound", () => {
    const { store, live, onSound } = setup();
    const first = store.add("error", "Network down", { duration: 3000 });
    vi.advanceTimersByTime(2000);
    const second = store.add("error", "Network down", { duration: 3000 });

    expect(second).toBe(first);
    expect(live()).toHaveLength(1);
    expect(live()[0]?.count).toBe(2);
    expect(live()[0]?.bump).toBe(1);
    expect(onSound).toHaveBeenCalledTimes(1);

    // timer restarted from the full duration
    vi.advanceTimersByTime(2999);
    expect(live()).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(live()).toHaveLength(0);
  });

  it("honours a custom dedupeKey", () => {
    const { store, live } = setup();
    store.add("error", "Request failed (1)", { dedupeKey: "orders-poll" });
    store.add("error", "Request failed (2)", { dedupeKey: "orders-poll" });
    expect(live()).toHaveLength(1);
    expect(live()[0]?.count).toBe(2);
  });

  it("ignores an identical flash within 1500 ms of dismissal, but not after", () => {
    const { store, live } = setup();
    const id = store.add("success", "Saved");
    store.dismiss(id);
    vi.advanceTimersByTime(REPEAT_WINDOW_MS - 100);
    store.add("success", "Saved");
    expect(live()).toHaveLength(0);

    vi.advanceTimersByTime(200);
    store.add("success", "Saved");
    expect(live()).toHaveLength(1);
  });

  it("updates in place when show() reuses an id", () => {
    const { store, live } = setup();
    store.add("loading", "Uploading", { id: "upload" });
    const again = store.add("success", "Uploaded", { id: "upload" });

    expect(again).toBe("upload");
    expect(live()).toHaveLength(1);
    expect(live()[0]).toMatchObject({ id: "upload", type: "success", title: "Uploaded", version: 1 });
  });

  it("evicts the oldest when maxVisible is exceeded", () => {
    const { store, live } = setup({ maxVisible: 2 });
    store.add("info", "One");
    store.add("info", "Two");
    store.add("info", "Three");
    expect(live().map((i) => i.title)).toEqual(["Three", "Two"]);
    const evicted = store.getState().items.find((i) => i.title === "One");
    expect(evicted?.leaving).toBe(true);
  });

  it("pauses and resumes with the remaining time preserved", () => {
    const { store, live } = setup();
    store.add("success", "Saved");
    vi.advanceTimersByTime(3000);
    store.pause();
    expect(live()[0]?.remaining).toBe(1500);

    vi.advanceTimersByTime(60_000);
    expect(live()).toHaveLength(1);

    store.resume();
    vi.advanceTimersByTime(1499);
    expect(live()).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(live()).toHaveLength(0);
  });

  it("starts new flashes paused while the viewport is paused", () => {
    const { store, live } = setup();
    store.pause();
    store.add("info", "Queued");
    vi.advanceTimersByTime(10_000);
    expect(live()).toHaveLength(1);
    store.resume();
    vi.advanceTimersByTime(4500);
    expect(live()).toHaveLength(0);
  });

  it("keeps errors until dismissed when errorsPersist is on", () => {
    const { store, live } = setup();
    store.add("error", "Couldn't save");
    vi.advanceTimersByTime(120_000);
    expect(live()).toHaveLength(1);
    expect(live()[0]?.total).toBeNull();
  });

  it("auto-dismisses errors when errorsPersist is off", () => {
    const { store, live } = setup({ errorsPersist: false });
    store.add("error", "Couldn't save");
    vi.advanceTimersByTime(4500);
    expect(live()).toHaveLength(0);
  });

  it("keeps loading until updated, then times out as the new type and plays its sound", () => {
    const { store, live, onSound } = setup();
    const id = store.add("loading", "Exporting");
    vi.advanceTimersByTime(60_000);
    expect(live()).toHaveLength(1);
    expect(onSound).toHaveBeenLastCalledWith("loading", undefined);

    store.update(id, { type: "success", title: "Exported" });
    expect(onSound).toHaveBeenLastCalledWith("success", undefined);
    vi.advanceTimersByTime(4500);
    expect(live()).toHaveLength(0);
  });

  it("dismissAll and dismiss() without id clear everything", () => {
    const { store, live } = setup();
    store.add("info", "A");
    store.add("info", "B");
    store.dismiss();
    expect(live()).toHaveLength(0);
  });
});
