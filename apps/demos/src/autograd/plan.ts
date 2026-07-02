import { add, type Node, node, mul } from "microgpt-ts";

// ════════════════════════════════════════════════════════════════════════
// PLAN — la séquence d'opérations rejouée pas à pas dans la démo
// ════════════════════════════════════════════════════════════════════════
// On reproduit FIDÈLEMENT 2 opérations exactes de microgpt, isolées sur
// une seule dimension d'embedding pour rester lisible :
//
//   1. Combinaison token + position (gpt() ligne canonique de Karpathy) :
//        x = [t + p for t, p in zip(tok_emb, pos_emb)]
//   2. Projection finale `lm_head` (matrice-vecteur SANS biais — microgpt
//      utilise `n_bias = 0`) :
//        logit = linear(x, lm_head)
//
// Donc notre neurone-jouet :
//   • tok_emb = wte[token_courant][0]   (1 coord. d'embedding du token)
//   • pos_emb = wpe[position][0]        (1 coord. d'embedding de la position)
//   • x       = tok_emb + pos_emb       (= addition micrograd canonique)
//   • w       = lm_head[candidat][0]    (1 coefficient de la projection)
//   • L       = w · x                   (1 score brut pour 1 candidat)
//
// Aucun biais inventé. Les 2 primitives autograd utilisées (`add`, `mul`)
// sont littéralement celles que microgpt invoque ici.
//
// Chaque step `forward` ajoute UN nœud au graphe ; chaque step `backward`
// propage le gradient d'UN arc.

export type ForwardOp =
  | { readonly kind: "node"; readonly name: string; readonly data: number }
  | {
      readonly kind: "add" | "mul";
      readonly name: string;
      readonly refs: readonly [string, string];
    };

export const PLAN: readonly ForwardOp[] = [
  { kind: "node", name: "tok_emb", data: 2 }, //  wte["a"][0]
  { kind: "node", name: "pos_emb", data: -3 }, // wpe[0][0]
  { kind: "add", name: "x", refs: ["tok_emb", "pos_emb"] }, // = -1
  { kind: "node", name: "w", data: -4 }, //          lm_head[k][0]
  { kind: "mul", name: "L", refs: ["w", "x"] }, //  = 4
];

export type PrecomputedGraph = {
  readonly nodes: ReadonlyMap<string, Node>;
  readonly orderedNodes: readonly Node[]; // dans l'ordre d'apparition forward
  readonly root: Node;
  readonly labels: ReadonlyMap<Node, string>;
};

// Construit le graphe complet à partir du plan en respectant l'ordre des
// opérations. Renvoie aussi les labels (clé : référence Node, valeur :
// nom symbolique du plan) pour `logValue`.
export const precompute = (plan: readonly ForwardOp[]): PrecomputedGraph => {
  const byName = new Map<string, Node>();
  const ordered: Node[] = [];
  const labels = new Map<Node, string>();

  for (const op of plan) {
    let n: Node;
    switch (op.kind) {
      case "node":
        n = node(op.data);
        break;
      case "add":
        n = add(getOrThrow(byName, op.refs[0]), getOrThrow(byName, op.refs[1]));
        break;
      case "mul":
        n = mul(getOrThrow(byName, op.refs[0]), getOrThrow(byName, op.refs[1]));
        break;
    }
    byName.set(op.name, n);
    ordered.push(n);
    labels.set(n, op.name);
  }

  const last = ordered.at(-1);
  if (!last) throw new Error("PLAN is empty");

  return { nodes: byName, orderedNodes: ordered, root: last, labels };
};

const getOrThrow = (m: Map<string, Node>, k: string): Node => {
  const v = m.get(k);
  if (!v) throw new Error(`Plan references unknown node "${k}"`);
  return v;
};
