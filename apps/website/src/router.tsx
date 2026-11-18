import { useEffect, useSyncExternalStore, type AnchorHTMLAttributes, type MouseEvent } from "react";

const NAV_EVENT = "amo:navigate";

function subscribe(listener: () => void) {
  window.addEventListener("popstate", listener);
  window.addEventListener(NAV_EVENT, listener);
  return () => {
    window.removeEventListener("popstate", listener);
    window.removeEventListener(NAV_EVENT, listener);
  };
}

const getPath = () => window.location.pathname.replace(/\/+$/, "") || "/";

export function usePath(): string {
  return useSyncExternalStore(subscribe, getPath, () => "/");
}

export function navigate(to: string): void {
  const url = new URL(to, window.location.href);
  if (url.pathname === window.location.pathname && url.hash) {
    window.history.pushState(null, "", url.href);
    document.getElementById(decodeURIComponent(url.hash.slice(1)))?.scrollIntoView({ behavior: "smooth" });
    return;
  }
  window.history.pushState(null, "", url.href);
  window.dispatchEvent(new Event(NAV_EVENT));
  if (url.hash) {
    requestAnimationFrame(() =>
      document.getElementById(decodeURIComponent(url.hash.slice(1)))?.scrollIntoView(),
    );
  } else {
    window.scrollTo({ top: 0 });
  }
}

type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { to: string };

/** In-app link: plain <a> (works without JS, middle-click, copy link) with client-side navigation. */
export function Link({ to, onClick, ...rest }: LinkProps) {
  const handle = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    event.preventDefault();
    navigate(to);
  };
  return <a href={to} onClick={handle} {...rest} />;
}

/** Sets the document title per page. */
export function useTitle(title: string): void {
  useEffect(() => {
    document.title = title;
  }, [title]);
}
