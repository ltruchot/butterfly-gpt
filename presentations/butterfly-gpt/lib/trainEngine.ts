// ════════════════════════════════════════════════════════════════════════
// Moteur d'entraînement LIVE (navigateur) — utilisé par pages/8c-train-code.md
// ════════════════════════════════════════════════════════════════════════
// Assemble les VRAIES briques de `microgpt-ts` (sous-exports purs, sans IO) en un
// petit moteur pas-à-pas : un `trainOne()` qui fait un pas complet (forward → loss
// → backward → Adam), et un `generate()` qui échantillonne un nom. La DONNÉE est
// passée en paramètre (le corpus embarqué), jamais lue d'un `fs`. Hyperparamètres
// réduits (nEmbd=8, nHead=2, blockSize=16) → un entraînement tient en quelques
// secondes dans une slide. Mêmes algorithmes que `vp run train`, juste plus petit.
import { flattenParams, randomSeed, type StateDict } from "microgpt-ts/parameters";
import { initModel, makeConfig, type ModelConfig } from "microgpt-ts/model";
import { adamStep, type AdamState, initAdam, makeAdamConfig } from "microgpt-ts/adam";
import { tokenize, trainStep } from "microgpt-ts/train";
import { makeTokenizer, type Tokenizer } from "microgpt-ts/tokenizer";
import { sample } from "microgpt-ts/sample";

export type Engine = {
  readonly cfg: ModelConfig;
  readonly tok: Tokenizer;
  readonly numSteps: number;
  readonly lnVocab: number; // loss de départ « au hasard » = ln(vocabSize)
  step: () => number; // nombre de pas déjà faits
  trainOne: () => number; // fait UN pas, renvoie la loss
  generate: (rng: () => number, temperature: number) => string;
  model: () => StateDict;
};

/** Construit un moteur prêt à entraîner sur `docs` (corpus embarqué). */
export const makeEngine = (docs: readonly string[], numSteps = 150, seed = 42): Engine => {
  const tok = makeTokenizer(docs);
  const cfg = makeConfig(tok.vocabSize, { nEmbd: 8, nHead: 2, blockSize: 16 });
  const adamCfg = makeAdamConfig(numSteps);
  let model = initModel(randomSeed(seed), cfg);
  let opt: AdamState = initAdam(flattenParams(model).length);
  let done = 0;

  return {
    cfg,
    tok,
    numSteps,
    lnVocab: Math.log(tok.vocabSize),
    step: () => done,
    trainOne: () => {
      const doc = docs[done % docs.length]!;
      const { loss } = trainStep(model, cfg, tokenize(tok, doc));
      const r = adamStep(model, opt, done, adamCfg);
      model = r.model;
      opt = r.opt;
      done += 1;
      return loss;
    },
    generate: (rng, temperature) => sample(model, cfg, tok, rng, temperature),
    model: () => model,
  };
};
