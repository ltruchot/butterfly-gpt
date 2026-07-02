// ======================================================================
// 06 - RMSNorm : remettre le volume du vecteur autour de ~1
// ======================================================================
// additions et multiplications répétées font dériver la taille des nombres
// (trop gros : instable, trop petits : plus rien n'apprend)
// un bouton de volume : la direction ne change pas, le niveau si
// RMS = √(moyenne des carrés), un -3 compte autant qu'un +3
// recette (microgpt.py:103) : scale = 1/√(ms + ε), chaque composante × scale
// le petit ε évite la division par zéro

import { add, div, node, mul, type Node, pow } from "./03-autograd.ts";

/** sécurité contre la division par zéro (microgpt.py) */
export const RMSNORM_EPS = 1e-5;

/**
 * rmsnorm : même longueur, même direction, volume régulé
 *
 *   rmsnorm([x0, x1, …]) → [x0·s, x1·s, …]  avec  s = 1/√(ms + ε)
 *
 * scale est calculé une fois et partagé par toutes les composantes,
 * le blâme de chaque sortie tient donc compte de toutes les entrées
 */
export const rmsnorm = (x: readonly Node[]): Node[] => {
  const n = x.length;
  if (n === 0) return [];

  // somme des carrés : x0² + x1² + …
  let sumSquares: Node = node(0);
  for (const xi of x) sumSquares = add(sumSquares, pow(xi, 2));

  // moyenne des carrés, puis facteur d'échelle 1/√(ms + ε)
  const meanSquare = mul(sumSquares, node(1 / n));
  const denom = pow(add(meanSquare, node(RMSNORM_EPS)), 0.5); // = √(ms + ε)
  const scale = div(node(1), denom);

  // chaque composante par le même facteur : direction préservée
  return x.map((xi) => mul(xi, scale));
};
