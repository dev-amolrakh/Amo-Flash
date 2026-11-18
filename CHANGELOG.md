# Changelog

All notable changes to Amo Flash are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org/).

## [1.0.0] — 2026-11-18

First public release.

### Added

- Framework-free core: `flash.success / error / warning / info / notify / loading / show / update / promise / dismiss / dismissAll`.
- The "Signal" pill: morph, drop, slide and fade entrances; icon choreography; width morph on update.
- Six countdown styles (close ring, icon ring, outline, sweep, edge glow, bar) that pause on hover and focus.
- Smart dedupe with a ×N counter, a 1.5 s repeat window, and in-place updates by `id`.
- Deck and list stacking, six positions, swipe to dismiss, Esc to dismiss.
- `configure()` with validation, live updates and optional `persist` to localStorage.
- Any background colour with automatic text contrast; `theme: "auto"` follows the page or OS.
- Five synthesized sound packs (Web Audio, off by default).
- React (`<AmoFlash />`, `useFlash`, `useFlashConfig`, `useFlashes`), Vue (`createAmoFlash`) and Svelte (`initFlash`, stores) adapters.
- IIFE build for `<script>` tags (`window.AmoFlash`), ESM and CJS builds, full TypeScript types.
- Headless store (`createFlashStore`, `subscribe`, `getFlashes`) for custom renderers.

[1.0.0]: https://github.com/dev-amolrakh/amo-flash/releases/tag/v1.0.0
