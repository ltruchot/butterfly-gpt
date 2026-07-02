// ======================================================================
// 09 - Le modèle : toutes les briques câblées en une passe avant
// ======================================================================
// gpt est une fonction pure : (lettre, position, paramètres, cache) → scores
// ① embeddings : fiche du token + fiche de la position, puis rmsnorm
// ② attention : pre-norm, q/k/v, k et v au cache, multi-tête, reprojection, résiduel
// ③ MLP : pre-norm, dépliage → coude → repliage, résiduel
// ④ sortie : outputProj, les 16 nombres de x deviennent vocabSize scores
// résiduel, x = x + bloc(x) : le bloc calcule juste la correction à ajouter,
// on garde x, jamais effacé (voie express du gradient)
// cache K/V : les clés et valeurs des lettres déjà vues,
// le seul mécanisme qui connaît le passé, jamais muté, renvoyé agrandi
// nLayer = 1 comme Karpathy : clés de matrices à plat, empiler = répéter ②③

import { add, type Node } from "./03-autograd.ts";
import { matrix, type StateDict } from "./04-parameters.ts";
import { embed } from "./05-embeddings.ts";
import { rmsnorm } from "./06-rmsnorm.ts";
import { attention, linear } from "./07-attention.ts";
import { mlp } from "./08-mlp.ts";

/** dimensions du modèle, défauts Karpathy sauf blockSize (cf. makeConfig) */
export type ModelConfig = {
  readonly vocabSize: number; // nombre de tokens possibles (chars + BOS)
  readonly nEmbd: number; // taille des vecteurs internes (16)
  readonly blockSize: number; // longueur de contexte maximale (64)
  readonly nHead: number; // nombre de têtes d'attention (4)
  readonly nLayer: number; // nombre de blocs transformer (1)
  readonly std: number; // écart-type d'initialisation gaussienne (0.08)
};

/**
 * makeConfig : la config par défaut pour un vocabSize donné
 * tout Karpathy sauf blockSize 64 : ses prénoms font 16 caractères max,
 * nos papillons montent à 42, avec 16 la moitié du corpus serait tronquée
 * (seule adaptation au dataset)
 */
export const makeConfig = (
  vocabSize: number,
  overrides: Partial<ModelConfig> = {},
): ModelConfig => ({
  vocabSize,
  nEmbd: 16,
  blockSize: 64,
  nHead: 4,
  nLayer: 1,
  std: 0.08,
  ...overrides,
});

/** taille d'une tête d'attention = nEmbd / nHead */
export const headDim = (cfg: ModelConfig): number => cfg.nEmbd / cfg.nHead;

/**
 * initModel : le state_dict complet, chaque matrice en tirages gaussiens
 * ordre des clés fixe : tirage reproductible, flattenParams aligné pour Adam
 *
 *   tokenEmb      : vocabSize × nEmbd   fiche de chaque token       (wte)
 *   positionEmb   : blockSize × nEmbd   fiche de chaque position    (wpe)
 *   attn_wq/wk/wv : nEmbd × nEmbd       projections query/key/value
 *   attn_wo       : nEmbd × nEmbd       recombine ce que les têtes rapportent
 *   mlp_fc1/fc2   : 4·nEmbd × nEmbd et l'inverse, dépliage / repliage
 *   outputProj    : vocabSize × nEmbd   vers les scores             (lm_head)
 */
export const initModel = (rng: () => number, cfg: ModelConfig): StateDict => {
  const { vocabSize, nEmbd, blockSize, std } = cfg;
  const mlpHidden = 4 * nEmbd;
  return {
    tokenEmb: matrix(rng, vocabSize, nEmbd, std),
    positionEmb: matrix(rng, blockSize, nEmbd, std),
    attn_wq: matrix(rng, nEmbd, nEmbd, std),
    attn_wk: matrix(rng, nEmbd, nEmbd, std),
    attn_wv: matrix(rng, nEmbd, nEmbd, std),
    attn_wo: matrix(rng, nEmbd, nEmbd, std),
    mlp_fc1: matrix(rng, mlpHidden, nEmbd, std),
    mlp_fc2: matrix(rng, nEmbd, mlpHidden, std),
    outputProj: matrix(rng, vocabSize, nEmbd, std),
  };
};

/** cache K/V : keys[t] et values[t] produits à la position t, grandit à chaque gpt */
export type Cache = {
  readonly keys: readonly (readonly Node[])[];
  readonly values: readonly (readonly Node[])[];
};

/** cache vide : début d'une nouvelle séquence */
export const emptyCache = (): Cache => ({ keys: [], values: [] });

/** addition de deux vecteurs terme à terme, le + du résiduel */
export const addVec = (a: readonly Node[], b: readonly Node[]): Node[] =>
  a.map((ai, i) => add(ai, b[i]!));

/**
 * gpt : les scores de la position courante + le cache agrandi (microgpt.py:108)
 *
 *   const { scores, cache: next } = gpt(model, cfg, tokenId, posId, cache);
 *
 * scores : toutes les lettres candidates, les grandes valeurs favorites
 * (chez Karpathy : logits, microgpt.py:143)
 * suite : softmax pour des probabilités, crossEntropy pour un coût
 */
export const gpt = (
  model: StateDict,
  cfg: ModelConfig,
  tokenId: number,
  posId: number,
  cache: Cache,
): { readonly scores: Node[]; readonly cache: Cache } => {
  const wte = model.tokenEmb!;
  const wpe = model.positionEmb!;

  // ① embeddings (token + position), puis normalisation d'entrée
  let x: Node[] = embed(wte, wpe, tokenId, posId);
  x = rmsnorm(x);

  // ② attention : pre-norm, q/k/v, cache agrandi, puis résiduel
  const xResidual1 = x; // l'original attend au bord du résiduel
  const xn = rmsnorm(x);
  const q = linear(xn, model.attn_wq!);
  const k = linear(xn, model.attn_wk!);
  const v = linear(xn, model.attn_wv!);
  const keys = [...cache.keys, k];
  const values = [...cache.values, v];
  const xAttn = attention(q, keys, values, cfg.nHead);
  x = addVec(linear(xAttn, model.attn_wo!), xResidual1); // on garde x, on ajoute la correction

  // ③ MLP : pre-norm, dépliage/coude/repliage, résiduel
  const xResidual2 = x;
  x = addVec(mlp(rmsnorm(x), model.mlp_fc1!, model.mlp_fc2!), xResidual2);

  // ④ projection finale : un score par lettre du vocabulaire
  const scores = linear(x, model.outputProj!);

  return { scores, cache: { keys, values } };
};
