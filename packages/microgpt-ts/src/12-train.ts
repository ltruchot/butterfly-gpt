// ======================================================================
// 12 - Entraînement : 5 gestes, répétés 1000 fois
// ======================================================================
// ① prendre un nom de papillon (ils tournent : docs[step % n])
// ② passe avant sur ses lettres : à la position t, deviner tokens[t+1]
// ③ mesurer la loss : cross-entropy de chaque position, moyennée
// ④ passe arrière : backward distribue le blâme à chaque bouton
// ⑤ ajuster : Adam tourne les boutons, le modèle est un peu meilleur
// la loss descend de ~3,8 (le hasard) vers ~2,4 (la « musique » des noms saisie)

import type { Tokenizer } from "./02-tokenizer.ts";
import { add, backward, node, mul, type Node } from "./03-autograd.ts";
import { flattenParams, randomSeed, type StateDict } from "./04-parameters.ts";
import { type Cache, emptyCache, gpt, initModel, type ModelConfig } from "./09-model.ts";
import { crossEntropy } from "./10-loss.ts";
import { type AdamConfig, adamStep, type AdamState, initAdam } from "./11-adam.ts";

/**
 * tokenize : un nom encadré de ses frontières BOS, converti en ids
 *
 *   tokenize(tok, "azur") → [BOS, 1, 26, 21, 18, BOS]
 *
 * (microgpt.py : tokens = [BOS] + [uchars.index(ch) for ch in doc] + [BOS])
 */
export const tokenize = (tok: Tokenizer, doc: string): number[] => [
  tok.BOS,
  ...tok.encode(doc),
  tok.BOS,
];

/**
 * forwardDoc : passe avant sur tout un nom tokenisé, renvoie la loss moyenne (dérivable)
 * n = min(blockSize, tokens.length - 1) : fenêtre respectée, et un token suivant à deviner
 */
export const forwardDoc = (model: StateDict, cfg: ModelConfig, tokens: readonly number[]): Node => {
  const n = Math.min(cfg.blockSize, tokens.length - 1);
  let cache: Cache = emptyCache();
  const losses: Node[] = [];

  for (let posId = 0; posId < n; posId++) {
    const tokenId = tokens[posId]!;
    const targetId = tokens[posId + 1]!;
    const out = gpt(model, cfg, tokenId, posId, cache);
    cache = out.cache;
    losses.push(crossEntropy(out.scores, targetId));
  }

  // moyenne = (1/n) · Σ losses
  let sum: Node = losses[0]!;
  for (let i = 1; i < losses.length; i++) sum = add(sum, losses[i]!);
  return mul(node(1 / n), sum);
};

/**
 * trainStep : un pas complet sur un nom, passe avant puis loss puis passe arrière
 * backward pose le blâme sur les .grad du modèle (effet de bord assumé, façon PyTorch)
 * renvoyé : la valeur de la loss, pour l'affichage
 */
export const trainStep = (
  model: StateDict,
  cfg: ModelConfig,
  tokens: readonly number[],
): { readonly loss: number } => {
  const lossNode = forwardDoc(model, cfg, tokens);
  backward(lossNode); // remplit model[...].grad
  return { loss: lossNode.data };
};

/** options de la boucle d'entraînement */
export type TrainOptions = {
  readonly numSteps: number;
  readonly seed?: number; // graine d'initialisation des poids (défaut 42)
  readonly onStep?: (step: number, loss: number) => void; // rappel d'affichage
};

/**
 * train : la boucle complète, un modèle initialisé puis numSteps fois les 5 gestes
 *
 *   const model = train(docs, tok, cfg, adamCfg, { numSteps: 1000, onStep });
 */
export const train = (
  docs: readonly string[],
  tok: Tokenizer,
  cfg: ModelConfig,
  adamCfg: AdamConfig,
  opts: TrainOptions,
): StateDict => {
  let model = initModel(randomSeed(opts.seed ?? 42), cfg);
  let opt: AdamState = initAdam(flattenParams(model).length);

  for (let step = 0; step < opts.numSteps; step++) {
    const doc = docs[step % docs.length]!;
    const tokens = tokenize(tok, doc);
    const { loss } = trainStep(model, cfg, tokens);
    const updated = adamStep(model, opt, step, adamCfg);
    model = updated.model;
    opt = updated.opt;
    opts.onStep?.(step, loss);
  }

  return model;
};
