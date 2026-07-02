import { makeRenderApp } from "../views/renderApp.tsx";
import { App } from "./embeddings.tsx";
import type { SessionSnapshot } from "./session.ts";

// Rend <App> en string — même sérialisation en SSR initial (GET /embeddings)
// et dans les patches SSE (fabrique partagée, cf. views/renderApp.tsx).

export const renderApp = makeRenderApp<SessionSnapshot>(App);
