import { add, backward, div, exp, node, log, logValue, mul, neg, type Node } from "microgpt-ts";
import { ICON_ID } from "../views/IconsSprite.tsx";

// ════════════════════════════════════════════════════════════════════════
// PLAN COMPLET POUR « azur »
// ════════════════════════════════════════════════════════════════════════
// Reproduit FIDÈLEMENT le pipeline microgpt sur un vocabulaire jouet.
// Noms clairs ici (les noms historiques de microgpt sont entre parenthèses) :
//   • tokenEmb     (wte)      : embedding par caractère
//   • positionEmb  (wpe)      : embedding par position dans le nom
//   • outputProj   (lm_head)  : matrice de projection finale vers les scores
//
// Détails du jouet :
//   • Vocabulaire de 4 lettres : { a, r, u, z }  (juste celles d'azur).
//   • Embedding dim D = 2 : chaque lettre devient un vecteur de 2 nombres.
//   • Pas de biais : microgpt utilise `n_bias = 0`.
//   • Pipeline d'une transition (position p, token id source) :
//       1. tok_emb = tokenEmb[token]       (vecteur 2)
//       2. pos_emb = positionEmb[position] (vecteur 2)
//       3. x = tok_emb + pos_emb           (addition élément-par-élément)
//       4. logit[c] = outputProj[c,0]·x[0] + outputProj[c,1]·x[1]  (PAS de + b !)
//       5. softmax(logit) → 4 probabilités
//       6. loss = -log(p[target])          (cross-entropy)
//
// 22 feuilles paramètres (8 tokenEmb + 6 positionEmb + 8 outputProj), ~70
// nœuds intermédiaires. Le graphe est calculé UNE fois au démarrage :
// forward pour remplir tous les `data`, backward pour remplir tous les
// `grad`. Affichage statique.

const VOCAB = ["a", "r", "u", "z"] as const;
type Letter = (typeof VOCAB)[number];
const ID: Record<Letter, number> = { a: 0, r: 1, u: 2, z: 3 };

// ── Paramètres initiaux ──────────────────────────────────────────────
// Valeurs hardcodées (gaussien faible amplitude) pour reproductibilité.
// Hors d'un vrai training run — juste de quoi rendre le calcul concret.
const TOKEN_EMB_INIT: Record<Letter, [number, number]> = {
  a: [0.42, -0.31],
  r: [-0.15, 0.27],
  u: [0.61, -0.08],
  z: [-0.34, 0.51],
};
// 3 positions car on a 3 transitions : a(pos 0), z(pos 1), u(pos 2)
const POSITION_EMB_INIT: ReadonlyArray<readonly [number, number]> = [
  [0.05, -0.12], // position 0
  [0.18, 0.07], // position 1
  [-0.21, 0.33], // position 2
];
const OUTPUT_PROJ_INIT: number[][] = [
  // 4 lignes (candidats) × 2 colonnes (dim d'entrée)
  [0.12, -0.45], // → 'a'
  [0.33, 0.28], // → 'r'
  [-0.22, 0.31], // → 'u'
  [0.17, -0.55], // → 'z'
];

// Transitions à apprendre (token_source → token_cible).
// Position = index dans le mot "azur" (a=0, z=1, u=2, r=3 ; pas de transition pour r).
const TRANSITIONS: Array<{ from: Letter; to: Letter; pos: number }> = [
  { from: "a", to: "z", pos: 0 },
  { from: "z", to: "u", pos: 1 },
  { from: "u", to: "r", pos: 2 },
];

export type AzurGraph = {
  readonly root: Node;
  readonly labels: ReadonlyMap<Node, string>;
};

// Construit le graphe COMPLET pour « azur », calcule data (forward) et
// grads (backward) en une passe. Tout est figé : la vue n'aura qu'à
// rendre ce snapshot statique.
export const buildAzurGraph = (): AzurGraph => {
  const labels = new Map<Node, string>();
  const label = (n: Node, name: string): Node => {
    labels.set(n, name);
    return n;
  };

  // Feuilles paramètres : table d'embedding des tokens (microgpt: `wte`) — 8 nombres
  const tokenEmb: Record<Letter, [Node, Node]> = {
    a: [
      label(node(TOKEN_EMB_INIT.a[0]), "tokenEmb[a][0]"),
      label(node(TOKEN_EMB_INIT.a[1]), "tokenEmb[a][1]"),
    ],
    r: [
      label(node(TOKEN_EMB_INIT.r[0]), "tokenEmb[r][0]"),
      label(node(TOKEN_EMB_INIT.r[1]), "tokenEmb[r][1]"),
    ],
    u: [
      label(node(TOKEN_EMB_INIT.u[0]), "tokenEmb[u][0]"),
      label(node(TOKEN_EMB_INIT.u[1]), "tokenEmb[u][1]"),
    ],
    z: [
      label(node(TOKEN_EMB_INIT.z[0]), "tokenEmb[z][0]"),
      label(node(TOKEN_EMB_INIT.z[1]), "tokenEmb[z][1]"),
    ],
  };

  // Feuilles paramètres : table d'embedding des positions (microgpt: `wpe`) — 6 nombres
  const positionEmb: Node[][] = POSITION_EMB_INIT.map((row, p) =>
    row.map((v, i) => label(node(v), `positionEmb[${p}][${i}]`)),
  );

  // Feuilles paramètres : matrice de projection finale (microgpt: `lm_head`) — 8 nombres.
  // Notation `outputProj[c,i]` : poids contribuant au score du candidat `c` depuis la dim `i`.
  const outputProj: Node[][] = OUTPUT_PROJ_INIT.map((row, j) =>
    row.map((v, i) => label(node(v), `outputProj[${VOCAB[j]},${i}]`)),
  );

  // Forward pour chaque transition
  const lossPerTransition: Node[] = [];
  for (const t of TRANSITIONS) {
    const tag = `${t.from}→${t.to}`;

    // Étape 1+2+3 : x[i] = tokenEmb[from][i] + positionEmb[pos][i]
    const x: Node[] = [];
    for (let i = 0; i < 2; i++) {
      const xi = label(add(tokenEmb[t.from][i], positionEmb[t.pos][i]), `x[${i}]_${tag}`);
      x.push(xi);
    }

    // Étape 4 : score[c] = outputProj[c,0]·x[0] + outputProj[c,1]·x[1]   (PAS de biais)
    const scores: Node[] = [];
    for (let k = 0; k < 4; k++) {
      const c = VOCAB[k];
      const term0 = label(mul(outputProj[k][0], x[0]), `outputProj[${c},0]·x[0]_${tag}`);
      const term1 = label(mul(outputProj[k][1], x[1]), `outputProj[${c},1]·x[1]_${tag}`);
      const scoreK = label(add(term0, term1), `score[${c}]_${tag}`);
      scores.push(scoreK);
    }

    // Étape 5 : softmax — exp / Σexp
    const exps = scores.map((s, k) => label(exp(s), `exp[${VOCAB[k]}]_${tag}`));
    let S = exps[0];
    for (let k = 1; k < 4; k++) {
      S = label(add(S, exps[k]), `Σexp_partial${k}_${tag}`);
    }
    labels.set(S, `Σexp_${tag}`);

    const targetId = ID[t.to];
    const pTarget = label(div(exps[targetId], S), `p[${t.to}]_${tag}`);

    // Étape 6 : cross-entropy = -log(p_target)
    const lossT = label(neg(label(log(pTarget), `log(p)_${tag}`)), `loss_${tag}`);
    lossPerTransition.push(lossT);
  }

  // Perte totale = somme des 3 pertes
  let totalLoss = lossPerTransition[0];
  for (let i = 1; i < lossPerTransition.length; i++) {
    totalLoss = label(
      add(totalLoss, lossPerTransition[i]),
      i === lossPerTransition.length - 1 ? "LOSS" : `loss_partial${i}`,
    );
  }

  backward(totalLoss); // dépose ∂LOSS/∂nœud sur le champ .grad de chaque nœud
  return { root: totalLoss, labels };
};

// Pré-calcul au chargement du module : on n'a besoin de le faire qu'une fois.
export const AZUR_GRAPH: AzurGraph = buildAzurGraph();

// SVG figé du graphe complet (tous nœuds visités, tous gradients populés).
// Calculé une seule fois au chargement du module ; les rendus suivants
// (GET /, SSE patches) le réutilisent sans surcoût.
export const AZUR_SVG: string = logValue(AZUR_GRAPH.root, {
  labels: AZUR_GRAPH.labels,
  // IDs importés de la source de vérité (views/IconsSprite.tsx).
  icons: ICON_ID,
});
