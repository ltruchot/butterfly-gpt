import { makeRenderApp } from "../views/renderApp.tsx";
import { App } from "./inference.tsx";
import { setRenderer, type SessionSnapshot } from "./session.ts";

// Rend <App> en string — même sérialisation en SSR initial (GET /inference)
// et dans les patches SSE (fabrique partagée, cf. views/renderApp.tsx).

export const renderApp = makeRenderApp<SessionSnapshot>(App);

// La boucle de génération (session.ts) rend le HTML à chaque lettre ; on lui
// injecte le renderer ici pour éviter tout cycle d'import.
setRenderer(renderApp);
