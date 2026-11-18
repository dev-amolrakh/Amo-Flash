import { isLightColor, type AmoFlashConfig } from "../config";
import { primeAudioOnGesture } from "../sounds";
import type { FlashStore } from "../store";
import type { FlashRecord } from "../types";
import { FlashItemView, type ItemLayout, type Size } from "./item";
import css from "../styles.css?raw";

const DECK_OFFSET_PX = 12;
const DECK_SCALE_STEP = 0.06;
const DECK_MAX_BEHIND = 3;
const LIST_GAP_PX = 10;
const FALLBACK_SIZE: Size = { w: 0, h: 40 };
const STYLE_ATTR = "data-amo-flash";

/** Inject the stylesheet once per document (skipped when the page already has it). */
export function injectStyles(doc: Document = document): void {
  if (doc.head.querySelector(`style[${STYLE_ATTR}]`)) return;
  const style = doc.createElement("style");
  style.setAttribute(STYLE_ATTR, "");
  style.textContent = css;
  doc.head.prepend(style);
}

/* ---------- colour scheme ---------- */

const SCHEME_ATTRS = ["data-theme", "data-color-scheme", "data-mantine-color-scheme", "data-bs-theme"];

function schemeFrom(el: Element | null): "light" | "dark" | null {
  if (!el) return null;
  if (el.classList.contains("dark")) return "dark";
  if (el.classList.contains("light")) return "light";
  for (const attr of SCHEME_ATTRS) {
    const value = el.getAttribute(attr);
    if (value === "dark" || value === "light") return value;
  }
  return null;
}

/** `auto`: the page's own switch (class or data attribute on <html>/<body>), else the OS setting. */
export function detectScheme(theme: AmoFlashConfig["theme"]): "light" | "dark" {
  if (theme !== "auto") return theme;
  if (typeof document === "undefined") return "light";
  const explicit = schemeFrom(document.documentElement) ?? schemeFrom(document.body);
  if (explicit) return explicit;
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function watchScheme(onChange: () => void): () => void {
  const cleanups: Array<() => void> = [];
  if (typeof MutationObserver !== "undefined") {
    const observer = new MutationObserver(onChange);
    const options = { attributes: true, attributeFilter: ["class", ...SCHEME_ATTRS] };
    observer.observe(document.documentElement, options);
    if (document.body) observer.observe(document.body, options);
    cleanups.push(() => observer.disconnect());
  }
  const media = window.matchMedia?.("(prefers-color-scheme: dark)");
  if (media?.addEventListener) {
    media.addEventListener("change", onChange);
    cleanups.push(() => media.removeEventListener("change", onChange));
  }
  return () => cleanups.forEach((fn) => fn());
}

/* ---------- layout ---------- */

export function computeLayouts(
  items: readonly FlashRecord[],
  sizes: ReadonlyMap<string, Size>,
  expanded: boolean,
  dir: 1 | -1,
): { layouts: Map<string, ItemLayout>; height: number } {
  const layouts = new Map<string, ItemLayout>();
  const live = items.filter((i) => !i.leaving);
  const front = live[0];
  const frontSize = front ? (sizes.get(front.id) ?? FALLBACK_SIZE) : FALLBACK_SIZE;

  const listOffsets: number[] = [];
  let cursor = 0;
  for (const item of live) {
    listOffsets.push(cursor);
    cursor += (sizes.get(item.id) ?? FALLBACK_SIZE).h + LIST_GAP_PX;
  }
  const listHeight = Math.max(0, cursor - LIST_GAP_PX);

  let liveBefore = 0;
  items.forEach((item, order) => {
    const index = liveBefore;
    if (!item.leaving) liveBefore += 1;
    const zIndex = items.length - order;

    if (expanded) {
      layouts.set(item.id, {
        index,
        y: dir * (listOffsets[Math.min(index, listOffsets.length - 1)] ?? 0),
        scale: 1,
        hidden: false,
        behindSize: null,
        zIndex,
      });
      return;
    }

    const depth = Math.min(index, DECK_MAX_BEHIND);
    layouts.set(item.id, {
      index,
      y: dir * DECK_OFFSET_PX * depth,
      scale: 1 - DECK_SCALE_STEP * depth,
      hidden: index > DECK_MAX_BEHIND,
      behindSize: index > 0 && !item.leaving && frontSize.w > 0 ? frontSize : null,
      zIndex,
    });
  });

  const height = expanded
    ? listHeight
    : live.length === 0
      ? 0
      : frontSize.h + DECK_OFFSET_PX * Math.min(live.length - 1, DECK_MAX_BEHIND);

  return { layouts, height };
}

/* ---------- viewport ---------- */

export type ViewportDeps = {
  store: FlashStore;
  getConfig: () => AmoFlashConfig;
  subscribeConfig: (listener: () => void) => () => void;
};

/** The one on-screen region that renders every flash. */
export class Viewport {
  private readonly section: HTMLElement;
  private readonly list: HTMLOListElement;
  private readonly views = new Map<string, FlashItemView>();
  private readonly sizes = new Map<string, Size>();
  private hovered = false;
  private focused = false;
  private readonly cleanups: Array<() => void> = [];

  constructor(
    private readonly deps: ViewportDeps,
    target: HTMLElement,
  ) {
    if (deps.getConfig().injectStyles) injectStyles(target.ownerDocument);

    this.section = document.createElement("section");
    this.list = document.createElement("ol");
    this.section.appendChild(this.list);
    target.appendChild(this.section);

    const list = this.list;
    list.addEventListener("pointerenter", () => this.setHovered(true));
    list.addEventListener("pointerleave", () => this.setHovered(false));
    list.addEventListener("focusin", () => {
      this.focused = true;
      this.render();
    });
    list.addEventListener("focusout", (event) => {
      if (!list.contains(event.relatedTarget as Node | null)) {
        this.focused = false;
        this.render();
      }
    });
    list.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      const slot = (event.target as HTMLElement).closest<HTMLElement>("[data-flash-id]");
      const id = slot?.dataset.flashId;
      if (id) {
        event.stopPropagation();
        deps.store.dismiss(id);
      }
    });

    // The stack can shrink away from under a still pointer: re-check on the next move.
    const recheck = (event: PointerEvent) => {
      if (!this.hovered) return;
      const target = event.target as Element | null;
      if (!target?.closest?.(".af-viewport")) this.setHovered(false);
    };
    const reset = () => this.setHovered(false);
    window.addEventListener("pointermove", recheck, true);
    window.addEventListener("blur", reset);
    this.cleanups.push(() => {
      window.removeEventListener("pointermove", recheck, true);
      window.removeEventListener("blur", reset);
    });

    this.cleanups.push(deps.store.subscribe(() => this.render()));
    this.cleanups.push(deps.subscribeConfig(() => this.render()));
    this.cleanups.push(watchScheme(() => this.render()));
    primeAudioOnGesture();
    this.render();
  }

  private setHovered(value: boolean): void {
    if (this.hovered === value) return;
    this.hovered = value;
    this.render();
  }

  private onMeasure = (id: string, size: Size): void => {
    const current = this.sizes.get(id);
    if (current && current.w === size.w && current.h === size.h) return;
    this.sizes.set(id, size);
    this.render();
  };

  private onDismiss = (id: string): void => this.deps.store.dismiss(id);

  render(): void {
    const { store, getConfig } = this.deps;
    const config = getConfig();
    const { items, paused } = store.getState();

    const liveCount = items.filter((i) => !i.leaving).length;
    const active = (this.hovered || this.focused) && liveCount > 0;

    // Pause every timer + countdown while the pointer (or keyboard focus) is in the viewport.
    const shouldPause = active && config.pauseOnHover;
    if (shouldPause !== paused) {
      if (shouldPause) store.pause();
      else store.resume();
      return; // the store notifies us again with the new state
    }

    const expanded = config.stacking === "list" || active;
    const dir: 1 | -1 = config.position.startsWith("bottom") ? -1 : 1;

    // drop views + sizes of flashes that are gone
    const ids = new Set(items.map((i) => i.id));
    for (const [id, view] of this.views) {
      if (!ids.has(id)) {
        view.destroy();
        this.views.delete(id);
        this.sizes.delete(id);
      }
    }

    // create views for new flashes, keeping DOM order = store order (newest first)
    const created: FlashItemView[] = [];
    let anchor: Element | null = null;
    for (let i = items.length - 1; i >= 0; i -= 1) {
      const item = items[i] as FlashRecord;
      let view = this.views.get(item.id);
      if (!view) {
        view = new FlashItemView(item, { onDismiss: this.onDismiss, onMeasure: this.onMeasure });
        this.views.set(item.id, view);
        this.list.insertBefore(view.el, anchor ? anchor : this.list.firstChild);
        created.push(view);
      }
      anchor = view.el;
    }

    const { layouts, height } = computeLayouts(items, this.sizes, expanded, dir);
    for (const item of items) {
      const layout = layouts.get(item.id);
      if (layout) this.views.get(item.id)?.render(item, layout, config, paused);
    }

    // viewport attributes
    const list = this.list;
    list.className = `af-viewport af-pos-${config.position}${dir === -1 ? " af-bottom" : ""}`;
    list.dataset.scheme = detectScheme(config.theme);
    list.dataset.tone = config.background && isLightColor(config.background) ? "light" : "dark";
    list.dataset.active = liveCount > 0 ? "true" : "false";
    list.style.height = `${height}px`;
    list.style.setProperty("--af-offset", `${config.offset}px`);
    list.style.setProperty("--af-z", String(config.zIndex));
    if (config.background) list.style.setProperty("--af-surface", config.background);
    else list.style.removeProperty("--af-surface");
    this.section.setAttribute("aria-label", config.labels.region);

    // measure new pills once they are in the DOM with content
    for (const view of created) view.measure();
  }

  destroy(): void {
    for (const fn of this.cleanups) fn();
    for (const view of this.views.values()) view.destroy();
    this.views.clear();
    this.section.remove();
  }
}
