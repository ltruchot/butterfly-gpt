import { crossEntropy, node, softmax } from "microgpt-ts";
import { makePubSub } from "../views/pubsub.ts";

// ════════════════════════════════════════════════════════════════════════
// SESSION loss — état mono-visiteur + broadcast SSE
// ════════════════════════════════════════════════════════════════════════
// Mise en situation : le modèle vient de lire « azu » et doit prédire la
// lettre suivante. La vraie réponse est « r » (azur). On déroule :
//   probs   — softmax(scores) : les scores bruts deviennent des probabilités
//   target  — on isole la probabilité de la BONNE lettre (« r »)
//   loss    — coût = -log(proba de la bonne lettre)
// `/next` avance, `/reset` revient à `initial`. Déterministe.

const CONTEXT = "azu";
const CANDIDATES: readonly string[] = ["a", "r", "i", "e", "s"];
// Scores bruts (les « logits » chez Karpathy) sortis (fictivement) par le
// modèle. Ici « r » domine → scénario « sûr et correct » → loss faible.
const SCORES: readonly number[] = [1.2, 2.5, 0.3, 0.8, -0.4];
const TARGET_INDEX = 1; // « r »

export type Phase = "initial" | "probs" | "target" | "loss";

export type SessionSnapshot = {
  readonly phase: Phase;
  readonly context: string;
  readonly candidates: readonly string[];
  readonly scores: readonly number[];
  readonly probs: readonly number[];
  readonly targetIndex: number;
  readonly loss: number;
};

type SessionState = { phase: Phase };
const empty = (): SessionState => ({ phase: "initial" });

let state: SessionState = empty();

// Pré-calculs purs via les vraies fonctions de microgpt-ts.
const NODES = SCORES.map((v) => node(v));
const PROBS = softmax(NODES).map((n) => n.data);
const LOSS = crossEntropy(NODES, TARGET_INDEX).data;

const snapshot = (): SessionSnapshot => ({
  phase: state.phase,
  context: CONTEXT,
  candidates: CANDIDATES,
  scores: SCORES,
  probs: PROBS,
  targetIndex: TARGET_INDEX,
  loss: LOSS,
});

const ORDER: readonly Phase[] = ["initial", "probs", "target", "loss"];

export const advance = (): void => {
  const i = ORDER.indexOf(state.phase);
  if (i >= 0 && i < ORDER.length - 1) state = { phase: ORDER[i + 1]! };
};

export const reset = (): void => {
  state = empty();
};

// Canal SSE de la démo — fabrique partagée (Set de subscribers isolé ici).
export const { subscribe, broadcast } = makePubSub();

export const getSnapshot = (): SessionSnapshot => snapshot();
