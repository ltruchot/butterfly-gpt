import { Hono } from "hono";
import { renderApp } from "./renderApp.tsx";
import { broadcast, generate, getSnapshot, reset } from "./session.ts";

export const commands = new Hono();

// Génère un nom SANS attendre : la boucle streame les lettres par SSE.
commands.post("/generate", (c) => {
  void generate();
  return c.body(null, 200);
});

commands.post("/reset", (c) => {
  reset();
  broadcast(renderApp(getSnapshot()));
  return c.body(null, 200);
});
