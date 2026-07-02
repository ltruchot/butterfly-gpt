// ═══════════════════════════════════════════════════════════════════════════
// Logique data du nuage de paramètres 3D : construire un VRAI state_dict et en
// extraire les valeurs, regroupées par famille de matrice. Zéro Three.js ici.
// ═══════════════════════════════════════════════════════════════════════════
// POURQUOI : on veut montrer « 4192 nombres tirés au hasard ». On bâtit le modèle
// exact de Karpathy (vocab 27, contexte 16) et on lit chaque valeur. La famille
// (embeddings / attention / mlp / sortie) sert à colorer les points. On isole ce
// calcul (pur, déterministe par graine) pour le tester sans navigateur ni WebGL.
import { initModel, makeConfig } from "microgpt-ts/model";
import { randomSeed } from "microgpt-ts/parameters";

export type Fam = "emb" | "attn" | "mlp" | "out";

// À quelle famille appartient une matrice, d'après son nom (clé du state_dict).
export const famOf = (key: string): Fam =>
  key.startsWith("attn")
    ? "attn"
    : key.startsWith("mlp")
      ? "mlp"
      : key === "outputProj"
        ? "out"
        : "emb";

// Couleur (hex) par famille — mêmes teintes que la charte / l'architecture.
export const FAM_COLOR: Record<Fam, number> = {
  emb: 0x0f5e5a,
  attn: 0xb5223a,
  mlp: 0xe8a33d,
  out: 0x2b3a42,
};

// Centres des amas quand on « groupe par rôle » (écart CC).
export const CC = 5;
export const FAM_CENTER: Record<Fam, readonly [number, number, number]> = {
  emb: [-CC, CC * 0.4, 0],
  attn: [CC, CC * 0.4, 0],
  mlp: [0, -CC * 0.6, CC],
  out: [0, -CC * 0.6, -CC],
};

export const SCALE = 22; // valeurs ~ N(0, 0.08) → ×22 ≈ boule de rayon ~6

// Construit le state_dict pour une graine et regroupe toutes les valeurs par
// famille. Renvoie aussi le total (= nombre de paramètres du modèle).
export const collect = (seedVal: number): { byFam: Record<Fam, number[]>; total: number } => {
  const cfg = makeConfig(27, { blockSize: 16 }); // config Karpathy exacte → 4192 params
  const sd = initModel(randomSeed(seedVal), cfg);
  const byFam: Record<Fam, number[]> = { emb: [], attn: [], mlp: [], out: [] };
  let total = 0;
  for (const key of Object.keys(sd)) {
    const fam = famOf(key);
    for (const row of sd[key]!)
      for (const cell of row) {
        byFam[fam].push(cell.data);
        total++;
      }
  }
  return { byFam, total };
};
