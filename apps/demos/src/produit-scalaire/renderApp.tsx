import { makeRenderApp } from "../views/renderApp.tsx";
import { App } from "./produit-scalaire.tsx";
import type { SessionSnapshot } from "./session.ts";

// Rend <App> en string — même sérialisation en SSR initial
// (GET /produit-scalaire) et dans les patches SSE (fabrique partagée).

export const renderApp = makeRenderApp<SessionSnapshot>(App);
