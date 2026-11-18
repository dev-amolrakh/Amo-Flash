import { flash, type FlashType } from "amo-flash";

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

export type Demo = { id: string; label: string; type: FlashType; run: () => void };

export const DEMOS: Demo[] = [
  {
    id: "success",
    label: "Success",
    type: "success",
    run: () => flash.success("Changes saved", { message: "Your profile is up to date" }),
  },
  {
    id: "error",
    label: "Error",
    type: "error",
    run: () => flash.error("Payment failed", { message: "Your card was declined. Try another card." }),
  },
  {
    id: "warning",
    label: "Warning",
    type: "warning",
    run: () => flash.warning("Storage almost full", { message: "You have used 92% of 10 GB" }),
  },
  {
    id: "info",
    label: "Info",
    type: "info",
    run: () => flash.info("New version available", { message: "Reload the page to get the latest update" }),
  },
  {
    id: "notify",
    label: "Notify",
    type: "notification",
    run: () =>
      flash.notify("Ana mentioned you", {
        message: "“Can you review the launch copy before 5pm?”",
        action: { label: "View", onClick: () => flash.info("Opening the thread") },
      }),
  },
  {
    id: "promise",
    label: "Promise",
    type: "loading",
    run: () => {
      const start = performance.now();
      void flash
        .promise(wait(2200), {
          loading: { title: "Deploying to production", message: "Building and uploading assets" },
          success: () => ({
            title: `Deployed in ${((performance.now() - start) / 1000).toFixed(1)}s`,
            message: "amo-flash.vercel.app is live",
          }),
          error: "Deploy failed",
        })
        .catch(() => undefined);
    },
  },
  {
    id: "undo",
    label: "Undo",
    type: "success",
    run: () =>
      flash.success("Conversation archived", {
        action: { label: "Undo", onClick: () => flash.info("Conversation restored") },
      }),
  },
  {
    id: "repeat",
    label: "Repeat ×3",
    type: "error",
    run: () => {
      flash.error("Network unstable", { duration: 5000 });
      window.setTimeout(() => flash.error("Network unstable", { duration: 5000 }), 350);
      window.setTimeout(() => flash.error("Network unstable", { duration: 5000 }), 700);
    },
  },
];

export function DemoButton({ demo }: { demo: Demo }) {
  return (
    <button type="button" className="demo-btn" data-type={demo.type} onClick={demo.run}>
      <span className="demo-dot" aria-hidden="true" />
      {demo.label}
    </button>
  );
}

const PREVIEW_GLYPH: Partial<Record<FlashType, string>> = {
  success: "M7.4 12.3l3.1 3.1l6.1-6.4",
  error: "M8.7 8.7l6.6 6.6M15.3 8.7l-6.6 6.6",
  info: "M12 11.2v5.3",
};

/** Static, decorative replica of the pill for the hero illustration. */
export function PillPreview({ type, title, meta }: { type: FlashType; title: string; meta?: string }) {
  const glyph = PREVIEW_GLYPH[type];
  return (
    <div className="pill-preview" data-type={type} aria-hidden="true">
      <span className="pp-badge">
        <svg viewBox="0 0 24 24" width="24" height="24">
          <circle cx="12" cy="12" r="11" className="pp-circle" />
          <ellipse cx="12" cy="6.4" rx="7.2" ry="3.4" fill="#fff" opacity=".2" />
          {glyph ? (
            <path
              d={glyph}
              fill="none"
              stroke="#fff"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : null}
          {type === "info" ? <circle cx="12" cy="7.9" r="1.45" fill="#fff" /> : null}
          {type === "notification" ? (
            <>
              <path
                d="M12 6.2a4.3 4.3 0 0 1 4.3 4.3v2.4l1.3 2.1H6.4l1.3-2.1v-2.4A4.3 4.3 0 0 1 12 6.2z"
                fill="#fff"
              />
              <path
                d="M10.4 16.9a1.7 1.7 0 0 0 3.2 0"
                fill="none"
                stroke="#fff"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </>
          ) : null}
          {type === "loading" ? (
            <path
              className="pp-spin"
              d="M12 6.6a5.4 5.4 0 1 0 5.4 5.4"
              fill="none"
              stroke="#fff"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          ) : null}
        </svg>
      </span>
      <span className="pp-title">{title}</span>
      {meta ? <span className="pp-meta">{meta}</span> : null}
      <span className="pp-close">
        <svg viewBox="0 0 26 26" width="24" height="24">
          <circle cx="13" cy="13" r="11.5" className="pp-ring-track" />
          <circle cx="13" cy="13" r="11.5" className="pp-ring" pathLength={100} />
          <path
            d="M9.5 9.5l7 7M16.5 9.5l-7 7"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </span>
    </div>
  );
}
