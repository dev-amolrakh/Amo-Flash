import type { FlashType } from "amo-flash";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";

import { PillBadge, PillClose } from "./Demo";

/* ---------- motion preference ---------- */

function usePrefersReducedMotion(): boolean {
  const query = "(prefers-reduced-motion: reduce)";
  const [reduced, setReduced] = useState(() => window.matchMedia?.(query).matches ?? false);
  useEffect(() => {
    const media = window.matchMedia?.(query);
    if (!media) return;
    const onChange = () => setReduced(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

/* ---------- headline word that morphs ---------- */

const WORDS: Array<{ word: string; color: string }> = [
  { word: "alive", color: "#40c057" },
  { word: "smart", color: "#845ef7" },
  { word: "accessible", color: "#339af0" },
  { word: "yours", color: "#fab005" },
];

/** The inline pill in the hero headline. Cycles words with a width morph; static under reduced motion. */
export function CyclingWord() {
  const reduced = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);
  const [width, setWidth] = useState<number | null>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const current = WORDS[index] ?? WORDS[0]!;

  useEffect(() => {
    if (reduced) return;
    const handle = window.setInterval(() => setIndex((i) => (i + 1) % WORDS.length), 2600);
    return () => window.clearInterval(handle);
  }, [reduced]);

  // Measure the word, and measure again whenever its size changes (the web font loading in,
  // the viewport resizing the headline), so the pill never clips the text.
  useLayoutEffect(() => {
    const el = measureRef.current;
    if (!el) return;
    const measure = () => setWidth(Math.ceil(el.getBoundingClientRect().width));
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [index]);

  return (
    <span className="word-pill" style={{ "--word": current.color } as CSSProperties}>
      <span className="word-dot" aria-hidden="true" />
      <span className="word-slot" style={width ? { width } : undefined}>
        <span key={current.word} className="word-text">
          {current.word}
        </span>
      </span>
      <span ref={measureRef} className="word-measure" aria-hidden="true">
        {current.word}
      </span>
    </span>
  );
}

/* ---------- animated product demo ---------- */

type MockPill = {
  key: number;
  type: FlashType;
  title: string;
  action?: string;
  count: number;
  version: number;
  leaving: boolean;
};

type Point = { x: number; y: number };

const MAX_PILLS = 3;
const EXIT_MS = 420;
const CANCELLED = Symbol("cancelled");

const TASKS = [
  { id: "t1", title: "Write launch announcement", tag: "Copy", done: true },
  { id: "t2", title: "Record product walkthrough", tag: "Video", done: false },
  { id: "t3", title: "Old roadmap draft", tag: "Archive", done: false },
  { id: "t4", title: "Update pricing page", tag: "Web", done: false },
  { id: "t5", title: "QA on mobile devices", tag: "QA", done: false },
];

/**
 * A looping, silent "video" of Amo Flash inside a mock app: publish → loading morphs to success,
 * a live notification, archive with Undo, and a deduped error ×3. Pauses off-screen, when the tab
 * is hidden, or with the pause button; shows a still frame under reduced motion.
 */
export function HeroDemo() {
  const reduced = usePrefersReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);
  const publishRef = useRef<HTMLSpanElement>(null);
  const trashRef = useRef<HTMLSpanElement>(null);
  const undoRefs = useRef(new Map<number, HTMLSpanElement>());
  const pausedRef = useRef({ user: false, offscreen: false, hidden: false });

  const [pills, setPills] = useState<MockPill[]>([]);
  const [cursor, setCursor] = useState<Point & { click: number }>({ x: 0, y: 0, click: 0 });
  const [archived, setArchived] = useState(false);
  const [publish, setPublish] = useState<"idle" | "busy" | "done">("idle");
  const [userPaused, setUserPaused] = useState(false);

  /* pause sources */
  useEffect(() => {
    pausedRef.current.user = userPaused;
  }, [userPaused]);

  useEffect(() => {
    const stage = stageRef.current;
    const onVisibility = () => (pausedRef.current.hidden = document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    let observer: IntersectionObserver | null = null;
    if (stage && typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(([entry]) => {
        pausedRef.current.offscreen = !entry?.isIntersecting;
      });
      observer.observe(stage);
    }
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      observer?.disconnect();
    };
  }, []);

  /* geometry helpers */
  const pointOf = useCallback((el: Element | null | undefined): Point | null => {
    const stage = stageRef.current;
    if (!stage || !el) return null;
    const s = stage.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    return { x: r.left - s.left + r.width / 2, y: r.top - s.top + r.height / 2 };
  }, []);

  const restPoint = useCallback((): Point => {
    const stage = stageRef.current;
    return stage ? { x: stage.clientWidth * 0.82, y: stage.clientHeight * 0.86 } : { x: 0, y: 0 };
  }, []);

  /* the timeline */
  useEffect(() => {
    let cancelled = false;
    let seq = 0;

    const wait = async (ms: number) => {
      let left = ms;
      while (left > 0) {
        await new Promise((r) => window.setTimeout(r, 50));
        if (cancelled) throw CANCELLED;
        const p = pausedRef.current;
        if (!p.user && !p.offscreen && !p.hidden) left -= 50;
      }
    };

    const add = (pill: Omit<MockPill, "key" | "count" | "version" | "leaving">): number => {
      seq += 1;
      const key = seq;
      setPills((list) => {
        const next = [{ ...pill, key, count: 1, version: 0, leaving: false }, ...list];
        let live = 0;
        return next.map((p) => (!p.leaving && ++live > MAX_PILLS ? { ...p, leaving: true } : p));
      });
      return key;
    };
    const update = (key: number, patch: Partial<MockPill>) =>
      setPills((list) => list.map((p) => (p.key === key ? { ...p, ...patch, version: p.version + 1 } : p)));
    const bump = (key: number) =>
      setPills((list) => list.map((p) => (p.key === key ? { ...p, count: p.count + 1 } : p)));
    const dismissAll = () => setPills((list) => list.map((p) => ({ ...p, leaving: true })));
    const moveTo = (point: Point | null) => {
      if (point) setCursor((c) => ({ ...c, ...point }));
    };
    const click = () => setCursor((c) => ({ ...c, click: c.click + 1 }));

    const reset = () => {
      setPills([]);
      setArchived(false);
      setPublish("idle");
      moveTo(restPoint());
    };

    if (reduced) {
      // A still frame that still tells the story.
      reset();
      seq = 10;
      setPublish("done");
      setPills([
        {
          key: 2,
          type: "notification",
          title: "Ana commented on Launch plan",
          action: "View",
          count: 1,
          version: 0,
          leaving: false,
        },
        { key: 1, type: "success", title: "Launch plan published", count: 1, version: 0, leaving: false },
      ]);
      return () => {
        cancelled = true;
      };
    }

    const cycle = async () => {
      reset();
      await wait(900);
      moveTo(pointOf(publishRef.current));
      await wait(1000);
      click();
      setPublish("busy");
      const publishing = add({ type: "loading", title: "Publishing launch plan" });
      await wait(1700);
      update(publishing, { type: "success", title: "Launch plan published" });
      setPublish("done");
      await wait(1500);
      add({ type: "notification", title: "Ana commented on Launch plan", action: "View" });
      await wait(1700);
      moveTo(pointOf(trashRef.current));
      await wait(1000);
      click();
      setArchived(true);
      const archive = add({ type: "success", title: "Task archived", action: "Undo" });
      await wait(1100);
      moveTo(pointOf(undoRefs.current.get(archive)));
      await wait(1000);
      click();
      setArchived(false);
      update(archive, { type: "info", title: "Task restored", action: undefined });
      await wait(1500);
      moveTo(restPoint());
      const sync = add({ type: "error", title: "Couldn't sync changes" });
      await wait(500);
      bump(sync);
      await wait(500);
      bump(sync);
      await wait(2000);
      dismissAll();
      await wait(1300);
    };

    (async () => {
      try {
        // Loops until unmount, which exits through the CANCELLED throw.
        while (!cancelled) await cycle();
      } catch (error) {
        if (error !== CANCELLED) throw error;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [reduced, pointOf, restPoint]);

  /* drop pills after their exit animation */
  useEffect(() => {
    if (!pills.some((p) => p.leaving)) return;
    const handle = window.setTimeout(() => setPills((list) => list.filter((p) => !p.leaving)), EXIT_MS);
    return () => window.clearTimeout(handle);
  }, [pills]);

  const live = pills.filter((p) => !p.leaving);

  return (
    <div className="mock-wrap">
      <div
        className="mock"
        ref={stageRef}
        role="img"
        aria-label="Animated demo: in a project app, publishing shows a loading flash that turns into “Launch plan published”, a comment notification arrives, archiving a task offers Undo, and a repeated sync error collapses into one flash with a ×3 counter."
      >
        <div className="mock-chrome" aria-hidden="true">
          <span className="mock-dots">
            <i />
            <i />
            <i />
          </span>
          <span className="mock-url">acme.app/launch-plan</span>
        </div>

        <div className="mock-body" aria-hidden="true">
          <aside className="mock-side">
            <div className="mock-ws">
              <span className="mock-ws-logo">A</span> Acme
            </div>
            <ul>
              <li>Home</li>
              <li>
                Inbox <b>2</b>
              </li>
              <li>Projects</li>
              <li className="active">Launch plan</li>
              <li>Settings</li>
            </ul>
            <p className="mock-side-label">Team</p>
            <ul>
              <li>
                <span className="mock-sq" style={{ background: "#ff8787" }} /> Design
              </li>
              <li>
                <span className="mock-sq" style={{ background: "#74c0fc" }} /> Engineering
              </li>
              <li>
                <span className="mock-sq" style={{ background: "#b197fc" }} /> Marketing
              </li>
            </ul>
          </aside>

          <div className="mock-main">
            <div className="mock-head">
              <div className="mock-title">
                <span className="mock-emoji">🚀</span> Launch plan
              </div>
              <div className="mock-head-actions">
                <span className="mock-btn ghost">Share</span>
                <span ref={publishRef} className={`mock-btn primary${publish === "busy" ? " busy" : ""}`}>
                  {publish === "done" ? "Published" : publish === "busy" ? "Publishing…" : "Publish"}
                </span>
              </div>
            </div>
            <div className="mock-tabs">
              <span className="on">Tasks</span>
              <span>Timeline</span>
              <span>Notes</span>
            </div>
            <ul className="mock-tasks">
              {TASKS.map((task) => (
                <li
                  key={task.id}
                  className={`mock-task${task.id === "t3" && archived ? " gone" : ""}${task.done ? " done" : ""}`}
                >
                  <span className="mock-check" />
                  <span className="mock-task-title">{task.title}</span>
                  <span className="mock-tag">{task.tag}</span>
                  {task.id === "t3" ? (
                    <span ref={trashRef} className="mock-trash">
                      <svg viewBox="0 0 24 24" width="14" height="14">
                        <path
                          d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  ) : (
                    <span className="mock-avatar" />
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* the flash stack, top-centre like the real viewport */}
        <div className="mock-stack" aria-hidden="true">
          {pills.map((pill) => {
            const index = pill.leaving ? 0 : live.indexOf(pill);
            const depth = Math.min(index, 2);
            const style = {
              "--d": depth,
              zIndex: 10 - index,
            } as CSSProperties;
            return (
              <div
                key={pill.key}
                className={`mock-slot${pill.leaving ? " leaving" : ""}${index > 0 ? " behind" : ""}`}
                style={style}
              >
                <div
                  key={pill.count}
                  className={`mock-pill${pill.count > 1 ? " bumped" : ""}`}
                  data-type={pill.type}
                >
                  <span key={pill.version} className="mock-icon">
                    <PillBadge type={pill.type} />
                  </span>
                  <span className="pp-title">{pill.title}</span>
                  {pill.count > 1 ? <span className="pp-meta">×{pill.count}</span> : null}
                  {pill.action ? (
                    <span
                      className="mock-action"
                      ref={(el) => {
                        if (el) undoRefs.current.set(pill.key, el);
                        else undoRefs.current.delete(pill.key);
                      }}
                    >
                      {pill.action}
                    </span>
                  ) : null}
                  <span key={`ring-${pill.version}`} className="mock-close">
                    <PillClose ring={pill.type !== "loading" && pill.type !== "error"} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {!reduced ? (
          <svg
            className="mock-cursor"
            style={{ transform: `translate(${cursor.x}px, ${cursor.y}px)` }}
            viewBox="0 0 24 24"
            width="22"
            height="22"
            aria-hidden="true"
          >
            <path
              key={cursor.click}
              className={cursor.click ? "clicking" : undefined}
              d="M5 3l14 8-6 1.6L10 19z"
              fill="#111113"
              stroke="#fff"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
          </svg>
        ) : null}
      </div>

      {!reduced ? (
        <button
          type="button"
          className="mock-toggle"
          aria-pressed={userPaused}
          onClick={() => setUserPaused((v) => !v)}
        >
          {userPaused ? (
            <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
              <path d="M8 5l11 7-11 7z" fill="currentColor" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
              <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor" />
            </svg>
          )}
          {userPaused ? "Play demo" : "Pause demo"}
        </button>
      ) : null}
    </div>
  );
}
