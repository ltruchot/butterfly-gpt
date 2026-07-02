// ======================================================================
// 08 - MLP : dépliage → coude → repliage
// ======================================================================
// l'attention rassemble du contexte, le MLP le digère, chaque token pour lui
// - fc1, le dépliage : 16 → 64 nombres, plus de place pour des motifs
// - le coude (ReLU) : les négatifs à 0, on garde ce qui s'allume
// - fc2, le repliage : 64 → 16, les motifs attrapés repartent dans une correction
// sans coude, deux linear d'affilée valent une seule matrice : que des droites
// (microgpt.py:139, fc = fully connected)

import { type Node, relu } from "./03-autograd.ts";
import type { Parameter } from "./04-parameters.ts";
import { linear } from "./07-attention.ts";

/**
 * mlp :  x --fc1--> (4·nEmbd) --relu--> --fc2--> (nEmbd)
 * sortie de la longueur de l'entrée, prête pour le x + mlp(x) du résiduel
 */
export const mlp = (
  x: readonly Node[],
  fc1: readonly Parameter[][],
  fc2: readonly Parameter[][],
): Node[] => {
  const hidden = linear(x, fc1).map((h) => relu(h)); // dépliage + coude
  return linear(hidden, fc2); // repliage vers nEmbd
};
