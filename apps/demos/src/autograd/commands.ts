import { Hono } from "hono";
import { renderApp } from "./renderApp.tsx";
import { advance, broadcast, getSnapshot, reset } from "./session.ts";

// COMMANDS — POST routes. Pattern CQRS strict :
//   1. on mute l'état serveur,
//   2. on diffuse le nouveau HTML aux abonnés SSE,
//   3. on renvoie un ACK 200 VIDE — pas de patch dans ce body.

export const commands = new Hono();

commands.post("/next", (c) => {
  advance();
  broadcast(renderApp(getSnapshot()));
  return c.body(null, 200);
});

commands.post("/reset", (c) => {
  reset();
  broadcast(renderApp(getSnapshot()));
  return c.body(null, 200);
});
