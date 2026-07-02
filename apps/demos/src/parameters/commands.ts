import { Hono } from "hono";
import { renderApp } from "./renderApp.tsx";
import { advance, broadcast, getSnapshot, reset } from "./session.ts";

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
