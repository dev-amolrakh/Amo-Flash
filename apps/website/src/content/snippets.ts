import type { CodeLang } from "../lib/highlight";

export const REPO_URL = "https://github.com/dev-amolrakh/Amo-Flash";
export const NPM_URL = "https://www.npmjs.com/package/amo-flash";
export const AUTHOR_URL = "https://github.com/dev-amolrakh";

export type Snippet = { id: string; label: string; lang: CodeLang; code: string; file?: string };

export const INSTALL: Snippet[] = [
  { id: "npm", label: "npm", lang: "bash", code: "npm install amo-flash" },
  { id: "pnpm", label: "pnpm", lang: "bash", code: "pnpm add amo-flash" },
  { id: "yarn", label: "yarn", lang: "bash", code: "yarn add amo-flash" },
  { id: "bun", label: "bun", lang: "bash", code: "bun add amo-flash" },
];

export const FRAMEWORKS: Snippet[] = [
  {
    id: "react",
    label: "React",
    lang: "tsx",
    file: "App.tsx",
    code: `import { AmoFlash, flash } from "amo-flash/react";

export function App() {
  return (
    <>
      <AmoFlash position="top-center" />
      <button onClick={() => flash.success("Saved")}>Save</button>
    </>
  );
}`,
  },
  {
    id: "next",
    label: "Next.js",
    lang: "tsx",
    file: "app/layout.tsx",
    code: `import { AmoFlash } from "amo-flash/react"; // already a client component

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <AmoFlash />
      </body>
    </html>
  );
}

// any client component
"use client";
import { flash } from "amo-flash";
flash.success("Profile updated");`,
  },
  {
    id: "vue",
    label: "Vue",
    lang: "ts",
    file: "main.ts",
    code: `import { createApp } from "vue";
import { createAmoFlash } from "amo-flash/vue";
import App from "./App.vue";

createApp(App).use(createAmoFlash({ position: "bottom-right" })).mount("#app");

// in any component (<script setup>)
import { useFlash } from "amo-flash/vue";
const flash = useFlash();
flash.success("Saved");`,
  },
  {
    id: "svelte",
    label: "Svelte",
    lang: "svelte",
    file: "App.svelte",
    code: `<script>
  import { onMount } from "svelte";
  import { flash, initFlash } from "amo-flash/svelte";

  onMount(() => initFlash({ position: "top-right" }));
</script>

<button on:click={() => flash.success("Saved")}>Save</button>`,
  },
  {
    id: "angular",
    label: "Angular",
    lang: "ts",
    file: "flash.service.ts",
    code: `import { Injectable } from "@angular/core";
import { configure, flash } from "amo-flash";

@Injectable({ providedIn: "root" })
export class FlashService {
  constructor() {
    configure({ position: "top-right" });
  }
  readonly show = flash;
}

// in a component
constructor(private flash: FlashService) {}
save() { this.flash.show.success("Saved"); }`,
  },
  {
    id: "vanilla",
    label: "Vanilla",
    lang: "ts",
    file: "main.ts",
    code: `import { flash, configure } from "amo-flash";

configure({ position: "bottom-center" }); // optional

document.querySelector("#save")!.addEventListener("click", () => {
  flash.success("Saved", { message: "All changes synced" });
});`,
  },
  {
    id: "cdn",
    label: "CDN",
    lang: "html",
    file: "index.html",
    code: `<script src="https://unpkg.com/amo-flash@1/dist/amo-flash.global.js"></script>
<script>
  const { flash, configure } = window.AmoFlash;
  configure({ position: "top-center" });
  flash.success("Hello from a script tag");
</script>`,
  },
];

export const API_OVERVIEW = `import { flash } from "amo-flash";

flash.success("Saved");
flash.error("Couldn't save", { message: "Check your connection" });
flash.warning("Storage almost full");
flash.info("New version available");
flash.notify("New comment", { action: { label: "View", onClick: openComments } });

// async: one pill, loading → success / error
flash.promise(saveProfile(), {
  loading: "Saving profile",
  success: "Profile saved",
  error: (err) => ({ title: "Save failed", message: String(err) }),
});

// undo
flash.success("Item archived", { action: { label: "Undo", onClick: restore } });

// manual control
const id = flash.loading("Uploading", { message: "0%" });
flash.update(id, { message: "64%" });
flash.update(id, { type: "success", title: "Uploaded" });
flash.dismiss(id); // or flash.dismissAll()`;
