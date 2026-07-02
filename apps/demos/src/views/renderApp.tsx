import type { FC } from "hono/jsx";
import { renderToString } from "hono/jsx/dom/server";

// Fabrique du renderer d'une démo : rend `<App state={…}>` en HTML string.
// Utilisé à la fois en SSR initial (GET /<demo>) et dans les patches SSE —
// même sérialisation partout, pour qu'idiomorph compare des arbres
// identiques (par id) et garde les listeners attachés.

export const makeRenderApp =
  <S,>(App: FC<{ state: S }>): ((snapshot: S) => string) =>
  (snapshot: S): string =>
    renderToString(<App state={snapshot} />);
