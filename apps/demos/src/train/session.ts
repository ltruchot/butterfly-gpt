import {
  adamStep,
  type AdamState,
  flattenParams,
  getAllDocs,
  initAdam,
  initModel,
  makeAdamConfig,
  makeConfig,
  makeTokenizer,
  randomSeed,
  type StateDict,
  tokenize,
  trainStep,
} from "microgpt-ts";
import { demoDocs } from "../dataset/sample.ts";
import { makePubSub } from "../views/pubsub.ts";

const tok = makeTokenizer(getAllDocs());
const { vocabSize } = tok;

// ════════════════════════════════════════════════════════════════════════
// SESSION train — entraînement EN LIVE, diffusé pas à pas par SSE
// ════════════════════════════════════════════════════════════════════════
// La section « Training loop » : on lance un vrai entraînement et on POUSSE la
// loss après CHAQUE pas via le flux SSE déjà ouvert. La courbe se trace en
// direct dans le navigateur — c'est l'intérêt du SSE : un traitement long côté
// serveur qui informe le client au fil de l'eau.
//
// Boucle ASYNCHRONE : on rend la main à la boucle d'événements (`await yield`)
// entre deux pas, sinon le calcul (synchrone) bloquerait l'envoi des morphs.
// Modèle réduit (nEmbd=8) + petit corpus pour tenir en quelques secondes.

const N_EMBD = 8;
const NUM_STEPS = 150;
const SEED = 42;
const cfg = makeConfig(vocabSize, { nEmbd: N_EMBD, nHead: 2, blockSize: 16 });
const adamCfg = makeAdamConfig(NUM_STEPS);
const corpus = demoDocs.slice(0, 32); // 32 noms de papillons, pour aller vite

export type Phase = "idle" | "running" | "done";

export type SessionSnapshot = {
  readonly phase: Phase;
  readonly step: number; // pas courant (0..NUM_STEPS)
  readonly numSteps: number;
  readonly losses: readonly number[]; // loss brute par pas
  readonly ema: readonly number[]; // moyenne lissée par pas
  readonly lossRef: number; // repère ln(vocabSize)
};

type SessionState = {
  phase: Phase;
  step: number;
  losses: number[];
  ema: number[];
  runId: number; // pour annuler une boucle en cours sur reset/restart
};

const empty = (): SessionState => ({ phase: "idle", step: 0, losses: [], ema: [], runId: 0 });

let state: SessionState = empty();

const snapshot = (): SessionSnapshot => ({
  phase: state.phase,
  step: state.step,
  numSteps: NUM_STEPS,
  losses: state.losses,
  ema: state.ema,
  lossRef: Math.log(vocabSize),
});

// Rendu injecté par le routeur (évite tout doute de cycle d'import).
let render: (s: SessionSnapshot) => string = () => "";
export const setRenderer = (fn: (s: SessionSnapshot) => string): void => {
  render = fn;
};
const pushAll = (): void => broadcast(render(snapshot()));

const yieldToLoop = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

/** Lance l'entraînement (asynchrone, non bloquant). Idempotent si déjà en cours. */
export const start = async (): Promise<void> => {
  if (state.phase === "running") return;
  const runId = state.runId + 1;
  state = { phase: "running", step: 0, losses: [], ema: [], runId };

  let model: StateDict = initModel(randomSeed(SEED), cfg);
  let opt: AdamState = initAdam(flattenParams(model).length);

  for (let step = 0; step < NUM_STEPS; step++) {
    if (state.runId !== runId) return; // annulé (reset / nouveau run)
    const doc = corpus[step % corpus.length]!;
    const { loss } = trainStep(model, cfg, tokenize(tok, doc));
    const updated = adamStep(model, opt, step, adamCfg);
    model = updated.model;
    opt = updated.opt;

    const prevEma = state.ema[state.ema.length - 1];
    const ema = prevEma === undefined ? loss : 0.9 * prevEma + 0.1 * loss;
    state = {
      ...state,
      step: step + 1,
      losses: [...state.losses, loss],
      ema: [...state.ema, ema],
    };
    pushAll();
    await yieldToLoop();
  }

  if (state.runId === runId) {
    state = { ...state, phase: "done" };
    pushAll();
  }
};

export const reset = (): void => {
  state = { ...empty(), runId: state.runId + 1 };
};

// Canal SSE de la démo — fabrique partagée (Set de subscribers isolé ici).
export const { subscribe, broadcast } = makePubSub();

export const getSnapshot = (): SessionSnapshot => snapshot();
