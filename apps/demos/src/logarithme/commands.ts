import { ServerSentEventGenerator } from "@starfederation/datastar-sdk/web";
import { Hono } from "hono";
import { renderApp } from "./renderApp.tsx";
import { broadcast, getSnapshot, reset, setX } from "./session.ts";

// COMMANDS — CQRS strict : chaque POST mute l'état, broadcast le nouveau
// rendu via le canal SSE déjà ouvert, et répond par un ACK 200 vide
// (jamais de patch dans le body d'une commande).

export const commands = new Hono();

// POST /x — le slider a bougé. Datastar envoie TOUS les signaux dans le
// body ; on lit $x côté serveur (le clamp 0.1..8 vit dans session.ts).
commands.post("/x", async (c) => {
  const result = await ServerSentEventGenerator.readSignals(c.req.raw);
  if (!result.success) return c.body(null, 400);
  setX(Number(result.signals["x"]));
  broadcast(renderApp(getSnapshot()));
  return c.body(null, 200);
});

commands.post("/reset", (c) => {
  reset();
  broadcast(renderApp(getSnapshot()));
  return c.body(null, 200);
});
