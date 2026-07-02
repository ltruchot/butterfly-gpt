import {
  adamStep,
  type Cache,
  choose,
  div,
  emptyCache,
  flattenParams,
  getAllDocs,
  gpt,
  initAdam,
  initModel,
  node,
  makeAdamConfig,
  makeConfig,
  makeTokenizer,
  randomSeed,
  softmax,
  type StateDict,
  tokenize,
  trainStep,
} from "microgpt-ts";
import { demoDocs } from "../dataset/sample.ts";
import { makePubSub } from "../views/pubsub.ts";

const tok = makeTokenizer(getAllDocs());
const { BOS, vocabSize, decode } = tok;

// ════════════════════════════════════════════════════════════════════════
// SESSION inference — génération EN LIVE, lettre par lettre (SSE)
// ════════════════════════════════════════════════════════════════════════
// La section « Inference » : autorégressif. On part du token BOS, on prédit la
// lettre suivante, on la tire au sort (softmax + température), on la réinjecte,
// et on recommence — comme une saisie prédictive qui accepte sa propre
// suggestion. Chaque nouvelle lettre est poussée par SSE → le nom apparaît en
// direct.
//
// Le modèle est entraîné UNE fois (mémoïsé) au premier « Générer » — sinon il
// cracherait n'importe quoi. Modèle réduit pour préparer en ~2 s.

const N_EMBD = 8;
const PREP_STEPS = 120;
const TEMPERATURE = 0.5;
const cfg = makeConfig(vocabSize, { nEmbd: N_EMBD, nHead: 2, blockSize: 16 });
const adamCfg = makeAdamConfig(PREP_STEPS);
const corpus = demoDocs.slice(0, 32);

let trainedModel: StateDict | null = null; // mémoïsé entre générations

export type Phase = "idle" | "preparing" | "generating" | "done";

export type SessionSnapshot = {
  readonly phase: Phase;
  readonly text: string; // nom en cours de génération
  readonly temperature: number;
  readonly prepared: boolean;
};

type SessionState = { phase: Phase; text: string; runId: number; gen: number };
const empty = (): SessionState => ({ phase: "idle", text: "", runId: 0, gen: 0 });

let state: SessionState = empty();

const snapshot = (): SessionSnapshot => ({
  phase: state.phase,
  text: state.text,
  temperature: TEMPERATURE,
  prepared: trainedModel !== null,
});

let render: (s: SessionSnapshot) => string = () => "";
export const setRenderer = (fn: (s: SessionSnapshot) => string): void => {
  render = fn;
};
const pushAll = (): void => broadcast(render(snapshot()));

const yieldToLoop = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

// Entraînement express (bloquant, une seule fois) pour avoir un modèle crédible.
const trainOnce = (): StateDict => {
  let model = initModel(randomSeed(42), cfg);
  let opt = initAdam(flattenParams(model).length);
  for (let step = 0; step < PREP_STEPS; step++) {
    trainStep(model, cfg, tokenize(tok, corpus[step % corpus.length]!)); // remplit les .grad
    const u = adamStep(model, opt, step, adamCfg);
    model = u.model;
    opt = u.opt;
  }
  return model;
};

/** Génère un nom, lettre par lettre, en streamant par SSE. Non bloquant. */
export const generate = async (): Promise<void> => {
  if (state.phase === "preparing" || state.phase === "generating") return;
  const runId = state.runId + 1;
  const gen = state.gen + 1;

  if (trainedModel === null) {
    state = { phase: "preparing", text: "", runId, gen };
    pushAll();
    await yieldToLoop(); // laisse partir le message « préparation »
    trainedModel = trainOnce();
    // Seul endroit où un runId concurrent a pu apparaître : un /reset arrivé
    // PENDANT l'entraînement bloquant ci-dessus. (Cette garde vivait avant
    // après le if — elle comparait alors l'ancien state.runId au nouveau et
    // tuait toute génération après la première.)
    if (state.runId !== runId) return;
  }

  state = { phase: "generating", text: "", runId, gen };
  pushAll();

  // RNG seedé mais varié à chaque génération → un nouveau nom à chaque clic.
  const rng = randomSeed(1000 + gen);
  let cache: Cache = emptyCache();
  let tokenId = BOS;
  const produced: number[] = [];

  for (let posId = 0; posId < cfg.blockSize; posId++) {
    if (state.runId !== runId) return;
    const out = gpt(trainedModel, cfg, tokenId, posId, cache);
    cache = out.cache;
    const probs = softmax(out.scores.map((s) => div(s, node(TEMPERATURE)))).map((n) => n.data);
    tokenId = choose(probs, rng);
    if (tokenId === BOS) break;
    produced.push(tokenId);
    state = { ...state, text: decode(produced) };
    pushAll();
    await yieldToLoop();
  }

  if (state.runId === runId) {
    state = { ...state, phase: "done" };
    pushAll();
  }
};

export const reset = (): void => {
  // On garde le modèle entraîné (mémoïsé) ; on remet juste l'affichage à zéro.
  state = { phase: "idle", text: "", runId: state.runId + 1, gen: state.gen };
};

// Canal SSE de la démo — fabrique partagée (Set de subscribers isolé ici).
export const { subscribe, broadcast } = makePubSub();

export const getSnapshot = (): SessionSnapshot => snapshot();
