// ════════════════════════════════════════════════════════════════════════
// PUB/SUB partagé — le canal de diffusion SSE de CHAQUE démo
// ════════════════════════════════════════════════════════════════════════
// Pourquoi une fabrique ? Les 12 démos utilisaient le même trio
// Subscriber/subscribe/broadcast copié-collé. On le centralise ici :
// chaque session appelle `makePubSub()` et obtient SON propre Set de
// subscribers (état isolé par démo, comme avant).

export type Subscriber = {
  readonly patch: (html: string) => void;
};

export type PubSub = {
  readonly subscribe: (s: Subscriber) => () => void;
  readonly broadcast: (html: string) => void;
};

export const makePubSub = (): PubSub => {
  const subscribers = new Set<Subscriber>();
  return {
    // S'abonner rend une fonction de désabonnement (à appeler sur abort SSE).
    subscribe: (s: Subscriber): (() => void) => {
      subscribers.add(s);
      return () => subscribers.delete(s);
    },
    // Robustesse : si un subscriber a son flux déjà fermé (client parti
    // sans onAbort, race condition…), on l'écarte au lieu de planter toute
    // la boucle. On snapshot avant via Array.from pour pouvoir delete
    // pendant l'itération sans bug d'iterator.
    broadcast: (html: string): void => {
      for (const s of Array.from(subscribers)) {
        try {
          s.patch(html);
        } catch {
          subscribers.delete(s);
        }
      }
    },
  };
};
