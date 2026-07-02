import { cleanCollected, RAW_COLLECTED } from "./sources.ts";
import { demoDocs } from "./sample.ts";
import { makePubSub } from "../views/pubsub.ts";

// ════════════════════════════════════════════════════════════════════════
// SESSION dataset — état mono-visiteur in-memory + broadcast SSE
// ════════════════════════════════════════════════════════════════════════
// Quatre phases ordonnées :
//   initial   — rien d'affiché (invite « clique sur Collecter pour démarrer »)
//   collected — RAW_COLLECTED affiché tel quel (bruit + doublons)
//   cleaned   — RAW_COLLECTED passé au filtre trim/lower/dedup
//   shuffled  — `demoDocs` (les 500 premiers du corpus mélangé seedé)
//
// Chaque transition est déclenchée par UN endpoint POST dédié (cf.
// `commands.ts`). Reset ramène à `initial`.

export type Phase = "initial" | "collected" | "cleaned" | "shuffled";

export type SessionSnapshot = {
  readonly phase: Phase;
  readonly rawCount: number; // taille de l'échantillon brut affiché
  readonly cleanedCount: number; // après dédup/trim/lower
  readonly shuffledCount: number; // = demoDocs.length (=500)
  readonly visible: readonly string[]; // entrées à afficher dans le <pre>
};

type SessionState = { phase: Phase };

const buildInitialState = (): SessionState => ({ phase: "initial" });

let state: SessionState = buildInitialState();

const CLEANED = cleanCollected(RAW_COLLECTED);

const visibleFor = (phase: Phase): readonly string[] => {
  if (phase === "initial") return [];
  if (phase === "collected") return RAW_COLLECTED;
  if (phase === "cleaned") return CLEANED;
  // shuffled : on n'affiche que les 50 premières pour rester lisible,
  // mais le compteur indique la vraie taille (500).
  return demoDocs.slice(0, 50);
};

const snapshot = (): SessionSnapshot => ({
  phase: state.phase,
  rawCount: RAW_COLLECTED.length,
  cleanedCount: CLEANED.length,
  shuffledCount: demoDocs.length,
  visible: visibleFor(state.phase),
});

// ── Transitions ────────────────────────────────────────────────────────

export const collect = (): void => {
  if (state.phase === "initial") state = { phase: "collected" };
};

export const clean = (): void => {
  if (state.phase === "collected") state = { phase: "cleaned" };
};

export const shuffle = (): void => {
  if (state.phase === "cleaned") state = { phase: "shuffled" };
};

export const reset = (): void => {
  state = buildInitialState();
};

// ── Pub/sub ────────────────────────────────────────────────────────────

// Canal SSE de la démo — fabrique partagée (Set de subscribers isolé ici).
export const { subscribe, broadcast } = makePubSub();

export const getSnapshot = (): SessionSnapshot => snapshot();
