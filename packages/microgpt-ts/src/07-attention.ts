// ======================================================================
// 07 - Attention : le token courant va puiser chez les lettres déjà vues
// ======================================================================
// chaque token fabrique trois vecteurs (trois linear, matrices apprises) :
// - query (q) : je cherche quoi ?
// - key   (k) : je cherche où ?
// - value (v) : je trouve quoi ?
// dot(q, k) = affinité, softmax → poids, sortie = somme des values pondérées
// multi-tête : q/k/v en tranches, une par tête, concat à la fin
// causal : seules les lettres déjà vues servent de clés/valeurs (le cache K/V)

import { add, div, exp, node, mul, type Node, sub } from "./03-autograd.ts";
import type { Parameter } from "./04-parameters.ts";

/**
 * dot : produit scalaire, a·b = a0·b0 + a1·b1 + …, l'affinité de deux vecteurs
 * grand positif : même direction, proche de 0 : sans rapport, négatif : opposés
 * somme amorcée à node(0) : chaque mul est un nœud, le blâme remonte vers a et b
 */
export const dot = (a: readonly Node[], b: readonly Node[]): Node => {
  let acc: Node = node(0);
  for (let i = 0; i < a.length; i++) acc = add(acc, mul(a[i]!, b[i]!));
  return acc;
};

/**
 * linear : un vecteur × une matrice de poids, sans biais (microgpt.py:94)
 * chaque ligne de w est un petit détecteur, nout lignes donnent nout sorties
 * embeddings vers q/k/v, MLP, projection finale : tout passe par là
 */
export const linear = (x: readonly Node[], w: readonly Parameter[][]): Node[] =>
  w.map((row) => dot(row, x));

/**
 * softmax : des scores quelconques vers des poids positifs de somme 1
 * (chez Karpathy : logits, microgpt.py:97)
 * exp de chaque score (tout positif, écarts creusés) puis division par la somme
 * stabilité : score max retranché d'abord, résultat identique mais exp n'explose plus
 * (max lu sur les .data : constante de recentrage, sans gradient)
 */
export const softmax = (scores: readonly Node[]): Node[] => {
  if (scores.length === 0) return [];

  const maxVal = Math.max(...scores.map((s) => s.data));
  const exps = scores.map((s) => exp(sub(s, node(maxVal))));

  let total: Node = node(0);
  for (const e of exps) total = add(total, e);
  return exps.map((e) => div(e, total));
};

/**
 * attention : la sortie d'attention de la position courante, par tête :
 * 1. affinités dot(q_h, k_h[t]) / √headDim (sinon scores gonflés, softmax saturé)
 * 2. softmax → poids d'attention
 * 3. sortie = somme des values pondérées
 * puis concat des têtes (microgpt.py : la boucle for h in range(n_head) de gpt)
 */
export const attention = (
  q: readonly Node[],
  keys: readonly (readonly Node[])[],
  values: readonly (readonly Node[])[],
  nHead: number,
): Node[] => {
  const nEmbd = q.length;
  const headDim = nEmbd / nHead;
  const invSqrt = 1 / Math.sqrt(headDim);
  const out: Node[] = [];

  for (let h = 0; h < nHead; h++) {
    const start = h * headDim;
    const end = start + headDim;

    // les tranches de la tête h : sa query, et clés/valeurs de chaque position
    const qH = q.slice(start, end);
    const kH = keys.map((k) => k.slice(start, end));
    const vH = values.map((v) => v.slice(start, end));

    // affinités mises à l'échelle (les attn_logits de microgpt.py:129), puis softmax
    const scores = kH.map((kt) => mul(dot(qH, kt), node(invSqrt)));
    const weights = softmax(scores);

    // somme des values pondérées, composante par composante
    for (let j = 0; j < headDim; j++) {
      let acc: Node = node(0);
      for (let t = 0; t < vH.length; t++) acc = add(acc, mul(weights[t]!, vH[t]![j]!));
      out.push(acc);
    }
  }

  return out;
};
