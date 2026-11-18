import { configure } from "amo-flash";
import { AmoFlash, useFlashConfig } from "amo-flash/react";
import { useEffect } from "react";

import { Page } from "./components/Layout";
import { Docs } from "./pages/Docs";
import { Home } from "./pages/Home";
import { NotFound } from "./pages/NotFound";
import { Playground } from "./pages/Playground";
import { usePath } from "./router";

/** Settings changed in the Playground are remembered for the whole site. */
export const SITE_PERSIST_KEY = "amo-flash-site";

/** Clearance for the floating header (12px gap + 58px bar + 10px breathing room). */
const TOP_OFFSET = 80;
const BOTTOM_OFFSET = 20;

function Route({ path }: { path: string }) {
  switch (path) {
    case "/":
      return <Home />;
    case "/docs":
      return <Docs />;
    case "/playground":
      return <Playground />;
    default:
      return <NotFound />;
  }
}

/** Top-positioned flashes drop in just below the floating header instead of covering it. */
function useHeaderAwareOffset() {
  const { position } = useFlashConfig();
  const top = position.startsWith("top");
  useEffect(() => {
    configure({ offset: top ? TOP_OFFSET : BOTTOM_OFFSET });
  }, [top]);
}

export function App() {
  const path = usePath();
  useHeaderAwareOffset();
  return (
    <>
      <AmoFlash persist={SITE_PERSIST_KEY} />
      <Page>
        <Route path={path} />
      </Page>
    </>
  );
}
