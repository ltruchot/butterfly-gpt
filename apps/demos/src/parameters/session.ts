import {
  flattenParams,
  randomSeed,
  matrix,
  type Node,
  type Parameter,
  type StateDict,
  step,
} from "microgpt-ts";
import { makePubSub } from "../views/pubsub.ts";

// ════════════════════════════════════════════════════════════════════════
// SESSION parameters — état mono-visiteur + broadcast SSE
// ════════════════════════════════════════════════════════════════════════
// Cinq phases :
//   initial      — state_dict annoncé, rien d'instancié
//   initialized  — 2 matrices tirées au gaussien (tokenEmb 4×2, outputProj 2×4)
//   flattened    — les 16 paramètres alignés en une seule liste
//   backward     — chaque paramètre reçoit un gradient (factice mais reproductible)
//   stepped      — un step de SGD (data ← data - lr·grad) ; 4 cellules surlignées
//
// `/next` avance d'une phase, `/reset` revient à `initial`.

export type Phase = "initial" | "initialized" | "flattened" | "backward" | "stepped";

export const INIT_SEED = 42;
export const GRAD_SEED = 7; // pour fabriquer des grads pédagogiques
export const LR = 0.1;
export const HIGHLIGHT_INDICES: readonly number[] = [0, 4, 8, 12];

const TOKEN_EMB_SHAPE = { nout: 4, nin: 2 } as const;
const OUTPUT_PROJ_SHAPE = { nout: 2, nin: 4 } as const;

export type SessionSnapshot = {
  readonly phase: Phase;
  readonly stateDict: StateDict | null; // null avant `initialized`
  readonly flat: readonly Parameter[]; // [] avant `flattened`
  readonly grads: ReadonlyMap<Node, number>; // vide avant `backward`
  readonly nextStateDict: StateDict | null; // null avant `stepped`
  readonly highlightIndices: readonly number[]; // index dans `flat` à mettre en avant
  readonly lr: number;
  readonly tokenEmbShape: { nout: number; nin: number };
  readonly outputProjShape: { nout: number; nin: number };
};

type SessionState = {
  phase: Phase;
  stateDict: StateDict | null;
  flat: readonly Parameter[];
  grads: ReadonlyMap<Node, number>;
  nextStateDict: StateDict | null;
};

const empty = (): SessionState => ({
  phase: "initial",
  stateDict: null,
  flat: [],
  grads: new Map(),
  nextStateDict: null,
});

let state: SessionState = empty();

const initStateDict = (): StateDict => {
  const rng = randomSeed(INIT_SEED);
  return {
    tokenEmb: matrix(rng, TOKEN_EMB_SHAPE.nout, TOKEN_EMB_SHAPE.nin),
    outputProj: matrix(rng, OUTPUT_PROJ_SHAPE.nout, OUTPUT_PROJ_SHAPE.nin),
  };
};

const fakeGrads = (flat: readonly Parameter[]): ReadonlyMap<Node, number> => {
  // Gradients pédagogiques : valeurs déterministes dans [-1, +1[, dérivées
  // d'une seconde graine. Pas issus d'un vrai backward — c'est l'étape
  // précédente (03-autograd) qui montre la mécanique réelle.
  // On les pose sur `p.grad` (ce que lit `step`, comme après un vrai backward)
  // ET on en renvoie une Map, que la vue utilise pour afficher chaque ∂.
  const rng = randomSeed(GRAD_SEED);
  const m = new Map<Node, number>();
  for (const p of flat) {
    const g = rng() * 2 - 1;
    p.grad = g;
    m.set(p, g);
  }
  return m;
};

const snapshot = (): SessionSnapshot => ({
  phase: state.phase,
  stateDict: state.stateDict,
  flat: state.flat,
  grads: state.grads,
  nextStateDict: state.nextStateDict,
  highlightIndices: HIGHLIGHT_INDICES,
  lr: LR,
  tokenEmbShape: TOKEN_EMB_SHAPE,
  outputProjShape: OUTPUT_PROJ_SHAPE,
});

const PHASE_ORDER: readonly Phase[] = [
  "initial",
  "initialized",
  "flattened",
  "backward",
  "stepped",
];

export const advance = (): void => {
  const i = PHASE_ORDER.indexOf(state.phase);
  if (i < 0 || i >= PHASE_ORDER.length - 1) return;
  const nextPhase = PHASE_ORDER[i + 1]!;
  if (nextPhase === "initialized") {
    const sd = initStateDict();
    state = { ...state, phase: nextPhase, stateDict: sd };
    return;
  }
  if (nextPhase === "flattened") {
    state = { ...state, phase: nextPhase, flat: flattenParams(state.stateDict!) };
    return;
  }
  if (nextPhase === "backward") {
    state = { ...state, phase: nextPhase, grads: fakeGrads(state.flat) };
    return;
  }
  if (nextPhase === "stepped") {
    state = {
      ...state,
      phase: nextPhase,
      nextStateDict: step(state.stateDict!, LR),
    };
    return;
  }
};

export const reset = (): void => {
  state = empty();
};

// Canal SSE de la démo — fabrique partagée (Set de subscribers isolé ici).
export const { subscribe, broadcast } = makePubSub();

export const getSnapshot = (): SessionSnapshot => snapshot();
