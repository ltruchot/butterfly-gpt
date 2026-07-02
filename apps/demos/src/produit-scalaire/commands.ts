import { ServerSentEventGenerator } from "@starfederation/datastar-sdk/web";
import { Hono } from "hono";
import { renderApp } from "./renderApp.tsx";
import { broadcast, getSnapshot, reset, setDeg } from "./session.ts";

// COMMANDS — CQRS strict : chaque POST mute l'état, broadcast le nouveau
// rendu via le canal SSE déjà ouvert, et répond par un ACK 200 vide
// (jamais de patch dans le body d'une commande).

export const commands = new Hono();

// POST /angle — le slider a bougé. Datastar envoie TOUS les signaux dans le
// body ; on lit $deg côté serveur (le clamp 0..360 vit dans session.ts).
commands.post("/angle", async (c) => {
  const result = await ServerSentEventGenerator.readSignals(c.req.raw);
  if (!result.success) return c.body(null, 400);
  setDeg(Number(result.signals["deg"]));
  broadcast(renderApp(getSnapshot()));
  return c.body(null, 200);
});

commands.post("/reset", (c) => {
  reset();
  broadcast(renderApp(getSnapshot()));
  return c.body(null, 200);
});
