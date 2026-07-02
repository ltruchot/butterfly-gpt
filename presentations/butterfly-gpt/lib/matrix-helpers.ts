// ═══════════════════════════════════════════════════════════════════════════
// Les « petites mains » du calcul vecteur/matrice (jumeau NUMÉRIQUE, pédago).
// ═══════════════════════════════════════════════════════════════════════════
// POURQUOI (intuition) : l'attention n'invente rien — elle EMPILE quatre gestes
// d'algèbre minuscules (somme, produit terme à terme, produit scalaire,
// transformation linéaire) plus le softmax. Les montrer une par une, sur des
// nombres calculables de tête, démystifie le bloc le plus intimidant du modèle.
//
// Pourquoi NUMÉRIQUE (et pas des `Node` de l'autograd) : ici on n'apprend pas,
// on COMPREND le calcul. Pas de gradient à porter → de simples `number[]`. C'est
// le pendant lisible des vraies briques du tronc, qui, elles, opèrent sur des
// `Node` : `dot`/`linear`/`softmax` vivent dans `07-attention.ts`, `div` dans
// `03-autograd.ts`. Module local au deck, zéro dépendance.

export type Vec = number[];
export type Mat = number[][];

// somme des cases d'un vecteur → un seul nombre
export const sum = (v: Vec): number => v.reduce((a, b) => a + b, 0);

// produit terme à terme (case par case) de deux vecteurs → un vecteur
export const vecProduct = (a: Vec, b: Vec): Vec => a.map((x, i) => x * b[i]!);

// produit scalaire = on multiplie case par case PUIS on somme → un nombre
export const dot = (a: Vec, b: Vec): number => sum(vecProduct(a, b));

// division (composée chez Karpathy : multiplier par l'inverse) — ici un simple ÷
export const div = (a: number, b: number): number => a / b;

// softmax : des scores quelconques → des probabilités (somme = 1), en accentuant
// le plus grand. On recentre sur le max (stabilité numérique), on exponentie,
// puis on normalise (chaque exp ÷ la somme des exp).
export const softmax = (s: Vec): Vec => {
  const m = Math.max(...s);
  const exps = s.map((x) => Math.exp(x - m));
  const tot = sum(exps);
  return exps.map((e) => div(e, tot));
};

// linear : applique une matrice à un vecteur = un produit scalaire par ligne
export const linear = (v: Vec, mat: Mat): Vec => mat.map((row) => dot(row, v));
