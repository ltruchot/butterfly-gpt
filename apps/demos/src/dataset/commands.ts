import { Hono } from "hono";
import { renderApp } from "./renderApp.tsx";
import { broadcast, clean, collect, getSnapshot, reset, shuffle } from "./session.ts";

// COMMANDS — POST routes (CQRS strict : mutate + broadcast + ACK 200 vide,
// jamais de patch dans le body — les morphs passent par /subscribe).

export const commands = new Hono();

commands.post("/collect", (c) => {
  collect();
  broadcast(renderApp(getSnapshot()));
  return c.body(null, 200);
});

commands.post("/clean", (c) => {
  clean();
  broadcast(renderApp(getSnapshot()));
  return c.body(null, 200);
});

commands.post("/shuffle", (c) => {
  shuffle();
  broadcast(renderApp(getSnapshot()));
  return c.body(null, 200);
});

commands.post("/reset", (c) => {
  reset();
  broadcast(renderApp(getSnapshot()));
  return c.body(null, 200);
});
