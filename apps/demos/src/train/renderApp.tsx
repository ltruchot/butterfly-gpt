import { makeRenderApp } from "../views/renderApp.tsx";
import { setRenderer, type SessionSnapshot } from "./session.ts";
import { App } from "./train.tsx";

// Rend <App> en string — même sérialisation en SSR initial (GET /train)
// et dans les patches SSE (fabrique partagée, cf. views/renderApp.tsx).

export const renderApp = makeRenderApp<SessionSnapshot>(App);

// La boucle d'entraînement (session.ts) a besoin de rendre le HTML à chaque
// pas ; on lui injecte le renderer ici pour éviter tout cycle d'import.
setRenderer(renderApp);
