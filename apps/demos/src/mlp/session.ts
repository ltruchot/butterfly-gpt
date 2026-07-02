import { linear, node, matrix, mlp, randomSeed, relu } from "microgpt-ts";
import { makePubSub } from "../views/pubsub.ts";

// ════════════════════════════════════════════════════════════════════════
// SESSION mlp — état mono-visiteur + broadcast SSE
// ════════════════════════════════════════════════════════════════════════
// Le bloc MLP en 3 phases (le « sablier ») :
//   expand   — fc1 projette le vecteur dans un espace PLUS GRAND (4 → 8)
//   relu     — ReLU coupe les valeurs négatives à 0 (la non-linéarité)
//   contract — fc2 reprojette vers la taille d'origine (8 → 4)
// nEmbd=4, hidden=8 (Karpathy : 16 → 64). Tirages seedés → reproductible.

const N_EMBD = 4;
const HIDDEN = 8; // 2× ici pour l'affichage (Karpathy : 4× = 64)
const INPUT: readonly number[] = [1.0, -0.8, 1.2, -0.5];

const rng = randomSeed(7);
// std volontairement large (0.8) pour que la couche cachée ait des valeurs
// franchement positives ET négatives → l'effet « coupe » de ReLU est visible.
const FC1 = matrix(rng, HIDDEN, N_EMBD, 0.8);
const FC2 = matrix(rng, N_EMBD, HIDDEN, 0.8);

export type Phase = "initial" | "expand" | "relu" | "contract";

export type SessionSnapshot = {
  readonly phase: Phase;
  readonly input: readonly number[];
  readonly preRelu: readonly number[]; // couche cachée avant ReLU
  readonly postRelu: readonly number[]; // après ReLU (négatifs → 0)
  readonly dead: readonly boolean[]; // neurones « éteints » par ReLU
  readonly output: readonly number[];
  readonly hidden: number;
};

type SessionState = { phase: Phase };
const empty = (): SessionState => ({ phase: "initial" });

let state: SessionState = empty();

// Pré-calculs purs. On expose les intermédiaires (pré/post ReLU) pour la
// pédagogie ; la sortie passe par le VRAI mlp de microgpt-ts.
const X = INPUT.map((v) => node(v));
const PRE_RELU = linear(X, FC1).map((n) => n.data);
const POST_RELU = linear(X, FC1)
  .map((h) => relu(h))
  .map((n) => n.data);
const DEAD = PRE_RELU.map((v) => v <= 0);
const OUTPUT = mlp(X, FC1, FC2).map((n) => n.data);

const snapshot = (): SessionSnapshot => ({
  phase: state.phase,
  input: INPUT,
  preRelu: PRE_RELU,
  postRelu: POST_RELU,
  dead: DEAD,
  output: OUTPUT,
  hidden: HIDDEN,
});

const ORDER: readonly Phase[] = ["initial", "expand", "relu", "contract"];

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
