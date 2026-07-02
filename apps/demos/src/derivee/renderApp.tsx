import { makeRenderApp } from "../views/renderApp.tsx";
import { setRenderer, type SessionSnapshot } from "./session.ts";
import { App } from "./derivee.tsx";

// Rend <App> en string — même sérialisation en SSR initial (GET /derivee)
// et dans les patches SSE (fabrique partagée, cf. views/renderApp.tsx).

export const renderApp = makeRenderApp<SessionSnapshot>(App);

// La boucle de descente automatique (session.ts) doit rendre le HTML à chaque
// pas ; on lui injecte le renderer ici pour éviter tout cycle d'import.
setRenderer(renderApp);
