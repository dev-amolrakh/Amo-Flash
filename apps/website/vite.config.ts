import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const lib = (path: string) => fileURLToPath(new URL(`../../packages/amo-flash/src/${path}`, import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    // The site always runs on the library source, so `npm run dev` hot-reloads library edits too.
    alias: [
      { find: /^amo-flash\/react$/, replacement: lib("react.tsx") },
      { find: /^amo-flash$/, replacement: lib("index.ts") },
    ],
  },
  build: {
    target: "es2020",
    cssCodeSplit: false,
  },
});
