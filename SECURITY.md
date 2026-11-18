# Security policy

## Supported versions

Security fixes are released for the latest `1.x` version.

## Reporting a vulnerability

Please do **not** open a public issue. Use GitHub's private
[security advisory form](https://github.com/dev-amolrakh/amo-flash/security/advisories/new) instead.
You should get a reply within a few days.

## Design notes

- Titles, messages and action labels are written with `textContent`. Amo Flash never renders HTML strings.
- The library makes no network requests and stores nothing unless you set `persist`, which writes your
  preference keys (position, timing, sound and similar) to `localStorage`.
- If your Content Security Policy blocks inline styles, set `injectStyles: false` and import
  `amo-flash/style.css`.
