import { makePubSub } from "../views/pubsub.ts";

// ════════════════════════════════════════════════════════════════════════
// SESSION logarithme — état mono-visiteur + broadcast SSE
// ════════════════════════════════════════════════════════════════════════
// Interlude math avant la loss (étape 10). ln est la fonction RÉCIPROQUE de
// l'exponentielle : ln(x) répond à « à quelle puissance élever e ≈ 2,718
// pour obtenir x ? ». Repères : ln(1) = 0, ln(e) = 1 ; quand x → 0,
// ln(x) → −∞ ; et ln croît de plus en plus lentement. Propriété clé :
// ln(a·b) = ln(a) + ln(b) — le log transforme les produits en sommes.
//
// L'état minimal est UN seul nombre : x (le slider). ln(x) est dérivé.

const DEFAULT_X = 1;
const X_MIN = 0.1;
const X_MAX = 8;

export type SessionSnapshot = {
  readonly x: number; // abscisse courante (0.1..8)
  readonly ln: number; // ln(x), dérivé
};

type SessionState = { x: number };
const empty = (): SessionState => ({ x: DEFAULT_X });

let state: SessionState = empty();

// Borne à [0.1, 8] (le domaine du slider) — jamais x ≤ 0, ln n'y existe pas.
const clampX = (n: number): number => Math.min(X_MAX, Math.max(X_MIN, n));

export const setX = (n: number): void => {
  // Une valeur non numérique (signal absent/corrompu) laisse l'état intact.
  if (Number.isFinite(n)) state = { x: clampX(n) };
};

export const reset = (): void => {
  state = empty();
};

// Canal SSE de la démo — fabrique partagée (Set de subscribers isolé ici).
export const { subscribe, broadcast } = makePubSub();

export const getSnapshot = (): SessionSnapshot => ({ x: state.x, ln: Math.log(state.x) });
