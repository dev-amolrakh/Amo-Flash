import { flash } from "amo-flash";

import { Link, useTitle } from "../router";

export function NotFound() {
  useTitle("Page not found — Amo Flash");
  return (
    <section className="section container narrow center">
      <p className="eyebrow">404</p>
      <h1 className="h2">This page flashed away</h1>
      <p className="lead">The link may be old, or the page moved.</p>
      <div className="row center-row">
        <Link to="/" className="btn btn-primary">
          Back home
        </Link>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => flash.warning("Still not here", { message: "But at least you got a flash" })}
        >
          Flash anyway
        </button>
      </div>
    </section>
  );
}
