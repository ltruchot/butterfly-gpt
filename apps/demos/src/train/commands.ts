import { Hono } from "hono";
import { renderApp } from "./renderApp.tsx";
import { broadcast, getSnapshot, reset, start } from "./session.ts";

export const commands = new Hono();

// Lance l'entraînement SANS attendre : la boucle pousse la loss par SSE au fil
// de l'eau (la commande rend un ACK 200 immédiat, fidèle au CQRS).
commands.post("/start", (c) => {
  void start();
  return c.body(null, 200);
});

commands.post("/reset", (c) => {
  reset();
  broadcast(renderApp(getSnapshot()));
  return c.body(null, 200);
});
