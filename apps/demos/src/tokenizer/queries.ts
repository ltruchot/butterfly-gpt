import { makeSubscribeRoute } from "../views/subscribeRoute.ts";
import { renderApp } from "./renderApp.tsx";
import { getSnapshot, subscribe } from "./session.ts";

// QUERIES — GET /subscribe : SSE long-lived, unique canal de patch vers le
// client. Pousse l'état initial immédiatement après abonnement. La mécanique
// (keepalive, onAbort/onError → unsubscribe) vit dans views/subscribeRoute.ts.

export const queries = makeSubscribeRoute(subscribe, () => renderApp(getSnapshot()));
