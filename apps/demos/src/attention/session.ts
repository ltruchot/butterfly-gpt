import { attention, dot, node, softmax } from "microgpt-ts";
import { makePubSub } from "../views/pubsub.ts";

// ════════════════════════════════════════════════════════════════════════
// SESSION attention — état mono-visiteur + broadcast SSE
// ════════════════════════════════════════════════════════════════════════
// Mise en situation (1 tête, headDim=4) : le modèle a lu « azur ». Le token
// courant émet une REQUÊTE q et regarde les 4 positions passées (a, z, u, r),
// chacune offrant une CLÉ k et une VALEUR v. On déroule :
//   scores  — affinité q·k de chaque position, mise à l'échelle /√d
//   weights — softmax(scores) : des poids positifs qui somment à 1
//   output  — somme des valeurs pondérées par ces poids
// Vecteurs choisis pour que « u » ressorte nettement (pédagogie), mais tous
// les calculs passent par les vraies fonctions dot / softmax / attention.

const HEAD_DIM = 4;
const LETTERS: readonly string[] = ["a", "z", "u", "r"];

// Requête du token courant.
const Q: readonly number[] = [1, 0, 1, 0];
// Clés par position : k_u = [1,0,1,0] est aligné sur q → forte affinité.
const KEYS: readonly (readonly number[])[] = [
  [1, 0, 0, 0], // a
  [0, 1, 0, 1], // z
  [1, 0, 1, 0], // u  ← aligné avec q
  [0, 0, 1, 1], // r
];
// Valeurs par position (vecteurs « one-hot » lisibles).
const VALUES: readonly (readonly number[])[] = [
  [2, 0, 0, 0], // a
  [0, 2, 0, 0], // z
  [0, 0, 2, 0], // u
  [0, 0, 0, 2], // r
];

export type Phase = "initial" | "scores" | "weights" | "output";

export type SessionSnapshot = {
  readonly phase: Phase;
  readonly headDim: number;
  readonly letters: readonly string[];
  readonly q: readonly number[];
  readonly keys: readonly (readonly number[])[];
  readonly values: readonly (readonly number[])[];
  readonly scaledScores: readonly number[];
  readonly weights: readonly number[];
  readonly output: readonly number[];
  readonly dominant: number; // index du poids le plus fort
};

type SessionState = { phase: Phase };
const empty = (): SessionState => ({ phase: "initial" });

let state: SessionState = empty();

// Pré-calculs purs (vraies fonctions microgpt-ts).
const qN = Q.map((v) => node(v));
const keyN = KEYS.map((k) => k.map((v) => node(v)));
const valN = VALUES.map((vv) => vv.map((v) => node(v)));
const INV_SQRT = 1 / Math.sqrt(HEAD_DIM);
const SCALED = keyN.map((k) => dot(qN, k).data * INV_SQRT);
const WEIGHTS = softmax(SCALED.map((s) => node(s))).map((n) => n.data);
const OUTPUT = attention(qN, keyN, valN, 1).map((n) => n.data); // 1 tête
const DOMINANT = WEIGHTS.reduce((best, w, i) => (w > WEIGHTS[best]! ? i : best), 0);

const snapshot = (): SessionSnapshot => ({
  phase: state.phase,
  headDim: HEAD_DIM,
  letters: LETTERS,
  q: Q,
  keys: KEYS,
  values: VALUES,
  scaledScores: SCALED,
  weights: WEIGHTS,
  output: OUTPUT,
  dominant: DOMINANT,
});

const ORDER: readonly Phase[] = ["initial", "scores", "weights", "output"];

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
