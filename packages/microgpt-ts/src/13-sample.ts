// ======================================================================
// 13 - Sampling : le modèle rêve des noms qu'il n'a jamais vus
// ======================================================================
// autorégressif : pioche une lettre, réinjecte, repioche
// ① départ : BOS (« début de mot »)
// ② passe avant → scores → softmax → une probabilité par lettre
// ③ tirage au sort selon ces probabilités (pas le plus probable, sinon toujours le même nom)
// ④ BOS tiré = « fin de mot », stop, sinon la lettre gagnée repart en ①
// température, le bouton de créativité : scores divisés par temperature avant softmax
//   0,5 creuse les écarts (sage), 1 ne change rien, au-delà aplatit (audacieux et fautif)
// zéro gradient ici, on ne lit que les .data

import type { Tokenizer } from "./02-tokenizer.ts";
import { div, node, type Node } from "./03-autograd.ts";
import type { StateDict } from "./04-parameters.ts";
import { softmax } from "./07-attention.ts";
import { type Cache, emptyCache, gpt, type ModelConfig } from "./09-model.ts";

/**
 * choose : un indice tiré au sort selon des poids, la roue de la fortune
 * un point lancé sur le total des poids, on regarde dans quelle part il tombe
 * (équivalent de random.choices(range(n), weights))
 *
 *   choose([0.1, 0.7, 0.2], rng) → surtout 1, parfois 2, rarement 0
 */
export const choose = (weights: readonly number[], rng: () => number): number => {
  const total = weights.reduce((s, w) => s + w, 0);
  let r = rng() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i]!;
    if (r < 0) return i;
  }
  return weights.length - 1; // garde-fou contre les arrondis flottants
};

/**
 * sample : génère un nom, lettre par lettre, jusqu'à BOS ou blockSize
 *
 *   sample(model, cfg, tok, rng, 0.5) → "azuré des marais"  (exemple inventé)
 *
 * rng seedé donne une génération reproductible, temperature règle l'audace
 */
export const sample = (
  model: StateDict,
  cfg: ModelConfig,
  tok: Tokenizer,
  rng: () => number,
  temperature: number,
): string => {
  let cache: Cache = emptyCache();
  let tokenId = tok.BOS;
  const produced: number[] = [];

  for (let posId = 0; posId < cfg.blockSize; posId++) {
    const out = gpt(model, cfg, tokenId, posId, cache);
    cache = out.cache;

    // scores divisés par temperature, puis softmax, on lit les .data
    const tempered: Node[] = out.scores.map((s) => div(s, node(temperature)));
    const probs = softmax(tempered).map((p) => p.data);

    tokenId = choose(probs, rng);
    if (tokenId === tok.BOS) break; // fin de mot
    produced.push(tokenId);
  }

  return tok.decode(produced);
};
