// ======================================================================
// 05 - Embeddings : c'est ici que « z » devient des maths
// ======================================================================
// un id brut ne veut rien dire : l'id 2 n'est pas « deux fois » l'id 1
// - chaque token a sa fiche-vecteur, une ligne de la table tokenEmb (le wte)
//   ces nombres sont des boutons, l'entraînement les remplit
// - trouver la fiche = un accès tableau, d'où « lookup »
// - la position a sa table (positionEmb, le wpe), sans elle « a z u r » = « r u z a »
// - x = tokenEmb[tokenId] + positionEmb[posId] (microgpt.py:109)
//   x porte « quelle lettre » et « à quelle place »

import { add, type Node } from "./03-autograd.ts";
import type { Parameter } from "./04-parameters.ts";

/**
 * lookup : la ligne `index` d'une table d'embedding, on sélectionne, zéro calcul
 * renvoie une copie de la ligne (Nodes partagés) : la table reste intouchable
 */
export const lookup = (table: readonly Parameter[][], index: number): Node[] => {
  const row = table[index];
  if (row === undefined) {
    throw new Error(`lookup: indice ${index} hors de la table (taille ${table.length})`);
  }
  return [...row];
};

/**
 * embed : fiche du token + fiche de sa position, terme à terme
 *
 *   embed(tokenEmb, positionEmb, tokenId, posId) → Node[] de longueur nEmbd
 *
 * chaque composante est un vrai add du graphe, le blâme remonte aux deux tables :
 * c'est comme ça que le modèle apprend à remplir ses fiches
 */
export const embed = (
  tokenEmb: readonly Parameter[][],
  positionEmb: readonly Parameter[][],
  tokenId: number,
  posId: number,
): Node[] => {
  const tok = lookup(tokenEmb, tokenId);
  const pos = lookup(positionEmb, posId);
  return tok.map((t, i) => add(t, pos[i]!));
};
