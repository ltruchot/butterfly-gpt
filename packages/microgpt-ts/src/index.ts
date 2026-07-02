// ======================================================================
// microgpt-ts : un GPT papillon en treize briques, une par fichier
// ======================================================================
//   01-dataset     : le carburant (charger et mélanger les noms)
//   02-tokenizer   : l'atomiseur (caractère ⇄ id)
//   03-autograd    : le graphe qui espionne les calculs et distribue le blâme
//   04-parameters  : les boutons réglables (state_dict)
//   05-embeddings  : les fiches-vecteurs (token + position)
//   06-rmsnorm     : le volume ramené vers ~1
//   07-attention   : je cherche quoi / où, je trouve quoi (+ dot, linear, softmax)
//   08-mlp         : dépliage → coude → repliage
//   09-model       : la passe avant complète (gpt) + initModel
//   10-loss        : la surprise (cross-entropy)
//   11-adam        : l'optimiseur qui tourne les boutons
//   12-train       : 5 gestes, répétés 1000 fois
//   13-sample      : le modèle rêve de nouveaux noms
//
// Plus un renderer SVG pour les démos (render/logValue) et un runner (microgpt.ts,
// la commande `vp run train`). Les exports suivent l'ordre du cours, volontairement

// 01 - Dataset
export { cleanLines, getAllDocs, loadRawDataset, SEED, randomShuffle } from "./01-dataset.ts";

// 02 - Tokenizer
export type { Tokenizer } from "./02-tokenizer.ts";
export { makeTokenizer } from "./02-tokenizer.ts";

// 03 - Autograd (FP)
export type { Arc, BackwardStep, ComputationGraph, Node } from "./03-autograd.ts";
export {
  add,
  backward,
  backwardSteps,
  div,
  exp,
  log,
  makeTopo,
  mul,
  neg,
  node,
  pow,
  relu,
  sub,
} from "./03-autograd.ts";

// 04 - Parameters
export type { Parameter, StateDict } from "./04-parameters.ts";
export { flattenParams, gaussian, matrix, randomSeed, step } from "./04-parameters.ts";

// 05 - Embeddings
export { embed, lookup } from "./05-embeddings.ts";

// 06 - RMSNorm
export { RMSNORM_EPS, rmsnorm } from "./06-rmsnorm.ts";

// 07 - Attention (dot, linear, softmax, attention multi-tête)
export { attention, dot, linear, softmax } from "./07-attention.ts";

// 08 - MLP
export { mlp } from "./08-mlp.ts";

// 09 - Model (config, init, passe avant)
export type { Cache, ModelConfig } from "./09-model.ts";
export { addVec, emptyCache, gpt, headDim, initModel, makeConfig } from "./09-model.ts";

// 10 - Loss (cross-entropy)
export { crossEntropy } from "./10-loss.ts";

// 11 - Adam
export type { AdamConfig, AdamState } from "./11-adam.ts";
export { adamStep, initAdam, makeAdamConfig } from "./11-adam.ts";

// 12 - Train
export type { TrainOptions } from "./12-train.ts";
export { forwardDoc, tokenize, train, trainStep } from "./12-train.ts";

// 13 - Sample
export { choose, sample } from "./13-sample.ts";

// Renderer SVG
export type { LogValueOptions } from "./render/logValue.ts";
export { logValue } from "./render/logValue.ts";
