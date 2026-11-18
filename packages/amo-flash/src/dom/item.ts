import type { AmoFlashConfig } from "../config";
import type { FlashRecord } from "../types";
import { createBadge, createCloseIcon, createRing, createTrack, type CountdownTiming } from "./icons";

/** Icon choreography stays "fresh" this long after create / update. */
const FRESH_MS = 1300;
const SWIPE_DISMISS_PX = 90;
const MORPH_MS = 550;
const MORPH_EASE = "cubic-bezier(.22,1.15,.36,1)";

export type Size = { w: number; h: number };

export type ItemLayout = {
  /** Position among the visible (non-leaving) flashes, 0 = front. */
  index: number;
  /** translateY in px (already signed for the screen edge). */
  y: number;
  scale: number;
  hidden: boolean;
  /** Collapsed-deck flashes behind the front take the front's size and hide their content. */
  behindSize: Size | null;
  zIndex: number;
};

export type ItemCallbacks = {
  onDismiss: (id: string) => void;
  onMeasure: (id: string, size: Size) => void;
};

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true
  );
}

function timingFor(item: FlashRecord, paused: boolean, now: number): CountdownTiming | null {
  if (item.total === null || item.remaining === null) return null;
  const running = item.startedAt !== null && !paused ? now - item.startedAt : 0;
  return { total: item.total, elapsed: item.total - item.remaining + running, paused };
}

function div(className: string): HTMLDivElement {
  const node = document.createElement("div");
  node.className = className;
  return node;
}

function span(className: string): HTMLSpanElement {
  const node = document.createElement("span");
  node.className = className;
  return node;
}

/** One "Signal" pill, rendered with plain DOM and updated in place. */
export class FlashItemView {
  readonly el: HTMLLIElement;
  private readonly bumpEl = div("af-bump");
  private readonly swipeEl = div("af-swipe");
  private readonly pillEl = div("af-pill");
  private readonly iconEl = span("af-icon");
  private iconInner: HTMLSpanElement | null = null;
  private readonly bodyEl = div("af-body");
  private readonly titleEl = span("af-title");
  private readonly countEl = span("af-count");
  private readonly actionEl = document.createElement("button");
  private readonly msgWrap = div("af-msg-wrap");
  private readonly msgEl = div("af-msg");
  private closeEl: HTMLButtonElement | null = null;
  private countdownEls: Element[] = [];
  private countdownSig = "";

  private item: FlashRecord;
  private entering = true;
  private renderedVersion = -1;
  private renderedBump: number;
  private freshTimer: ReturnType<typeof setTimeout> | undefined;
  private morphTimer: ReturnType<typeof setTimeout> | undefined;
  private lastWidth: number | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private drag: { startX: number; pointerId: number } | null = null;
  private swipeEnabled = true;

  constructor(
    item: FlashRecord,
    private readonly callbacks: ItemCallbacks,
  ) {
    this.item = item;
    this.renderedBump = item.bump;

    this.el = document.createElement("li");
    this.el.className = "af-slot";
    this.el.dataset.flashId = item.id;

    const head = div("af-head");
    this.actionEl.type = "button";
    this.actionEl.className = "af-action";
    this.actionEl.addEventListener("click", () => {
      this.item.action?.onClick();
      this.callbacks.onDismiss(this.item.id);
    });
    head.append(this.titleEl);

    this.msgWrap.appendChild(this.msgEl);
    this.bodyEl.append(head, this.msgWrap);
    this.pillEl.append(this.iconEl, this.bodyEl);
    this.pillEl.setAttribute("aria-atomic", "true");
    this.pillEl.addEventListener("animationend", (event) => {
      if (event.target === this.pillEl && this.entering) {
        this.entering = false;
        this.pillEl.classList.remove(
          "af-enter",
          ...[...this.pillEl.classList].filter((c) => c.startsWith("af-enter-")),
        );
      }
    });

    this.swipeEl.appendChild(this.pillEl);
    this.bumpEl.appendChild(this.swipeEl);
    this.bumpEl.addEventListener("animationend", () => this.bumpEl.classList.remove("af-bumping"));
    this.el.appendChild(this.bumpEl);

    this.swipeEl.addEventListener("pointerdown", this.onPointerDown);
    this.swipeEl.addEventListener("pointermove", this.onPointerMove);
    this.swipeEl.addEventListener("pointerup", this.endDrag);
    this.swipeEl.addEventListener("pointercancel", this.endDrag);

    if (typeof ResizeObserver !== "undefined") {
      this.resizeObserver = new ResizeObserver(() => this.measure());
      this.resizeObserver.observe(this.pillEl);
    }
  }

  /** Report the pill's layout size (offset sizes ignore the deck's scale transform). */
  measure(): void {
    this.lastWidth = this.pillEl.offsetWidth;
    this.callbacks.onMeasure(this.item.id, { w: this.pillEl.offsetWidth, h: this.pillEl.offsetHeight });
  }

  render(item: FlashRecord, layout: ItemLayout, config: AmoFlashConfig, paused: boolean): void {
    const previousVersion = this.renderedVersion;
    this.item = item;
    this.swipeEnabled = config.swipeToDismiss;
    const behind = layout.behindSize !== null;
    const isError = item.type === "error";

    // ---- content
    this.pillEl.dataset.type = item.type;
    this.pillEl.setAttribute("role", isError ? "alert" : "status");
    this.pillEl.setAttribute("aria-live", isError ? "assertive" : "polite");
    if (this.titleEl.textContent !== item.title) this.titleEl.textContent = item.title;

    const head = this.titleEl.parentElement as HTMLElement;
    if (item.count > 1) {
      this.countEl.textContent = `×${item.count}`;
      this.countEl.setAttribute("aria-label", `${item.count} ${config.labels.times}`);
      if (!this.countEl.isConnected) head.insertBefore(this.countEl, this.titleEl.nextSibling);
    } else {
      this.countEl.remove();
    }

    if (item.action) {
      if (this.actionEl.textContent !== item.action.label) this.actionEl.textContent = item.action.label;
      if (!this.actionEl.isConnected) head.appendChild(this.actionEl);
    } else {
      this.actionEl.remove();
    }

    if (item.message) {
      if (this.msgEl.textContent !== item.message) this.msgEl.textContent = item.message;
      if (!this.msgWrap.isConnected) this.bodyEl.appendChild(this.msgWrap);
    } else {
      this.msgWrap.remove();
    }

    // ---- icon choreography: replays on create and on every update()
    if (item.version !== previousVersion) {
      this.renderedVersion = item.version;
      const inner = span("af-icon-inner af-fresh");
      inner.append(span("af-ripple"), createBadge(item.type));
      inner.firstElementChild?.setAttribute("aria-hidden", "true");
      if (this.iconInner) this.iconInner.replaceWith(inner);
      else this.iconEl.prepend(inner);
      this.iconInner = inner;
      clearTimeout(this.freshTimer);
      this.freshTimer = setTimeout(() => inner.classList.remove("af-fresh"), FRESH_MS);
      if (previousVersion !== -1) this.morphWidth(behind);
    }

    // ---- dedupe "bump": scale 1 → 1.04 → 1
    if (item.bump !== this.renderedBump) {
      this.renderedBump = item.bump;
      this.bumpEl.classList.remove("af-bumping");
      void this.bumpEl.offsetWidth;
      this.bumpEl.classList.add("af-bumping");
    }

    // ---- close button
    if (config.closeButton && !this.closeEl) {
      const close = document.createElement("button");
      close.type = "button";
      close.className = "af-close";
      close.appendChild(createCloseIcon());
      close.addEventListener("click", () => this.callbacks.onDismiss(this.item.id));
      this.pillEl.appendChild(close);
      this.closeEl = close;
      this.countdownSig = "";
    } else if (!config.closeButton && this.closeEl) {
      this.closeEl.remove();
      this.closeEl = null;
      this.countdownSig = "";
    }
    this.closeEl?.setAttribute("aria-label", config.labels.dismiss);

    // ---- countdown
    const timing = timingFor(item, paused, Date.now());
    const placement = config.countdown === "close" && !config.closeButton ? "ring" : config.countdown;
    const showCountdown = placement !== "none" && timing !== null && !behind;
    const frozen = paused || item.leaving;
    const sig = showCountdown ? `${item.timerKey}|${placement}|${item.total}` : "none";
    if (sig !== this.countdownSig) {
      this.countdownSig = sig;
      for (const node of this.countdownEls) node.remove();
      this.countdownEls = [];
      if (showCountdown && timing) {
        if (placement === "close" && this.closeEl) {
          const ring = createRing("close", timing);
          this.closeEl.prepend(ring);
          this.countdownEls.push(ring);
        } else if (placement === "ring") {
          const ring = createRing("icon", timing);
          this.iconEl.appendChild(ring);
          this.countdownEls.push(ring);
        } else if (placement !== "close") {
          const track = createTrack(placement, timing);
          this.pillEl.prepend(track);
          this.countdownEls.push(track);
        }
      }
    } else {
      for (const node of this.countdownEls) {
        const anims = node.matches(".af-countdown-anim")
          ? [node]
          : [...node.querySelectorAll(".af-countdown-anim")];
        for (const anim of anims)
          (anim as HTMLElement).style.animationPlayState = frozen ? "paused" : "running";
      }
    }

    // ---- pill classes
    const expandable = config.expandOnHover && Boolean(item.message) && !behind;
    const classes = [
      "af-pill",
      this.entering && !item.leaving ? `af-enter af-enter-${config.entrance}` : "",
      item.leaving ? `af-exit af-exit-${config.entrance}` : "",
      behind ? "af-behind" : "",
      expandable ? "af-expandable" : "",
      config.closeButton ? "" : "af-no-close",
      showCountdown && placement === "ring" ? "af-has-icon-ring" : "",
    ]
      .filter(Boolean)
      .join(" ");
    if (this.pillEl.className !== classes) this.pillEl.className = classes;

    // ---- stack layout
    const slot = this.el.style;
    slot.setProperty("--af-y", `${layout.y}px`);
    slot.setProperty("--af-scale", String(layout.scale));
    slot.zIndex = String(layout.zIndex);
    this.el.classList.toggle("af-slot-hidden", layout.hidden);
    if (layout.hidden) this.el.setAttribute("aria-hidden", "true");
    else this.el.removeAttribute("aria-hidden");
    if (layout.behindSize) {
      this.pillEl.style.width = `${layout.behindSize.w}px`;
      this.pillEl.style.height = `${layout.behindSize.h}px`;
    } else if (!this.morphTimer) {
      this.pillEl.style.width = "";
      this.pillEl.style.height = "";
    }
  }

  /** Width morph (FLIP) when update() changes the content. */
  private morphWidth(behind: boolean): void {
    const el = this.pillEl;
    const from = this.lastWidth;
    if (behind || from === null || from === 0 || prefersReducedMotion()) return;
    el.style.width = "";
    const to = el.offsetWidth;
    if (Math.abs(from - to) < 1) return;
    el.style.transition = "none";
    el.style.width = `${from}px`;
    void el.offsetWidth; // flush so the browser starts from the old width
    el.style.transition = `width ${MORPH_MS}ms ${MORPH_EASE}`;
    el.style.width = `${to}px`;
    clearTimeout(this.morphTimer);
    this.morphTimer = setTimeout(() => {
      this.morphTimer = undefined;
      el.style.width = "";
      el.style.transition = "";
      this.measure();
    }, MORPH_MS + 60);
  }

  private onPointerDown = (event: PointerEvent): void => {
    if (!this.swipeEnabled || this.item.leaving || event.button !== 0) return;
    if ((event.target as Element | null)?.closest?.("button, a")) return;
    this.drag = { startX: event.clientX, pointerId: event.pointerId };
    this.swipeEl.setPointerCapture?.(event.pointerId);
    this.swipeEl.classList.add("af-dragging");
  };

  private onPointerMove = (event: PointerEvent): void => {
    if (!this.drag || this.drag.pointerId !== event.pointerId) return;
    const dx = event.clientX - this.drag.startX;
    this.swipeEl.style.transform = `translateX(${dx}px)`;
    this.swipeEl.style.opacity = String(Math.max(0.2, 1 - Math.abs(dx) / 220));
  };

  private endDrag = (event: PointerEvent): void => {
    if (!this.drag || this.drag.pointerId !== event.pointerId) return;
    const dx = event.clientX - this.drag.startX;
    this.drag = null;
    this.swipeEl.classList.remove("af-dragging");
    if (Math.abs(dx) > SWIPE_DISMISS_PX) {
      this.swipeEl.style.transform = `translateX(${dx > 0 ? 140 : -140}%)`;
      this.swipeEl.style.opacity = "0";
      this.callbacks.onDismiss(this.item.id);
    } else {
      this.swipeEl.style.transform = "";
      this.swipeEl.style.opacity = "";
    }
  };

  destroy(): void {
    clearTimeout(this.freshTimer);
    clearTimeout(this.morphTimer);
    this.resizeObserver?.disconnect();
    this.el.remove();
  }
}
