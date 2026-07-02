import { makeRenderApp } from "../views/renderApp.tsx";
import { App } from "./tokenizer.tsx";
import type { SessionSnapshot } from "./session.ts";

// Rend <App> en string — même sérialisation en SSR initial (GET /tokenizer)
// et dans les patches SSE (fabrique partagée, cf. views/renderApp.tsx).

export const renderApp = makeRenderApp<SessionSnapshot>(App);
