import { node, RMSNORM_EPS, rmsnorm } from "microgpt-ts";
import { makePubSub } from "../views/pubsub.ts";

// ════════════════════════════════════════════════════════════════════════
// SESSION rmsnorm — état mono-visiteur + broadcast SSE
// ════════════════════════════════════════════════════════════════════════
// On part d'un vecteur volontairement « déséquilibré » (grandes et petites
// valeurs) et on déroule la recette RMSNorm en 4 phases :
//   initial    — le vecteur d'entrée, tel quel
//   squares    — on élève chaque composante au carré (xᵢ²)
//   scale      — on calcule ms = moyenne(xᵢ²) puis scale = 1/√(ms+ε)
//   normalized — on multiplie chaque xᵢ par scale → vecteur régulé
// `/next` avance, `/reset` revient à `initial`. Tout est déterministe.

// Vecteur d'entrée didactique (nEmbd réduit à 6). Mélange de grandes et
// petites magnitudes pour que la mise à l'échelle soit bien visible.
const INPUT: readonly number[] = [3, -4, 1, -1, 2, -2];

export type Phase = "initial" | "squares" | "scale" | "normalized";

export type SessionSnapshot = {
  readonly phase: Phase;
  readonly input: readonly number[];
  readonly squares: readonly number[];
  readonly meanSquare: number;
  readonly eps: number;
  readonly scale: number;
  readonly output: readonly number[];
};

type SessionState = { phase: Phase };
const empty = (): SessionState => ({ phase: "initial" });

let state: SessionState = empty();

// Pré-calculs (purs). La sortie passe par le VRAI rmsnorm de microgpt-ts.
const SQUARES = INPUT.map((x) => x * x);
const MS = SQUARES.reduce((s, x) => s + x, 0) / INPUT.length;
const SCALE = 1 / Math.sqrt(MS + RMSNORM_EPS);
const OUTPUT = rmsnorm(INPUT.map((x) => node(x))).map((n) => n.data);

const snapshot = (): SessionSnapshot => ({
  phase: state.phase,
  input: INPUT,
  squares: SQUARES,
  meanSquare: MS,
  eps: RMSNORM_EPS,
  scale: SCALE,
  output: OUTPUT,
});

const ORDER: readonly Phase[] = ["initial", "squares", "scale", "normalized"];

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
