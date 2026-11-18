import { useId, useMemo, useState, type KeyboardEvent } from "react";
import { flash } from "amo-flash";

import { highlight } from "../lib/highlight";
import type { Snippet } from "../content/snippets";
import { IconCheck, IconCopy } from "./Icons";

async function copyText(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  throw new Error("Clipboard is not available in this browser");
}

export function CopyButton({ text, label = "Copy code" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const onCopy = () => {
    copyText(text).then(
      () => {
        setCopied(true);
        flash.success("Copied to clipboard", { dedupeKey: "copied", sound: true });
        window.setTimeout(() => setCopied(false), 1600);
      },
      () => flash.error("Couldn't copy", { message: "Select the text and copy it manually" }),
    );
  };
  return (
    <button type="button" className="copy-btn" onClick={onCopy} aria-label={copied ? "Copied" : label}>
      {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
    </button>
  );
}

export function CodeBlock({ code, lang, file }: Pick<Snippet, "code" | "lang" | "file">) {
  const nodes = useMemo(() => highlight(code, lang), [code, lang]);
  return (
    <div className="code">
      {file ? (
        <div className="code-head">
          <span className="code-file">{file}</span>
          <CopyButton text={code} />
        </div>
      ) : (
        <div className="code-float">
          <CopyButton text={code} />
        </div>
      )}
      <pre tabIndex={0}>
        <code>{nodes}</code>
      </pre>
    </div>
  );
}

/** Accessible tabs (roving tabindex, arrow keys) over a set of snippets. */
export function CodeTabs({ snippets, label }: { snippets: Snippet[]; label: string }) {
  const [active, setActive] = useState(snippets[0]?.id ?? "");
  const base = useId();
  const current = snippets.find((s) => s.id === active) ?? snippets[0];

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = snippets.findIndex((s) => s.id === active);
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % snippets.length;
    else if (event.key === "ArrowLeft") next = (index - 1 + snippets.length) % snippets.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = snippets.length - 1;
    else return;
    event.preventDefault();
    const target = snippets[next];
    if (!target) return;
    setActive(target.id);
    document.getElementById(`${base}-tab-${target.id}`)?.focus();
  };

  if (!current) return null;
  return (
    <div className="tabs">
      <div className="tab-list" role="tablist" aria-label={label} onKeyDown={onKeyDown}>
        {snippets.map((s) => (
          <button
            key={s.id}
            id={`${base}-tab-${s.id}`}
            type="button"
            role="tab"
            className="tab"
            aria-selected={s.id === current.id}
            aria-controls={`${base}-panel`}
            tabIndex={s.id === current.id ? 0 : -1}
            onClick={() => setActive(s.id)}
          >
            {s.label}
          </button>
        ))}
      </div>
      <div id={`${base}-panel`} role="tabpanel" aria-labelledby={`${base}-tab-${current.id}`}>
        <CodeBlock code={current.code} lang={current.lang} file={current.file} />
      </div>
    </div>
  );
}
