import { useCallback, useSyncExternalStore } from "react";

export type SiteTheme = "light" | "dark";

const KEY = "amo-site-theme";
const EVENT = "amo:theme";

function systemTheme(): SiteTheme {
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function read(): SiteTheme {
  const explicit = document.documentElement.getAttribute("data-theme");
  return explicit === "dark" || explicit === "light" ? explicit : systemTheme();
}

function subscribe(listener: () => void) {
  const media = window.matchMedia?.("(prefers-color-scheme: dark)");
  media?.addEventListener?.("change", listener);
  window.addEventListener(EVENT, listener);
  return () => {
    media?.removeEventListener?.("change", listener);
    window.removeEventListener(EVENT, listener);
  };
}

/** Site light/dark theme. Sets `data-theme` on <html>, which Amo Flash's `theme: "auto"` follows. */
export function useSiteTheme(): [SiteTheme, () => void] {
  const theme = useSyncExternalStore(subscribe, read, () => "light" as SiteTheme);
  const toggle = useCallback(() => {
    const next: SiteTheme = read() === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      // private mode: the choice lasts for this page view only
    }
    window.dispatchEvent(new Event(EVENT));
  }, []);
  return [theme, toggle];
}
