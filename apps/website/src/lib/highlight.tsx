import type { ReactNode } from "react";

export type CodeLang = "ts" | "tsx" | "js" | "html" | "vue" | "svelte" | "bash" | "css";

const KEYWORDS = new Set(
  (
    "import export from default const let var function return if else new await async as type interface " +
    "extends implements class this true false null undefined typeof void for of in while try catch throw " +
    "public private readonly static declare module providedIn setup"
  ).split(" "),
);

/** One regex, tried at each position. Groups: 1 comment, 2 string, 3 tag, 4 number, 5 word, 6 punctuation. */
const TOKEN =
  /(\/\/[^\n]*|\/\*[\s\S]*?\*\/|<!--[\s\S]*?-->|(?:^|(?<=\s))#[^\n]*)|("(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|`(?:\\.|[^`\\])*`)|(<\/?[A-Za-z][\w.:-]*|\/?>)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][\w$-]*)|([{}()[\];,.=:+*?!|&<>-])/g;

/**
 * Tiny syntax highlighter for the docs (JS/TS/JSX/HTML/CSS/shell). Produces React nodes —
 * no innerHTML — so code is always rendered as text.
 */
export function highlight(code: string, lang: CodeLang): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let key = 0;
  const shell = lang === "bash";
  const markup = lang === "tsx" || lang === "html" || lang === "vue" || lang === "svelte";
  const push = (text: string, cls?: string) => {
    if (!text) return;
    out.push(
      cls ? (
        <span key={key++} className={cls}>
          {text}
        </span>
      ) : (
        text
      ),
    );
  };

  for (const match of code.matchAll(TOKEN)) {
    const index = match.index ?? 0;
    push(code.slice(last, index));
    last = index + match[0].length;
    const [text, comment, string, tag, number, word] = match;

    if (comment !== undefined) {
      // "#" only starts a comment in shell snippets (CSS colours, private fields stay plain).
      push(text, comment.startsWith("#") && !shell ? undefined : "tk-comment");
    } else if (string !== undefined) push(text, "tk-string");
    else if (tag !== undefined) push(text, markup ? "tk-tag" : "tk-punct");
    else if (number !== undefined) push(text, "tk-number");
    else if (word !== undefined) {
      const next = code[last];
      if (shell && (index === 0 || code[index - 1] === "\n")) push(text, "tk-fn");
      else if (KEYWORDS.has(word)) push(text, "tk-keyword");
      else if (next === "(") push(text, "tk-fn");
      else if (/^[A-Z]/.test(word)) push(text, "tk-type");
      else if (next === "=" && code[last + 1] !== "=" && lang !== "ts" && lang !== "js")
        push(text, "tk-attr");
      else push(text);
    } else push(text, "tk-punct");
  }
  push(code.slice(last));
  return out;
}
