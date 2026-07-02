import { makeSubscribeRoute } from "../views/subscribeRoute.ts";
import { renderApp } from "./renderApp.tsx";
import { getSnapshot, subscribe } from "./session.ts";

// QUERIES — GET /subscribe : SSE long-lived, unique canal de patch vers le
// client (mécanique partagée dans views/subscribeRoute.ts).

export const queries = makeSubscribeRoute(subscribe, () => renderApp(getSnapshot()));
