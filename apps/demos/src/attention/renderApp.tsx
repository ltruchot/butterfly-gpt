import { makeRenderApp } from "../views/renderApp.tsx";
import { App } from "./attention.tsx";
import type { SessionSnapshot } from "./session.ts";

// Rend <App> en string — même sérialisation en SSR initial (GET /attention)
// et dans les patches SSE (fabrique partagée, cf. views/renderApp.tsx).

export const renderApp = makeRenderApp<SessionSnapshot>(App);
