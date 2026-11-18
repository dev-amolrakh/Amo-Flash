import { copyFileSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { defineConfig, type Options } from "tsup";

/** Comment + whitespace removal for the injected stylesheet (selectors and values are untouched). */
function minifyCss(css: string): string {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*([{};])\s*/g, "$1")
    .replace(/;}/g, "}")
    .trim();
}

/** Lets `import css from "./styles.css?raw"` work in esbuild the same way it does in Vite/Vitest. */
const rawPlugin: NonNullable<Options["esbuildPlugins"]>[number] = {
  name: "raw-import",
  setup(build) {
    // Keep the "?raw" suffix on the resolved path so tsup's own .css handling never claims it.
    build.onResolve({ filter: /\?raw$/ }, (args) => ({
      path: `${resolve(args.resolveDir, args.path.replace(/\?raw$/, ""))}?raw`,
      namespace: "raw-file",
    }));
    build.onLoad({ filter: /.*/, namespace: "raw-file" }, (args) => ({
      contents: minifyCss(readFileSync(args.path.replace(/\?raw$/, ""), "utf8")),
      loader: "text",
    }));
  },
};

const shared: Options = {
  target: "es2020",
  sourcemap: true,
  esbuildPlugins: [rawPlugin],
  // Adapters import the core by package name so every entry shares ONE store.
  external: ["amo-flash", "react", "react-dom"],
};

export default defineConfig([
  {
    ...shared,
    entry: { index: "src/index.ts", vue: "src/vue.ts", svelte: "src/svelte.ts" },
    format: ["esm", "cjs"],
    dts: true,
    clean: true,
    onSuccess: async () => {
      const out = resolve("dist/style.css");
      mkdirSync(dirname(out), { recursive: true });
      copyFileSync(resolve("src/styles.css"), out);
    },
  },
  {
    ...shared,
    entry: { react: "src/react.tsx" },
    format: ["esm", "cjs"],
    dts: true,
    // Next.js App Router: the React adapter is a client component.
    banner: { js: '"use client";' },
  },
  {
    ...shared,
    // <script src="https://unpkg.com/amo-flash"> → window.AmoFlash
    entry: { "amo-flash": "src/index.ts" },
    format: ["iife"],
    globalName: "AmoFlash",
    minify: true,
    external: [],
  },
]);
