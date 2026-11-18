# Contributing to Amo Flash

Thanks for helping make Amo Flash better. Bug reports, docs fixes and pull requests are all welcome.

## Setup

```bash
git clone https://github.com/dev-amolrakh/Amo-Flash.git
cd Amo-Flash
npm install
npm run dev        # website + docs on http://localhost:5173, running on the library source
```

Node 18.18 or newer is required (`.nvmrc` pins 22).

## Project layout

| Path                      | What it is                                                         |
| ------------------------- | ------------------------------------------------------------------ |
| `packages/amo-flash/src`  | The library: store, config, DOM renderer, styles, sounds, adapters |
| `packages/amo-flash/test` | Vitest + jsdom tests                                               |
| `apps/website`            | The Vite + React website (landing page, docs, playground)          |

## Checks

Run these before opening a pull request. CI runs the same ones.

```bash
npm run format:check
npm run typecheck
npm test
npm run build
```

## Guidelines

- **Keep the core dependency-free.** Adapters must import the core as `"amo-flash"` so every entry shares one store.
- **Accessibility is not optional.** New UI must work with the keyboard, have labels, respect `prefers-reduced-motion`, and stay readable (WCAG AA) on light and dark pages.
- **Text only.** Titles and messages are rendered with `textContent`, never as HTML.
- **Add tests** for new behaviour, and update `README.md`, the docs page (`apps/website/src/pages/Docs.tsx`) and `CHANGELOG.md` when the API changes.
- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `docs:` and so on.

## Releasing (maintainers)

1. Update the version in `packages/amo-flash/package.json` and `VERSION` in `src/index.ts`, and add a `CHANGELOG.md` entry.
2. `npm run build && npm test`
3. `cd packages/amo-flash && npm publish --access public`
4. Tag the release: `git tag v1.x.y && git push --tags`
