import {
  configure,
  COUNTDOWNS,
  DEFAULT_CONFIG,
  ENTRANCES,
  flash,
  isLightColor,
  normalizeColor,
  POSITIONS,
  previewSound,
  resetConfig,
  SOUND_PACKS,
  SOUND_TYPES,
  THEMES,
  type AmoFlashConfig,
  type AmoFlashConfigInput,
  type FlashSoundType,
} from "amo-flash";
import { useFlashConfig } from "amo-flash/react";
import { useId, useMemo, useState, type ReactNode } from "react";

import { CodeTabs } from "../components/CodeBlock";
import { DEMOS, DemoButton } from "../components/Demo";
import type { Snippet } from "../content/snippets";
import { useTitle } from "../router";

/* ---------- small accessible controls ---------- */

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="field">
      <div className="field-label">
        <span>{label}</span>
        {hint ? <span className="field-hint">{hint}</span> : null}
      </div>
      {children}
    </div>
  );
}

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
  format = (v) => v,
}: {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
  format?: (value: T) => string;
}) {
  return (
    <div className="segmented" role="radiogroup" aria-label={label}>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          role="radio"
          aria-checked={value === option}
          className="seg"
          onClick={() => onChange(option)}
        >
          {format(option)}
        </button>
      ))}
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  const id = useId();
  return (
    <label className="toggle" htmlFor={id}>
      <span>{label}</span>
      <input
        id={id}
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="toggle-track" aria-hidden="true">
        <span className="toggle-thumb" />
      </span>
    </label>
  );
}

function Range({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
}) {
  const id = useId();
  return (
    <div className="field">
      <div className="field-label">
        <label htmlFor={id}>{label}</label>
        <output htmlFor={id} className="field-hint">
          {format(value)}
        </output>
      </div>
      <input
        id={id}
        className="range"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

/* ---------- generated code ---------- */

/** Only the options that differ from the defaults. */
function changedOptions(config: AmoFlashConfig): AmoFlashConfigInput {
  const out: Record<string, unknown> = {};
  const keys = Object.keys(DEFAULT_CONFIG) as Array<keyof AmoFlashConfig>;
  for (const key of keys) {
    if (key === "persist" || key === "labels" || key === "injectStyles") continue;
    if (key === "sound") {
      const sound: Record<string, unknown> = {};
      for (const k of Object.keys(DEFAULT_CONFIG.sound) as Array<keyof AmoFlashConfig["sound"]>) {
        if (JSON.stringify(config.sound[k]) !== JSON.stringify(DEFAULT_CONFIG.sound[k]))
          sound[k] = config.sound[k];
      }
      if (Object.keys(sound).length) out.sound = sound;
      continue;
    }
    if (JSON.stringify(config[key]) !== JSON.stringify(DEFAULT_CONFIG[key])) out[key] = config[key];
  }
  return out as AmoFlashConfigInput;
}

function literal(value: unknown, indent: string): string {
  if (Array.isArray(value)) return `[${value.map((v) => literal(v, indent)).join(", ")}]`;
  if (value && typeof value === "object") {
    const inner = Object.entries(value)
      .map(([k, v]) => `${indent}  ${k}: ${literal(v, `${indent}  `)},`)
      .join("\n");
    return `{\n${inner}\n${indent}}`;
  }
  return typeof value === "string" ? `"${value}"` : String(value);
}

function jsxProps(options: AmoFlashConfigInput): string {
  const entries = Object.entries(options);
  if (!entries.length) return "<AmoFlash />";
  const props = entries.map(([k, v]) =>
    typeof v === "string" ? `  ${k}="${v}"` : `  ${k}={${literal(v, "  ")}}`,
  );
  return `<AmoFlash\n${props.join("\n")}\n/>`;
}

function snippetsFor(options: AmoFlashConfigInput): Snippet[] {
  const body = Object.keys(options).length ? literal(options, "") : "{}";
  return [
    {
      id: "configure",
      label: "configure()",
      lang: "ts",
      file: "flash.ts",
      code: `import { configure } from "amo-flash";\n\nconfigure(${body});`,
    },
    {
      id: "react",
      label: "React",
      lang: "tsx",
      file: "App.tsx",
      code: `import { AmoFlash } from "amo-flash/react";\n\n${jsxProps(options)}`,
    },
    {
      id: "vue",
      label: "Vue",
      lang: "ts",
      file: "main.ts",
      code: `import { createAmoFlash } from "amo-flash/vue";\n\napp.use(createAmoFlash(${body}));`,
    },
  ];
}

/* ---------- page ---------- */

const PRESET_COLORS = [
  "#111113",
  "#ffffff",
  "#3b5bdb",
  "#6741d9",
  "#0c8599",
  "#2b8a3e",
  "#ffd43b",
  "#f783ac",
];

export function Playground() {
  useTitle("Playground — Amo Flash");
  const config = useFlashConfig();
  const [colorDraft, setColorDraft] = useState(config.background ?? "");
  const options = useMemo(() => changedOptions(config), [config]);
  const snippets = useMemo(() => snippetsFor(options), [options]);

  const set = (patch: AmoFlashConfigInput) => configure(patch);
  const setSound = (patch: Partial<AmoFlashConfig["sound"]>) => configure({ sound: patch });

  const applyColor = (value: string | null) => {
    setColorDraft(value ?? "");
    set({ background: value });
  };

  const togglePlayFor = (type: FlashSoundType) => {
    const next = config.sound.playFor.includes(type)
      ? config.sound.playFor.filter((t) => t !== type)
      : [...config.sound.playFor, type];
    setSound({ playFor: next });
  };

  const draftValid = colorDraft === "" || normalizeColor(colorDraft) !== null;

  return (
    <div className="container playground">
      <div className="section-head left">
        <p className="eyebrow">Playground</p>
        <h1 className="h2">Make it yours</h1>
        <p className="lead">
          Every control updates the live flashes and the code on the right. Settings are saved in this browser
          for the whole site.
        </p>
      </div>

      <div className="pg-grid">
        <div className="pg-controls">
          <section className="card" aria-labelledby="pg-look">
            <h2 id="pg-look" className="card-title">
              Look
            </h2>

            <Field
              label="Background"
              hint={
                config.background ? (isLightColor(config.background) ? "dark text" : "light text") : "Signal"
              }
            >
              <div className="color-row">
                <input
                  type="color"
                  aria-label="Pick a background colour"
                  value={config.background ?? "#111113"}
                  onChange={(e) => applyColor(e.target.value)}
                />
                <input
                  className="text-input"
                  aria-label="Background colour hex"
                  aria-invalid={!draftValid}
                  placeholder="#111113"
                  value={colorDraft}
                  onChange={(e) => {
                    setColorDraft(e.target.value);
                    const valid = normalizeColor(e.target.value);
                    if (valid) set({ background: valid });
                  }}
                />
                <button type="button" className="btn btn-small btn-ghost" onClick={() => applyColor(null)}>
                  Default
                </button>
              </div>
              <div className="swatches">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className="swatch"
                    style={{ background: c }}
                    aria-label={`Use ${c}`}
                    aria-pressed={config.background === c}
                    onClick={() => applyColor(c)}
                  />
                ))}
              </div>
              {!draftValid ? <p className="field-error">Use a hex colour like #3b5bdb</p> : null}
            </Field>

            <Field label="Theme" hint="auto follows the page">
              <Segmented
                label="Theme"
                value={config.theme}
                options={THEMES}
                onChange={(theme) => set({ theme })}
              />
            </Field>

            <Field label="Entrance">
              <Segmented
                label="Entrance"
                value={config.entrance}
                options={ENTRANCES}
                onChange={(entrance) => set({ entrance })}
              />
            </Field>

            <Field label="Countdown">
              <Segmented
                label="Countdown"
                value={config.countdown}
                options={COUNTDOWNS}
                onChange={(countdown) => set({ countdown })}
              />
            </Field>

            <Toggle
              label="Expand on hover"
              checked={config.expandOnHover}
              onChange={(v) => set({ expandOnHover: v })}
            />
            <Toggle
              label="Close button"
              checked={config.closeButton}
              onChange={(v) => set({ closeButton: v })}
            />
          </section>

          <section className="card" aria-labelledby="pg-layout">
            <h2 id="pg-layout" className="card-title">
              Position &amp; stacking
            </h2>
            <Field label="Position" hint={config.position.replace("-", " ")}>
              <div className="mini-screen big" role="radiogroup" aria-label="Position">
                {POSITIONS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    role="radio"
                    className="mini-slot"
                    data-pos={p}
                    aria-label={p.replace("-", " ")}
                    aria-checked={config.position === p}
                    onClick={() => set({ position: p })}
                  />
                ))}
              </div>
            </Field>
            <Field
              label="Stacking"
              hint={config.stacking === "deck" ? "fans out on hover" : "always expanded"}
            >
              <Segmented
                label="Stacking"
                value={config.stacking}
                options={["deck", "list"] as const}
                onChange={(stacking) => set({ stacking })}
              />
            </Field>
            <Range
              label="Max visible"
              value={config.maxVisible}
              min={1}
              max={10}
              step={1}
              format={String}
              onChange={(maxVisible) => set({ maxVisible })}
            />
            <Range
              label="Offset from edge"
              value={config.offset}
              min={0}
              max={64}
              step={2}
              format={(v) => `${v}px`}
              onChange={(offset) => set({ offset })}
            />
          </section>

          <section className="card" aria-labelledby="pg-timing">
            <h2 id="pg-timing" className="card-title">
              Timing &amp; gestures
            </h2>
            <Range
              label="Auto-dismiss"
              value={config.duration}
              min={1000}
              max={15000}
              step={500}
              format={(v) => `${(v / 1000).toFixed(1)}s`}
              onChange={(duration) => set({ duration })}
            />
            <Toggle
              label="Errors stay until dismissed"
              checked={config.errorsPersist}
              onChange={(v) => set({ errorsPersist: v })}
            />
            <Toggle
              label="Pause on hover / focus"
              checked={config.pauseOnHover}
              onChange={(v) => set({ pauseOnHover: v })}
            />
            <Toggle
              label="Swipe to dismiss"
              checked={config.swipeToDismiss}
              onChange={(v) => set({ swipeToDismiss: v })}
            />
          </section>

          <section className="card" aria-labelledby="pg-sound">
            <h2 id="pg-sound" className="card-title">
              Sound
            </h2>
            <Toggle
              label="Play sounds"
              checked={config.sound.enabled}
              onChange={(enabled) => setSound({ enabled })}
            />
            <Field label="Pack">
              <Segmented
                label="Sound pack"
                value={config.sound.pack}
                options={SOUND_PACKS}
                onChange={(pack) => {
                  setSound({ pack });
                  previewSound(pack, "success");
                }}
              />
            </Field>
            <Range
              label="Volume"
              value={Math.round(config.sound.volume * 100)}
              min={0}
              max={100}
              step={5}
              format={(v) => `${v}%`}
              onChange={(v) => setSound({ volume: v / 100 })}
            />
            <Field label="Play for">
              <div className="chips">
                {SOUND_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    className="chip"
                    aria-pressed={config.sound.playFor.includes(t)}
                    onClick={() => togglePlayFor(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </Field>
          </section>
        </div>

        <div className="pg-side">
          <div className="pg-sticky">
            <section className="card" aria-labelledby="pg-fire">
              <h2 id="pg-fire" className="card-title">
                Fire a flash
              </h2>
              <div className="demo-grid compact">
                {DEMOS.map((demo) => (
                  <DemoButton key={demo.id} demo={demo} />
                ))}
              </div>
              <div className="row">
                <button type="button" className="btn btn-small btn-ghost" onClick={() => flash.dismissAll()}>
                  Dismiss all
                </button>
                <button
                  type="button"
                  className="btn btn-small btn-ghost"
                  onClick={() => {
                    resetConfig();
                    setColorDraft("");
                    flash.info("Settings reset", { message: "Back to the Amo Flash defaults" });
                  }}
                >
                  Reset settings
                </button>
              </div>
            </section>
            <CodeTabs snippets={snippets} label="Generated code" />
          </div>
        </div>
      </div>
    </div>
  );
}
