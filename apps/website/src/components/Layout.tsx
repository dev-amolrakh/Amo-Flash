import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";

import { AUTHOR_URL, NPM_URL, REPO_URL } from "../content/snippets";
import { Link, usePath } from "../router";
import { useSiteTheme } from "../theme";
import { PillPreview } from "./Demo";
import { IconArrowRight, IconClose, IconGithub, IconMenu, IconMoon, IconSun } from "./Icons";

export function Logo() {
  const gradient = `logo-g-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <span className="logo">
      <svg width="30" height="20" viewBox="0 0 30 18" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#69db7c" />
            <stop offset="1" stopColor="#2b8a3e" />
          </linearGradient>
        </defs>
        <rect x="0.5" y="0.5" width="29" height="17" rx="8.5" className="logo-pill" />
        <circle cx="9" cy="9" r="5.2" fill={`url(#${gradient})`} />
        <path
          d="M6.8 9.1l1.5 1.5 2.9-3.1"
          fill="none"
          stroke="#fff"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect x="16.5" y="7.7" width="8.5" height="2.6" rx="1.3" fill="#fff" opacity=".85" />
      </svg>
      <span className="logo-word">
        amo<span>flash</span>
      </span>
    </span>
  );
}

/* ---------- Docs mega-menu ---------- */

type ThumbKind = "start" | "frameworks" | "api" | "theming";

const DOC_LINKS: Array<{ to: string; title: string; body: string; thumb: ThumbKind }> = [
  {
    to: "/docs#quick-start",
    title: "Quick start",
    body: "Install and fire your first flash in a minute",
    thumb: "start",
  },
  {
    to: "/docs#frameworks",
    title: "Frameworks",
    body: "React, Next.js, Vue, Svelte, Angular and CDN",
    thumb: "frameworks",
  },
  { to: "/docs#api", title: "API reference", body: "Every method, option and config key", thumb: "api" },
  {
    to: "/docs#theming",
    title: "Theming",
    body: "CSS variables, any colour, light and dark",
    thumb: "theming",
  },
];

/** Small illustrated tile for each mega-menu item (decorative). */
function MegaThumb({ kind }: { kind: ThumbKind }) {
  return (
    <span className="mega-thumb" data-kind={kind} aria-hidden="true">
      <svg viewBox="0 0 56 44" width="56" height="44">
        {kind === "start" ? (
          <>
            <rect x="8" y="14" width="40" height="16" rx="8" fill="#111113" />
            <circle cx="16" cy="22" r="4.6" fill="#40c057" />
            <path
              d="M14 22.2l1.4 1.4 2.6-2.8"
              fill="none"
              stroke="#fff"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <rect x="24" y="20.6" width="17" height="2.8" rx="1.4" fill="#fff" opacity=".85" />
          </>
        ) : null}
        {kind === "frameworks" ? (
          <>
            <rect x="9" y="9" width="17" height="12" rx="4" fill="#fff" opacity=".9" />
            <rect x="30" y="9" width="17" height="12" rx="4" fill="#fff" opacity=".55" />
            <rect x="9" y="24" width="17" height="12" rx="4" fill="#fff" opacity=".55" />
            <rect x="30" y="24" width="17" height="12" rx="4" fill="#fff" opacity=".9" />
          </>
        ) : null}
        {kind === "api" ? (
          <>
            <rect x="9" y="11" width="22" height="3.4" rx="1.7" fill="#fff" opacity=".95" />
            <rect x="14" y="18" width="30" height="3.4" rx="1.7" fill="#fff" opacity=".6" />
            <rect x="14" y="25" width="22" height="3.4" rx="1.7" fill="#fff" opacity=".6" />
            <rect x="9" y="32" width="14" height="3.4" rx="1.7" fill="#fff" opacity=".95" />
          </>
        ) : null}
        {kind === "theming" ? (
          <>
            <circle cx="18" cy="22" r="7" fill="#fff" opacity=".95" />
            <circle cx="28" cy="22" r="7" fill="#111113" opacity=".85" />
            <circle cx="38" cy="22" r="7" fill="#fff" opacity=".55" />
          </>
        ) : null}
      </svg>
    </span>
  );
}

function DocsMenu({ onNavigate, id }: { onNavigate: () => void; id?: string }) {
  return (
    <div className="mega" id={id}>
      <ul className="mega-list">
        {DOC_LINKS.map((item) => (
          <li key={item.to}>
            <Link to={item.to} className="mega-item" onClick={onNavigate}>
              <MegaThumb kind={item.thumb} />
              <span className="mega-text">
                <span className="mega-title">{item.title}</span>
                <span className="mega-body">{item.body}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <Link to="/playground" className="mega-feature" onClick={onNavigate}>
        <span className="mega-art" aria-hidden="true">
          <PillPreview type="success" title="Changes saved" />
        </span>
        <span className="mega-feature-title">
          Playground <span className="tag">New</span>
        </span>
        <span className="mega-body">
          Tune every option live, then copy the code. <span className="mega-more">Open it →</span>
        </span>
      </Link>
    </div>
  );
}

/* ---------- header ---------- */

const CLOSE_DELAY_MS = 140;

export function Header() {
  const [theme, toggleTheme] = useSiteTheme();
  const path = usePath();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const megaRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeTimer = useRef<number | undefined>(undefined);
  const megaId = useId();

  const closeAll = useCallback(() => {
    setMegaOpen(false);
    setMobileOpen(false);
  }, []);

  useEffect(closeAll, [path, closeAll]);

  // Esc closes (and returns focus); a click outside closes.
  useEffect(() => {
    if (!megaOpen && !mobileOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (megaOpen) triggerRef.current?.focus();
      closeAll();
    };
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!(target instanceof Node)) return;
      if (!document.querySelector(".header")?.contains(target)) closeAll();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [megaOpen, mobileOpen, closeAll]);

  const openSoon = () => {
    window.clearTimeout(closeTimer.current);
    setMegaOpen(true);
  };
  const closeSoon = () => {
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setMegaOpen(false), CLOSE_DELAY_MS);
  };

  const onDocs = path === "/docs";

  return (
    <header className="header">
      <div className="header-bar">
        <Link to="/" className="brand" aria-label="Amo Flash home">
          <Logo />
        </Link>

        <nav className="nav" aria-label="Main">
          <div
            className="nav-item"
            ref={megaRef}
            onPointerEnter={(e) => e.pointerType === "mouse" && openSoon()}
            onPointerLeave={(e) => e.pointerType === "mouse" && closeSoon()}
            onBlur={(e) => {
              if (!megaRef.current?.contains(e.relatedTarget as Node | null)) setMegaOpen(false);
            }}
          >
            <button
              ref={triggerRef}
              type="button"
              className="nav-link nav-trigger"
              aria-expanded={megaOpen}
              aria-controls={megaId}
              aria-current={onDocs ? "page" : undefined}
              onClick={() => setMegaOpen((v) => !v)}
            >
              Docs
              <svg
                className="chev"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                aria-hidden="true"
                focusable="false"
              >
                <path
                  d="M6 9l6 6 6-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <div className={`mega-wrap${megaOpen ? " is-open" : ""}`} hidden={!megaOpen}>
              <DocsMenu id={megaId} onNavigate={closeAll} />
            </div>
          </div>
          <Link
            to="/playground"
            className="nav-link"
            aria-current={path === "/playground" ? "page" : undefined}
          >
            Playground
          </Link>
          <a
            className="nav-link"
            href={`${REPO_URL}/blob/main/CHANGELOG.md`}
            target="_blank"
            rel="noreferrer"
          >
            Changelog
          </a>
          <a className="nav-link" href={NPM_URL} target="_blank" rel="noreferrer">
            npm
          </a>
        </nav>

        <div className="header-actions">
          <button
            type="button"
            className="icon-btn"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          >
            {theme === "dark" ? <IconSun /> : <IconMoon />}
          </button>
          <a className="pill-btn pill-ghost hide-sm" href={REPO_URL} target="_blank" rel="noreferrer">
            <IconGithub size={16} /> GitHub
          </a>
          <Link to="/docs#quick-start" className="pill-btn pill-cta hide-xs">
            Get started
          </Link>
          <button
            type="button"
            className="icon-btn menu-btn"
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <IconClose /> : <IconMenu />}
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <div className="mobile-panel" id="mobile-menu">
          <p className="mobile-label">Docs</p>
          <DocsMenu onNavigate={closeAll} />
          <div className="mobile-links">
            <Link to="/playground" onClick={closeAll}>
              Playground
            </Link>
            <a href={`${REPO_URL}/blob/main/CHANGELOG.md`} target="_blank" rel="noreferrer">
              Changelog
            </a>
            <a href={NPM_URL} target="_blank" rel="noreferrer">
              npm
            </a>
            <a href={REPO_URL} target="_blank" rel="noreferrer">
              GitHub
            </a>
          </div>
          <Link to="/docs#quick-start" className="pill-btn pill-cta block" onClick={closeAll}>
            Get started <IconArrowRight size={15} />
          </Link>
        </div>
      ) : null}
    </header>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <Logo />
          <p>
            Free and open source under the MIT license. Built by{" "}
            <a href={AUTHOR_URL} target="_blank" rel="noreferrer">
              dev-amolrakh
            </a>
            .
          </p>
        </div>
        <nav className="footer-links" aria-label="Footer">
          <Link to="/docs">Documentation</Link>
          <Link to="/playground">Playground</Link>
          <a href={REPO_URL} target="_blank" rel="noreferrer">
            GitHub
          </a>
          <a href={`${REPO_URL}/issues`} target="_blank" rel="noreferrer">
            Report an issue
          </a>
          <a href={NPM_URL} target="_blank" rel="noreferrer">
            npm
          </a>
        </nav>
      </div>
    </footer>
  );
}

export function Page({ children }: { children: ReactNode }) {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Header />
      <main id="main" tabIndex={-1}>
        {children}
      </main>
      <Footer />
    </>
  );
}
