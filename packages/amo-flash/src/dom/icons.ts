import type { FlashCountdown } from "../config";
import type { FlashType } from "../types";

const SVG_NS = "http://www.w3.org/2000/svg";
const TRIANGLE =
  "M10.2 2.9 1.6 17.8a2.1 2.1 0 0 0 1.8 3.1h17.2a2.1 2.1 0 0 0 1.8-3.1L13.8 2.9a2.1 2.1 0 0 0-3.6 0z";
const BELL = "M12 6.2a4.3 4.3 0 0 1 4.3 4.3v2.4l1.3 2.1H6.4l1.3-2.1v-2.4A4.3 4.3 0 0 1 12 6.2z";

let gradientSeq = 0;

type Attrs = Record<string, string | number>;

export function svg<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Attrs = {},
  children: SVGElement[] = [],
): SVGElementTagNameMap[K] {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
  for (const child of children) node.appendChild(child);
  return node;
}

const STROKE: Attrs = {
  fill: "none",
  stroke: "white",
  "stroke-linecap": "round",
  "stroke-linejoin": "round",
};

function drawn(d: string, width: number): SVGPathElement {
  return svg("path", { class: "draw", pathLength: 1, d, "stroke-width": width, ...STROKE });
}

function glyph(type: FlashType): SVGElement {
  switch (type) {
    case "success":
      return drawn("M7.4 12.3l3.1 3.1l6.1-6.4", 2.5);
    case "error":
      return svg("g", { class: "af-glyph-error" }, [
        drawn("M8.7 8.7l6.6 6.6", 2.5),
        drawn("M15.3 8.7l-6.6 6.6", 2.5),
      ]);
    case "info":
      return svg("g", {}, [
        drawn("M12 11.2v5.3", 2.4),
        svg("circle", { class: "af-dot", cx: 12, cy: 7.9, r: 1.45, fill: "white" }),
      ]);
    case "warning":
      return svg("g", {}, [
        drawn("M12 9.3v4.6", 2.4),
        svg("circle", { class: "af-dot", cx: 12, cy: 17.2, r: 1.4, fill: "white" }),
      ]);
    case "notification":
      return svg("g", {}, [
        svg("path", { class: "af-bell", d: BELL, fill: "white" }),
        drawn("M10.4 16.9a1.7 1.7 0 0 0 3.2 0", 1.8),
      ]);
    case "loading":
      return svg("path", {
        class: "af-spinner",
        d: "M12 6.6a5.4 5.4 0 1 0 5.4 5.4",
        "stroke-width": 2.4,
        ...STROKE,
      });
  }
}

/** The duotone status badge (26 px, viewBox 24). Colours come from the stylesheet. */
export function createBadge(type: FlashType): SVGSVGElement {
  gradientSeq += 1;
  const id = `af-g-${gradientSeq}`;
  const fill = `url(#${id})`;
  const shape =
    type === "warning" ? svg("path", { d: TRIANGLE, fill }) : svg("circle", { cx: 12, cy: 12, r: 11, fill });
  const shine =
    type === "warning"
      ? svg("ellipse", { cx: 12, cy: 9, rx: 3.6, ry: 2.6, fill: "white", opacity: 0.2 })
      : svg("ellipse", { cx: 12, cy: 6.4, rx: 7.2, ry: 3.4, fill: "white", opacity: 0.2 });

  return svg(
    "svg",
    {
      class: "af-badge",
      viewBox: "0 0 24 24",
      width: 26,
      height: 26,
      "aria-hidden": "true",
      focusable: "false",
    },
    [
      svg("defs", {}, [
        svg("linearGradient", { id, x1: 0, y1: 0, x2: 0, y2: 1 }, [
          svg("stop", { offset: 0, class: "af-g-top" }),
          svg("stop", { offset: 1, class: "af-g-bottom" }),
        ]),
      ]),
      shape,
      shine,
      glyph(type),
    ],
  );
}

export function createCloseIcon(): SVGSVGElement {
  return svg(
    "svg",
    { viewBox: "0 0 24 24", width: 13, height: 13, "aria-hidden": "true", focusable: "false" },
    [svg("path", { d: "M18 6 6 18M6 6l12 12", "stroke-width": 2.4, ...STROKE, stroke: "currentColor" })],
  );
}

export type CountdownTiming = {
  /** Full duration in ms. */
  total: number;
  /** Ms already elapsed (becomes a negative animation-delay so it starts part-way). */
  elapsed: number;
  paused: boolean;
};

/** CSS-driven countdown: paused with animation-play-state so it stays in step with the JS timer. */
export function applyTiming(node: Element, { total, elapsed, paused }: CountdownTiming): void {
  const style = (node as HTMLElement | SVGElement).style;
  style.animationDuration = `${total}ms`;
  style.animationDelay = `-${Math.min(total, Math.max(0, elapsed))}ms`;
  style.animationPlayState = paused ? "paused" : "running";
}

/** SVG countdown ring: around the close button (26 px) or the badge (34 px). */
export function createRing(variant: "close" | "icon", timing: CountdownTiming): SVGSVGElement {
  const size = variant === "close" ? 26 : 34;
  const r = variant === "close" ? 11.5 : 15;
  const c = size / 2;
  const value = svg("circle", { class: "af-ring-value af-countdown-anim", cx: c, cy: c, r, pathLength: 100 });
  applyTiming(value, timing);
  return svg(
    "svg",
    {
      class: `af-ring af-ring-${variant}`,
      viewBox: `0 0 ${size} ${size}`,
      width: size,
      height: size,
      "aria-hidden": "true",
      focusable: "false",
    },
    [svg("circle", { class: "af-ring-track", cx: c, cy: c, r }), value],
  );
}

/** Countdown drawn on the pill itself: border trace, receding tint, top glow line or underline. */
export function createTrack(
  placement: Extract<FlashCountdown, "outline" | "sweep" | "edge" | "bar">,
  timing: CountdownTiming,
): Element {
  if (placement === "outline") {
    const rect = svg("rect", {
      class: "af-cd-outline-rect af-countdown-anim",
      x: 1,
      y: 1,
      rx: 19,
      ry: 19,
      pathLength: 100,
    });
    applyTiming(rect, timing);
    return svg("svg", { class: "af-cd af-cd-outline", "aria-hidden": "true", focusable: "false" }, [rect]);
  }
  const track = document.createElement("span");
  track.className = `af-cd af-cd-${placement}`;
  track.setAttribute("aria-hidden", "true");
  const fill = document.createElement("span");
  fill.className = "af-cd-fill af-countdown-anim";
  applyTiming(fill, timing);
  track.appendChild(fill);
  return track;
}
