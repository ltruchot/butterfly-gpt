import { ServerSentEventGenerator } from "@starfederation/datastar-sdk/web";
import { Hono } from "hono";
import { renderApp } from "./renderApp.tsx";
import { broadcast, getSnapshot, reset, setEta, startAuto, step, stopAuto } from "./session.ts";

// COMMANDS — CQRS strict : chaque POST mute l'état, broadcast le nouveau
// rendu par le canal SSE déjà ouvert, et rend un ACK 200 vide (jamais de
// patch dans le body). Routes montées sous /derivee par src/index.tsx.

export const commands = new Hono();

const pushAll = (): void => broadcast(renderApp(getSnapshot()));

// Un pas manuel. Comme le bouton « ↘ un pas » de la page d'origine, il coupe
// d'abord la descente automatique si elle tourne (sinon deux boucles de pas
// se marcheraient dessus).
commands.post("/step", (c) => {
  stopAuto();
  step();
  pushAll();
  return c.body(null, 200);
});

// Toggle « ▶ descendre tout seul » / « ■ stop ». startAuto broadcast
// elle-même à chaque pas de sa boucle (dont le premier, immédiat).
commands.post("/auto", (c) => {
  if (getSnapshot().auto) {
    stopAuto();
    pushAll();
  } else {
    startAuto();
  }
  return c.body(null, 200);
});

commands.post("/reset", (c) => {
  reset();
  pushAll();
  return c.body(null, 200);
});

// Le slider η : Datastar envoie automatiquement les signaux ($eta) dans le
// body du POST ; on les lit avec le SDK (c.req.raw = Request Fetch native).
commands.post("/eta", async (c) => {
  const result = await ServerSentEventGenerator.readSignals(c.req.raw);
  if (!result.success) return c.body(null, 400);
  setEta(Number(result.signals["eta"]));
  pushAll();
  return c.body(null, 200);
});
