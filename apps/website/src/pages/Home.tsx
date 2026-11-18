import {
  configure,
  COUNTDOWNS,
  ENTRANCES,
  flash,
  POSITIONS,
  previewSound,
  SOUND_PACKS,
  type FlashCountdown,
  type FlashEntrance,
  type FlashPosition,
  type FlashSoundPack,
} from "amo-flash";
import { useFlashConfig } from "amo-flash/react";
import { useEffect, type ReactNode } from "react";

import { CodeBlock, CodeTabs, CopyButton } from "../components/CodeBlock";
import { DEMOS, DemoButton } from "../components/Demo";
import { CyclingWord, HeroDemo } from "../components/HeroDemo";
import { IconArrowRight, IconSpark } from "../components/Icons";
import { API_OVERVIEW, FRAMEWORKS } from "../content/snippets";
import { Link, useTitle } from "../router";

const SWATCHES: Array<{ label: string; value: string | null }> = [
  { label: "Signal (default)", value: null },
  { label: "White", value: "#ffffff" },
  { label: "Indigo", value: "#3b5bdb" },
  { label: "Violet", value: "#6741d9" },
  { label: "Teal", value: "#0c8599" },
  { label: "Sun", value: "#ffd43b" },
  { label: "Rose", value: "#f783ac" },
];

const COUNTDOWN_LABEL: Record<FlashCountdown, string> = {
  close: "Close ring",
  ring: "Icon ring",
  outline: "Outline",
  sweep: "Sweep",
  edge: "Edge glow",
  bar: "Bar",
  none: "None",
};

let welcomed = false;

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" className="chip" aria-pressed={active} onClick={onClick}>
      {children}
    </button>
  );
}

function Feature({ title, body, children }: { title: string; body: string; children?: ReactNode }) {
  return (
    <article className="feature">
      <h3>{title}</h3>
      <p>{body}</p>
      {children ? <div className="feature-try">{children}</div> : null}
    </article>
  );
}

export function Home() {
  useTitle("Amo Flash — flash messages, beautifully alive");
  const config = useFlashConfig();

  // One gentle hello per visit, after the page has settled.
  useEffect(() => {
    if (welcomed) return;
    const handle = window.setTimeout(() => {
      welcomed = true;
      flash.notify("Welcome to Amo Flash", {
        message: "Hover to expand, swipe or press Esc to dismiss",
        dedupeKey: "welcome",
      });
    }, 900);
    return () => window.clearTimeout(handle);
  }, []);

  const setEntrance = (entrance: FlashEntrance) => {
    configure({ entrance });
    flash.info(`Entrance: ${entrance}`, { dedupeKey: "entrance" });
  };
  const setCountdown = (countdown: FlashCountdown) => {
    configure({ countdown });
    flash.success(`Countdown: ${COUNTDOWN_LABEL[countdown].toLowerCase()}`, { dedupeKey: "countdown" });
  };
  const setPack = (pack: FlashSoundPack | null) => {
    if (pack === null) {
      configure({ sound: { enabled: false } });
      flash.info("Sound off", { dedupeKey: "sound" });
      return;
    }
    configure({ sound: { enabled: true, pack } });
    previewSound(pack, "success");
    flash.success(`Sound pack: ${pack}`, { dedupeKey: "sound", sound: false });
  };
  const setBackground = (value: string | null, label: string) => {
    configure({ background: value });
    flash.notify(`Background: ${label}`, { message: "Text colour adapts for contrast", dedupeKey: "bg" });
  };
  const setPosition = (position: FlashPosition) => {
    configure({ position });
    flash.info(`Position: ${position.replace("-", " ")}`, { dedupeKey: "position" });
  };

  return (
    <>
      {/* ---------- hero ---------- */}
      <section className="hero">
        <div className="container hero-center">
          <p className="badge-line">
            <span className="badge-dot" aria-hidden="true" /> v1.0 · MIT · zero dependencies
          </p>
          <h1 className="h1 hero-title">
            Flash messages
            <br />
            that feel <CyclingWord />
          </h1>
          <p className="lead">
            A tiny toast library for every framework. A pill that morphs into place, a countdown you can see,
            smart dedupe, one-pill promises and sound. Free for everyone, forever.
          </p>
          <div className="row center-row">
            <Link to="/docs" className="btn btn-cta">
              Get started <IconArrowRight size={16} />
            </Link>
            <Link to="/playground" className="btn btn-soft">
              Open the Playground
            </Link>
          </div>
          <div className="install">
            <span className="install-prompt" aria-hidden="true">
              $
            </span>
            <code>npm i amo-flash</code>
            <CopyButton text="npm i amo-flash" label="Copy install command" />
          </div>
        </div>

        <div className="container hero-stage">
          <HeroDemo />
        </div>

        <div className="container">
          <div className="demo-panel">
            <div className="demo-head">
              <IconSpark size={16} />
              <span>Your turn — every button fires a real flash, with sound</span>
            </div>
            <div className="demo-grid">
              {DEMOS.map((demo) => (
                <DemoButton key={demo.id} demo={demo} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------- features ---------- */}
      <section className="section" aria-labelledby="features-title">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow">Details, all the way down</p>
            <h2 id="features-title" className="h2">
              Small library. Big feel.
            </h2>
            <p className="lead">
              Every option below changes the real flashes on this site, so try them. Your choices are
              remembered, and the <Link to="/playground">Playground</Link> has all of them in one place.
            </p>
          </div>

          <div className="features">
            <Feature
              title="Entrances that morph"
              body="A capsule that blooms into a pill, a springy drop, a slide or a quiet fade."
            >
              {ENTRANCES.map((e) => (
                <Chip key={e} active={config.entrance === e} onClick={() => setEntrance(e)}>
                  {e}
                </Chip>
              ))}
            </Feature>

            <Feature
              title="A countdown you can see"
              body="Six ways to show time left. It pauses while you hover or focus."
            >
              {COUNTDOWNS.map((c) => (
                <Chip key={c} active={config.countdown === c} onClick={() => setCountdown(c)}>
                  {COUNTDOWN_LABEL[c]}
                </Chip>
              ))}
            </Feature>

            <Feature
              title="Smart dedupe"
              body="Repeats merge into one pill with a ×N counter and a little bump instead of a wall of toasts."
            >
              <button
                type="button"
                className="chip"
                onClick={() => {
                  for (let i = 0; i < 5; i += 1)
                    window.setTimeout(() => flash.warning("Rate limited", { duration: 5000 }), i * 220);
                }}
              >
                Fire 5 times
              </button>
            </Feature>

            <Feature
              title="Async in one pill"
              body="flash.promise() turns loading into success or error in place, with a smooth width morph."
            >
              <button
                type="button"
                className="chip"
                onClick={() => {
                  const ok = Math.random() > 0.35;
                  void flash
                    .promise(
                      new Promise<string>((resolve, reject) =>
                        window.setTimeout(
                          () => (ok ? resolve("report-q3.pdf") : reject(new Error("Server timed out"))),
                          1800,
                        ),
                      ),
                      {
                        loading: "Exporting report",
                        success: (file) => ({ title: "Report exported", message: file }),
                        error: (err) => ({ title: "Export failed", message: (err as Error).message }),
                      },
                    )
                    .catch(() => undefined);
                }}
              >
                Run a promise
              </button>
            </Feature>

            <Feature
              title="Sound, synthesized"
              body="Five packs made with the Web Audio API. No audio files, never blocking, one switch to mute."
            >
              <Chip active={!config.sound.enabled} onClick={() => setPack(null)}>
                off
              </Chip>
              {SOUND_PACKS.map((p) => (
                <Chip
                  key={p}
                  active={config.sound.enabled && config.sound.pack === p}
                  onClick={() => setPack(p)}
                >
                  {p}
                </Chip>
              ))}
            </Feature>

            <Feature
              title="Any colour, always readable"
              body="Pick any background. Text and actions flip automatically to keep contrast."
            >
              <div className="swatches">
                {SWATCHES.map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    className="swatch"
                    aria-label={s.label}
                    aria-pressed={config.background === s.value}
                    style={{ background: s.value ?? "#111113" }}
                    onClick={() => setBackground(s.value, s.label)}
                  />
                ))}
              </div>
            </Feature>

            <Feature
              title="Six positions"
              body="Top or bottom, left, centre or right. Full width with safe gutters on phones."
            >
              <div className="mini-screen" role="group" aria-label="Position">
                {POSITIONS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    className="mini-slot"
                    data-pos={p}
                    aria-label={p.replace("-", " ")}
                    aria-pressed={config.position === p}
                    onClick={() => setPosition(p)}
                  />
                ))}
              </div>
            </Feature>

            <Feature
              title="Accessible by default"
              body="Polite and assertive live regions, keyboard focus pauses timers, Esc dismisses, labelled controls, and reduced motion respected."
            />

            <Feature
              title="Works everywhere"
              body="A framework-free core with React, Vue and Svelte helpers, an Angular recipe and a script-tag build. SSR-safe."
            />
          </div>
        </div>
      </section>

      {/* ---------- frameworks ---------- */}
      <section className="section section-alt" aria-labelledby="fw-title">
        <div className="container split">
          <div className="split-copy">
            <p className="eyebrow">Your stack, one line</p>
            <h2 id="fw-title" className="h2">
              Drop it into any app
            </h2>
            <p className="lead">
              The core is plain TypeScript and DOM, so it runs anywhere. The first flash mounts itself, so a
              setup step is optional and only there to configure it.
            </p>
            <ul className="checks">
              <li>React 18+ and Next.js App Router (client component built in)</li>
              <li>
                Vue 3 plugin with <code>$flash</code> and <code>useFlash()</code>
              </li>
              <li>Svelte stores for config and a headless queue</li>
              <li>Angular, Solid, Astro, or no framework at all</li>
            </ul>
          </div>
          <div className="split-code">
            <CodeTabs snippets={FRAMEWORKS} label="Framework" />
          </div>
        </div>
      </section>

      {/* ---------- api ---------- */}
      <section className="section" aria-labelledby="api-title">
        <div className="container split split-reverse">
          <div className="split-code">
            <CodeBlock code={API_OVERVIEW} lang="ts" file="api.ts" />
          </div>
          <div className="split-copy">
            <p className="eyebrow">A tiny API</p>
            <h2 id="api-title" className="h2">
              Everything is one call
            </h2>
            <p className="lead">
              Five types, a loading state, actions, updates and promises, all on a single object that works
              inside or outside components.
            </p>
            <Link to="/docs#api" className="text-link">
              Read the API reference <IconArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ---------- stats ---------- */}
      <section className="section stats-section" aria-label="At a glance">
        <div className="container stats">
          <div>
            <strong>≈13 kB</strong>
            <span>gzipped, CSS and sounds included</span>
          </div>
          <div>
            <strong>0</strong>
            <span>runtime dependencies</span>
          </div>
          <div>
            <strong>6 × 6</strong>
            <span>positions × countdown styles</span>
          </div>
          <div>
            <strong>MIT</strong>
            <span>free for personal and commercial use</span>
          </div>
        </div>
      </section>

      {/* ---------- cta ---------- */}
      <section className="section cta">
        <div className="container narrow center">
          <h2 className="h2">Give your app a better voice</h2>
          <p className="lead">Install it in a minute, then make it yours in the Playground.</p>
          <div className="row center-row">
            <Link to="/docs" className="btn btn-primary">
              Read the docs <IconArrowRight size={16} />
            </Link>
            <Link to="/playground" className="btn btn-ghost">
              Open the Playground
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
