import { ServerSentEventGenerator } from "@starfederation/datastar-sdk/web";
import { Hono } from "hono";
import type { Subscriber } from "./pubsub.ts";

// ════════════════════════════════════════════════════════════════════════
// QUERIES partagées — fabrique de la route GET /subscribe (SSE long-lived)
// ════════════════════════════════════════════════════════════════════════
// La route /subscribe était identique dans les 12 démos : SSE long-lived,
// UNIQUE canal de patch vers le client (CQRS : les morphs ne passent JAMAIS
// dans le body d'une commande). On la fabrique ici ; chaque queries.ts
// fournit juste son `subscribe` et son rendu initial.

export const makeSubscribeRoute = (
  subscribe: (s: Subscriber) => () => void,
  initialHtml: () => string,
): Hono => {
  const queries = new Hono();

  queries.get("/subscribe", () => {
    // `unsubscribe` doit vivre dans la closure externe pour rester accessible
    // depuis `onAbort` ; le SDK ne route pas le retour de `onStart`.
    let unsubscribe: () => void = () => {};
    return ServerSentEventGenerator.stream(
      (stream) => {
        const subscriber: Subscriber = {
          patch: (html: string) => stream.patchElements(html),
        };
        unsubscribe = subscribe(subscriber);
        // État initial poussé tout de suite — sinon le client garde le HTML
        // SSR du GET initial et ne reçoit rien avant le premier clic.
        subscriber.patch(initialHtml());
      },
      {
        keepalive: true,
        onAbort: () => unsubscribe(),
        onError: () => unsubscribe(),
      },
    );
  });

  return queries;
};
