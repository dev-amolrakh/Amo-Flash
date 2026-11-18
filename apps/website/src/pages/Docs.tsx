import { configure, DEFAULT_CONFIG, flash } from "amo-flash";
import { useEffect, useState, type ReactNode } from "react";

import { CodeBlock, CodeTabs } from "../components/CodeBlock";
import { FRAMEWORKS, INSTALL, REPO_URL, type Snippet } from "../content/snippets";
import { Link, useTitle } from "../router";

const TOC: Array<{ id: string; label: string; children?: Array<{ id: string; label: string }> }> = [
  { id: "introduction", label: "Introduction" },
  { id: "installation", label: "Installation" },
  { id: "quick-start", label: "Quick start" },
  {
    id: "frameworks",
    label: "Frameworks",
    children: [
      { id: "react", label: "React" },
      { id: "nextjs", label: "Next.js" },
      { id: "vue", label: "Vue" },
      { id: "svelte", label: "Svelte" },
      { id: "angular", label: "Angular" },
      { id: "vanilla", label: "Vanilla & CDN" },
    ],
  },
  { id: "api", label: "API" },
  { id: "options", label: "Flash options" },
  { id: "promise", label: "Promises & updates" },
  { id: "configuration", label: "Configuration" },
  { id: "persist", label: "Saving preferences" },
  { id: "theming", label: "Theming" },
  { id: "accessibility", label: "Accessibility" },
  { id: "sounds", label: "Sounds" },
  { id: "headless", label: "Headless & custom UI" },
  { id: "ssr", label: "SSR & browser support" },
  { id: "faq", label: "FAQ" },
];

const ALL_IDS = TOC.flatMap((t) => [t.id, ...(t.children?.map((c) => c.id) ?? [])]);

const fw = (id: string): Snippet => FRAMEWORKS.find((f) => f.id === id) as Snippet;

function useActiveSection(): string {
  const [active, setActive] = useState(ALL_IDS[0] ?? "");
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-80px 0px -70% 0px" },
    );
    for (const id of ALL_IDS) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);
  return active;
}

function H2({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h2 id={id} className="doc-h2">
      <a
        href={`#${id}`}
        className="anchor"
        aria-label={`Link to ${typeof children === "string" ? children : id}`}
      >
        #
      </a>
      {children}
    </h2>
  );
}

function H3({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h3 id={id} className="doc-h3">
      <a href={`#${id}`} className="anchor" aria-hidden="true" tabIndex={-1}>
        #
      </a>
      {children}
    </h3>
  );
}

function Try({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className="chip try" onClick={onClick}>
      ▶ {label}
    </button>
  );
}

function Table({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="table-wrap" tabIndex={0} role="region" aria-label={`${head[0]} table`}>
      <table className="table">
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h} scope="col">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const c = (text: string) => <code>{text}</code>;
const d = (value: unknown) => <code>{typeof value === "string" ? `"${value}"` : JSON.stringify(value)}</code>;

export function Docs() {
  useTitle("Documentation — Amo Flash");
  const active = useActiveSection();
  const D = DEFAULT_CONFIG;

  const toc = (
    <ul className="toc">
      {TOC.map((item) => (
        <li key={item.id}>
          <a href={`#${item.id}`} aria-current={active === item.id ? "location" : undefined}>
            {item.label}
          </a>
          {item.children ? (
            <ul>
              {item.children.map((child) => (
                <li key={child.id}>
                  <a href={`#${child.id}`} aria-current={active === child.id ? "location" : undefined}>
                    {child.label}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </li>
      ))}
    </ul>
  );

  return (
    <div className="container docs">
      <aside className="docs-nav" aria-label="Documentation">
        <div className="docs-nav-inner">{toc}</div>
      </aside>

      <details className="docs-mobile-nav">
        <summary>On this page</summary>
        {toc}
      </details>

      <article className="doc">
        <p className="eyebrow">Documentation</p>
        <h1 className="h2" id="introduction">
          Amo Flash
        </h1>
        <p className="lead">
          A flash message (toast) library with one job: tell people what just happened, beautifully, then get
          out of the way. It is a plain TypeScript core with no dependencies, plus small helpers for React,
          Vue and Svelte.
        </p>
        <ul className="checks">
          <li>One call: {c('flash.success("Saved")')}. The first flash mounts the viewport for you.</li>
          <li>Morphing pill with a live countdown, ×N dedupe, promise states and undo actions.</li>
          <li>Accessible live regions, keyboard and swipe support, reduced-motion aware.</li>
          <li>Themeable with CSS variables, any background colour, light and dark pages.</li>
          <li>≈13 kB gzipped for the script-tag build, CSS and sounds included. MIT licensed.</li>
        </ul>

        <H2 id="installation">Installation</H2>
        <CodeTabs snippets={INSTALL} label="Package manager" />
        <p>
          Or use the script-tag build from a CDN, with no build step. See{" "}
          <a href="#vanilla">Vanilla &amp; CDN</a>.
        </p>

        <H2 id="quick-start">Quick start</H2>
        <p>Import {c("flash")} and call it. That is the whole setup.</p>
        <CodeBlock
          lang="ts"
          code={`import { flash } from "amo-flash";

flash.success("Saved");`}
        />
        <div className="try-row">
          <Try label="Run it" onClick={() => flash.success("Saved")} />
        </div>
        <p>
          The stylesheet is injected automatically the first time a flash is shown. If your Content Security
          Policy blocks inline styles, set {c("injectStyles: false")} and import {c("amo-flash/style.css")}{" "}
          yourself.
        </p>

        <H2 id="frameworks">Frameworks</H2>
        <p>
          Every entry point shares the same queue, so {c("flash")} imported from {c("amo-flash")} and from{" "}
          {c("amo-flash/react")} (or {c("/vue")}, {c("/svelte")}) is the same object. Each adapter also
          re-exports the whole core.
        </p>

        <H3 id="react">React</H3>
        <p>
          Render {c("<AmoFlash />")} once near the root. Its props are the{" "}
          <a href="#configuration">configuration</a>. Call {c("flash")} from anywhere, including outside
          components.
        </p>
        <CodeBlock {...fw("react")} />
        <p>
          Hooks: {c("useFlash()")} returns the API, {c("useFlashConfig()")} the live config, and{" "}
          {c("useFlashes()")} the live queue for custom renderers.
        </p>

        <H3 id="nextjs">Next.js</H3>
        <p>
          {c("amo-flash/react")} ships with {c('"use client"')}, so you can render it straight from a server
          layout. Calls to {c("flash")} on the server do nothing.
        </p>
        <CodeBlock {...fw("next")} />

        <H3 id="vue">Vue</H3>
        <p>
          The plugin mounts the viewport, adds {c("this.$flash")} and provides the API under{" "}
          {c("AMO_FLASH_KEY")}. It unmounts with the app.
        </p>
        <CodeBlock {...fw("vue")} />
        <p>For typed {c("this.$flash")} in templates, add a declaration once:</p>
        <CodeBlock
          lang="ts"
          file="flash.d.ts"
          code={`import type { FlashApi } from "amo-flash";

declare module "vue" {
  interface ComponentCustomProperties {
    $flash: FlashApi;
  }
}`}
        />

        <H3 id="svelte">Svelte</H3>
        <p>
          {c("initFlash()")} configures and mounts, and returns its own cleanup, so pass it straight to{" "}
          {c("onMount")}. {c("flashConfig")} is a writable store and {c("flashes")} a readable one; both work
          with the {c("$")} prefix in Svelte 3, 4 and 5.
        </p>
        <CodeBlock {...fw("svelte")} />

        <H3 id="angular">Angular</H3>
        <p>No adapter is needed: wrap the core in a service so components can inject it.</p>
        <CodeBlock {...fw("angular")} />

        <H3 id="vanilla">Vanilla &amp; CDN</H3>
        <CodeBlock {...fw("vanilla")} />
        <p>Without a bundler, load the IIFE build. Everything is on {c("window.AmoFlash")}.</p>
        <CodeBlock {...fw("cdn")} />

        <H2 id="api">API</H2>
        <Table
          head={["Method", "Returns", "What it does"]}
          rows={[
            [c("flash.success(title, options?)"), c("string"), "Green check. Use for completed actions."],
            [
              c("flash.error(title, options?)"),
              c("string"),
              "Red cross, assertive live region. Stays until dismissed by default.",
            ],
            [
              c("flash.warning(title, options?)"),
              c("string"),
              "Amber triangle, for something that needs attention.",
            ],
            [c("flash.info(title, options?)"), c("string"), "Blue info badge, for neutral news."],
            [
              c("flash.notify(title, options?)"),
              c("string"),
              "Violet bell, for real-time events. Pair it with a View action.",
            ],
            [
              c("flash.loading(title, options?)"),
              c("string"),
              "Spinner that stays until you update or dismiss it.",
            ],
            [c("flash.show(type, title, options?)"), c("string"), "Any type, chosen at runtime."],
            [
              c("flash.update(id, patch)"),
              c("void"),
              "Change type, title, message, action or duration in place.",
            ],
            [
              c("flash.promise(promise | fn, messages)"),
              c("Promise<T>"),
              "Loading, then success or error, in one pill. Returns the original promise.",
            ],
            [c("flash.dismiss(id?)"), c("void"), "Dismiss one flash, or all of them without an id."],
            [c("flash.dismissAll()"), c("void"), "Dismiss everything."],
          ]}
        />
        <p>
          Other exports: {c("configure")}, {c("getConfig")}, {c("resetConfig")}, {c("subscribeConfig")},{" "}
          {c("mountFlash")}, {c("unmountFlash")}, {c("subscribe")}, {c("getFlashes")}, {c("previewSound")} and{" "}
          {c("createFlashStore")}.
        </p>
        <div className="try-row">
          <Try label="success" onClick={() => flash.success("Profile updated")} />
          <Try
            label="error"
            onClick={() => flash.error("Couldn't connect", { message: "Retrying in 5 seconds" })}
          />
          <Try label="warning" onClick={() => flash.warning("Unsaved changes")} />
          <Try label="info" onClick={() => flash.info("Shortcuts: press ? for help")} />
          <Try
            label="notify"
            onClick={() =>
              flash.notify("New order #1042", {
                action: { label: "View", onClick: () => flash.info("Order #1042") },
              })
            }
          />
        </div>

        <H2 id="options">Flash options</H2>
        <p>The second argument of every method. All fields are optional.</p>
        <Table
          head={["Option", "Type", "Default", "Description"]}
          rows={[
            [c("message"), c("string"), "—", "Second line, shown when the pill expands on hover or focus."],
            [
              c("action"),
              c("{ label, onClick }"),
              "—",
              "One inline text button, such as Undo or View. Clicking it also dismisses the flash.",
            ],
            [
              c("duration"),
              c('number | "persist"'),
              "config",
              "Auto-dismiss time in ms for this flash, or keep it until dismissed.",
            ],
            [
              c("id"),
              c("string"),
              "auto",
              "Stable id. Showing a flash with an id already on screen updates it in place.",
            ],
            [
              c("dedupeKey"),
              c("string"),
              c("type|title|message"),
              "Flashes with the same key merge into one with a ×N counter.",
            ],
            [
              c("sound"),
              c("boolean"),
              "—",
              "false never plays; true plays even if the type is not in sound.playFor (the global switch still wins).",
            ],
            [
              c("source"),
              c("string"),
              "—",
              "Free-form tag, such as a module name. Useful for headless renderers and logs.",
            ],
          ]}
        />
        <p>
          Titles and messages are plain text and are never parsed as HTML. Keep titles short (about 40
          characters) and put the detail in {c("message")}.
        </p>

        <H2 id="promise">Promises &amp; updates</H2>
        <CodeBlock
          lang="ts"
          code={`await flash.promise(() => api.export(), {
  loading: "Exporting report",
  success: (file) => ({ title: "Report exported", message: file.name }),
  error: (err) => ({ title: "Export failed", message: String(err) }),
});

// or drive it yourself
const id = flash.loading("Uploading", { message: "0%" });
upload.on("progress", (p) => flash.update(id, { message: \`\${p}%\` }));
upload.on("done", () => flash.update(id, { type: "success", title: "Uploaded" }));`}
        />
        <p>
          An update replays the icon animation and smoothly morphs the pill's width. Flashes that are repeated
          within 1.5 seconds of being dismissed are ignored. That covers double clicks and React StrictMode
          double effects.
        </p>
        <div className="try-row">
          <Try
            label="promise"
            onClick={() =>
              void flash
                .promise(new Promise((r) => window.setTimeout(r, 1600)), {
                  loading: "Syncing",
                  success: "Synced",
                  error: "Sync failed",
                })
                .catch(() => undefined)
            }
          />
          <Try
            label="manual update"
            onClick={() => {
              const id = flash.loading("Uploading", { message: "0%" });
              [25, 50, 75].forEach((p, i) =>
                window.setTimeout(() => flash.update(id, { message: `${p}%` }), (i + 1) * 500),
              );
              window.setTimeout(
                () => flash.update(id, { type: "success", title: "Uploaded", message: "photo.jpg" }),
                2000,
              );
            }}
          />
        </div>

        <H2 id="configuration">Configuration</H2>
        <p>
          Call {c("configure(partial)")} at any time (or pass props to {c("<AmoFlash />")}). Values are
          validated, so a bad value keeps the previous one.
        </p>
        <Table
          head={["Option", "Type", "Default", "Description"]}
          rows={[
            [c("position"), c("top|bottom-left|center|right"), d(D.position), "Screen corner or edge."],
            [
              c("stacking"),
              c('"deck" | "list"'),
              d(D.stacking),
              "Deck collapses into cards that fan out on hover. List is always expanded.",
            ],
            [c("maxVisible"), c("1–10"), d(D.maxVisible), "The oldest flash is dismissed beyond this."],
            [
              c("duration"),
              c("1000–60000"),
              d(D.duration),
              "Auto-dismiss in ms. Flashes with an action get 1.5×.",
            ],
            [c("errorsPersist"), c("boolean"), d(D.errorsPersist), "Errors stay until dismissed."],
            [
              c("pauseOnHover"),
              c("boolean"),
              d(D.pauseOnHover),
              "Hover or keyboard focus pauses every timer.",
            ],
            [c("closeButton"), c("boolean"), d(D.closeButton), "Show the × button."],
            [c("swipeToDismiss"), c("boolean"), d(D.swipeToDismiss), "Drag sideways to dismiss."],
            [c("expandOnHover"), c("boolean"), d(D.expandOnHover), "Reveal message on hover or focus."],
            [
              c("countdown"),
              c("close|ring|outline|sweep|edge|bar|none"),
              d(D.countdown),
              "Where the time left is drawn.",
            ],
            [c("entrance"), c("morph|drop|slide|fade"), d(D.entrance), "Enter and exit animation."],
            [
              c("background"),
              c("#rrggbb | null"),
              d(D.background),
              "Pill colour. Text flips to dark on light colours.",
            ],
            [c("theme"), c("auto|light|dark"), d(D.theme), "Tunes the edge and shadow for the page behind."],
            [c("offset"), c("0–200"), d(D.offset), "Distance from the screen edge, in px."],
            [c("zIndex"), c("number"), d(D.zIndex), "Stacking order of the viewport."],
            [
              c("sound"),
              c("{ enabled, pack, volume, playFor }"),
              c("on, chime, 0.6"),
              <>
                <a href="#sounds">Sounds</a>.
              </>,
            ],
            [c("labels"), c("{ region, dismiss, times }"), c("English"), "Accessible text, for translation."],
            [
              c("persist"),
              c("string | false"),
              d(D.persist),
              <>
                localStorage key. See <a href="#persist">Saving preferences</a>.
              </>,
            ],
            [
              c("injectStyles"),
              c("boolean"),
              d(D.injectStyles),
              "Set false to load amo-flash/style.css yourself.",
            ],
          ]}
        />

        <H2 id="persist">Saving preferences</H2>
        <p>
          Let people choose how flashes behave, such as position or sound, and keep their choice. Set a{" "}
          {c("persist")} key once. Preferences already saved under that key win over the values in the same
          call. Every later {c("configure()")} is saved.
        </p>
        <CodeBlock
          lang="ts"
          code={`configure({ persist: "my-app-flash", position: "top-right" }); // app default

// later, from a settings screen
configure({ position: "bottom-left", sound: { enabled: true } }); // remembered`}
        />
        <p>
          This site does the same thing: change something in the <Link to="/playground">Playground</Link> and
          every page keeps it.
        </p>

        <H2 id="theming">Theming</H2>
        <p>
          The pill is dark by default, so it reads well on any page. In {c('theme: "auto"')} it follows your
          page (a {c(".dark")}/{c(".light")} class or a {c("data-theme")}, {c("data-color-scheme")},{" "}
          {c("data-bs-theme")} or {c("data-mantine-color-scheme")} attribute on {c("<html>")} or {c("<body>")}
          ). Without those, it follows the OS setting. On dark pages it adds a hairline edge and a deeper
          shadow.
        </p>
        <p>For brand colours, override the CSS variables:</p>
        <CodeBlock
          lang="css"
          file="styles.css"
          code={`.af-viewport {
  --af-surface: #0b1020;      /* pill background */
  --af-text: #ffffff;         /* title */
  --af-text-dim: #a1a1aa;     /* message */
  --af-action: #7dd3fc;       /* action button */
  --af-font: "Inter", sans-serif;
}
.af-pill[data-type="success"] {
  --af-accent: #22c55e;       /* countdown + ripple */
  --af-g1: #4ade80;           /* badge gradient top */
  --af-g2: #15803d;           /* badge gradient bottom */
}`}
        />
        <div className="try-row">
          <Try
            label="white pill"
            onClick={() => {
              configure({ background: "#ffffff" });
              flash.success("White pill", { message: "Dark text, automatically" });
            }}
          />
          <Try
            label="back to default"
            onClick={() => {
              configure({ background: null });
              flash.info("Default Signal pill");
            }}
          />
        </div>

        <H2 id="accessibility">Accessibility</H2>
        <ul className="checks">
          <li>
            Errors use {c('role="alert"')} with an assertive live region; everything else is a polite{" "}
            {c('role="status"')}.
          </li>
          <li>
            Keyboard focus inside the stack pauses timers and expands the pill; {c("Esc")} dismisses the
            focused flash.
          </li>
          <li>The close button and ×N counter have labels you can translate with {c("labels")}.</li>
          <li>{c("prefers-reduced-motion")} swaps every animation for a short fade.</li>
          <li>
            Default colours meet WCAG AA contrast, and custom backgrounds pick dark or light text
            automatically.
          </li>
          <li>Colour is never the only signal: every type has its own icon shape.</li>
        </ul>

        <H2 id="sounds">Sounds</H2>
        <p>
          Five packs ({c("chime")}, {c("marimba")}, {c("pop")}, {c("bubble")}, {c("digital")}) are synthesized
          live with the Web Audio API, so no audio files are downloaded. Sound is{" "}
          <strong>on by default</strong> for success, error, warning and notification flashes. Browsers only
          allow audio after the visitor's first click, tap or key press; Amo Flash unlocks audio on that first
          gesture (including iOS Safari), so every flash after it can play. Sounds never throw, loading
          flashes never play, and {c("sound: { enabled: false }")} mutes everything, which makes a good
          user-facing mute switch.
        </p>
        <CodeBlock
          lang="ts"
          code={`configure({
  sound: {
    enabled: true,
    pack: "marimba",
    volume: 0.5,
    playFor: ["success", "error", "warning", "notification"],
  },
});

previewSound("pop", "success"); // e.g. in a settings screen`}
        />

        <H2 id="headless">Headless &amp; custom UI</H2>
        <p>
          Want the queue (timers, dedupe, pause, promises) with your own markup? Subscribe to it and don't
          mount the viewport. Only call {c("flash")} after your renderer is in place, because the first call
          auto-mounts the default viewport otherwise. Or use the store directly:
        </p>
        <CodeBlock
          lang="ts"
          code={`import { createFlashStore } from "amo-flash";

const store = createFlashStore({
  getConfig: () => ({ duration: 4000, errorsPersist: true, maxVisible: 3 }),
});

store.subscribe(({ items }) => render(items)); // FlashRecord[]
store.add("success", "Saved");`}
        />

        <H2 id="ssr">SSR &amp; browser support</H2>
        <p>
          Importing Amo Flash on the server is safe: nothing touches {c("window")} until the first flash in
          the browser, and server-side calls do nothing. It supports current Chrome, Edge, Firefox and Safari
          (desktop and mobile), using {c("clip-path")}, CSS custom properties and the Pointer Events API.
        </p>

        <H2 id="faq">FAQ</H2>
        <details className="faq">
          <summary>Do I need to render a component?</summary>
          <p>
            No. The first flash mounts the viewport on {c("document.body")}. {c("<AmoFlash />")} (or the Vue
            and Svelte helpers) only exists to pass configuration the idiomatic way.
          </p>
        </details>
        <details className="faq">
          <summary>Can I show HTML or React elements inside a flash?</summary>
          <p>
            No, and that is on purpose. Titles and messages are text, which keeps flashes short, accessible
            and safe from injection. For rich content, use a dialog.
          </p>
        </details>
        <details className="faq">
          <summary>Is it free for commercial projects?</summary>
          <p>
            Yes. Amo Flash is MIT licensed: use it, change it and ship it, in personal or commercial work.
          </p>
        </details>
        <details className="faq">
          <summary>Where do I report a bug or ask for a feature?</summary>
          <p>
            Open an issue on{" "}
            <a href={`${REPO_URL}/issues`} target="_blank" rel="noreferrer">
              GitHub
            </a>
            . Pull requests are welcome too.
          </p>
        </details>
      </article>
    </div>
  );
}
