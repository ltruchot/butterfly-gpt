// ======================================================================
// 03 - Autograd : le graphe qui espionne les calculs et distribue le blâme
// ======================================================================
// portage TS fonctionnel du micrograd de Karpathy (classe Value, microgpt.py:30)
// - passe avant : chaque opération est notée dans un graphe de calcul
// - passe arrière : le blâme remonte le graphe, chaque paramètre reçoit sa part
// - 6 primitives de dérivée connue, backward compose (règle de la chaîne)

// --- types ---

/**
 * Arc : flèche du résultat vers un opérande, le sens que la passe arrière suit
 * - target : le nœud opérande
 * - localGradient : ∂(résultat)/∂(target), figé à l'aller
 */
export type Arc = {
  readonly target: Node;
  readonly localGradient: number;
};

/**
 * Node : un nombre qui se souvient d'où il vient (la Value de Karpathy)
 * - data : la valeur calculée à l'aller, figée
 * - grad : le blâme ∂racine/∂nœud, rempli par backward, seul champ mutable
 * - children : arcs vers les opérandes, vide pour une feuille
 * pas de type Graph : type récursif, la racine est le graphe
 */
export type Node = {
  readonly data: number;
  grad: number;
  readonly children: ReadonlyArray<Arc>;
};

/** alias documentaire : un graphe de calcul est sa racine */
export type ComputationGraph = Node;

// --- constructeurs ---

const arc = (target: Node, localGradient: number): Arc => ({ target, localGradient });

/** node : un nombre plongé dans le graphe, une feuille (entrée ou paramètre) */
export const node = (data: number): Node => ({ data, grad: 0, children: [] });

// op : nœud interne, chaque opération apporte ses gradients locaux
const op = (data: number, children: ReadonlyArray<Arc>): Node => ({ data, grad: 0, children });

// --- les 6 primitives ---

/** add : dérivées 1 et 1, le routeur, recopie le blâme tel quel (microgpt.py:39) */
export const add = (a: Node, b: Node): Node => op(a.data + b.data, [arc(a, 1), arc(b, 1)]);

/** mul : dérivées b et a, l'échangeur, la dérivée d'un facteur = l'autre (microgpt.py:43) */
export const mul = (a: Node, b: Node): Node =>
  op(a.data * b.data, [arc(a, b.data), arc(b, a.data)]);

/** pow : aⁿ, exposant constant donc pas dérivé, dérivée n · aⁿ⁻¹ (microgpt.py:47) */
export const pow = (a: Node, n: number): Node => op(a.data ** n, [arc(a, n * a.data ** (n - 1))]);

/** log : ln(a), dérivée 1/a, la « surprise » de la loss (microgpt.py:48) */
export const log = (a: Node): Node => op(Math.log(a.data), [arc(a, 1 / a.data)]);

/** exp : eᵃ, sa propre dérivée, le cœur du softmax (microgpt.py:49) */
export const exp = (a: Node): Node => {
  const e = Math.exp(a.data);
  return op(e, [arc(a, e)]);
};

/**
 * relu : le coude, max(0, a), on garde ce qui s'allume (microgpt.py:50)
 * dérivée 1 si a > 0 sinon 0 : le blâme passe entier ou pas du tout
 */
export const relu = (a: Node): Node => op(Math.max(0, a.data), [arc(a, a.data > 0 ? 1 : 0)]);

// --- opérations dérivées : rien à écrire, tout se compose ---

/** neg : a · (-1) */
export const neg = (a: Node): Node => mul(a, node(-1));

/** sub : a + (-b) */
export const sub = (a: Node, b: Node): Node => add(a, neg(b));

/** div : a · b⁻¹, la règle du quotient émerge toute seule */
export const div = (a: Node, b: Node): Node => mul(a, pow(b, -1));

// --- tri topologique ---

/**
 * makeTopo : chaque nœud rangé après ses dépendances (build_topo, microgpt.py:62)
 * le blâme total d'un nœud attend le reversement de tous ses parents
 * parcours en profondeur, nœud empilé après ses enfants, Set anti-doublons (DAG)
 */
export const makeTopo = (root: Node): readonly Node[] => {
  const topo: Node[] = [];
  const visited = new Set<Node>();
  const visit = (current: Node): void => {
    if (visited.has(current)) return;
    visited.add(current);
    current.children.forEach(({ target }) => visit(target));
    topo.push(current);
  };
  visit(root);
  return topo;
};

// --- backward : la passe arrière ---

/**
 * backward : remplit le .grad de chaque nœud atteignable (microgpt.py:59)
 * - la racine s'accorde l'étincelle : ∂racine/∂racine = 1
 * - chaque nœud, en ordre inverse, reverse à ses enfants :
 *   enfant.grad += localGradient × nœud.grad (× la chaîne, += les chemins s'additionnent)
 * - graphe frais requis : ne pas rappeler backward sur le même graphe (gradients doublés)
 * - ⚠ backwardSteps est quadratique : visualisation seulement, jamais pour entraîner
 */
export const backward = (root: Node): void => {
  const topo = makeTopo(root);

  root.grad = 1;
  for (let i = topo.length - 1; i >= 0; i--) {
    const current = topo[i]!;
    for (const { target, localGradient } of current.children) {
      target.grad += localGradient * current.grad;
    }
  }
};

// --- backwardSteps : la même passe arrière, déroulée clic par clic ---

/**
 * un instantané d'étape, pour la visualisation
 * - init : l'étincelle est posée, rien propagé
 * - propagate : un arc traité, justUpdated a reçu du blâme, currentNode l'a reversé
 * - done : gradients finaux
 */
export type BackwardStep = {
  readonly phase: "init" | "propagate" | "done";
  readonly currentNode: Node;
  readonly justUpdated: Node | null;
  readonly grads: ReadonlyMap<Node, number>;
};

/**
 * backwardSteps : backward en générateur, un yield par arc (démos pas-à-pas)
 * ne touche pas aux .grad : table locale, copie figée à chaque étape,
 * pour voir les gradients se construire
 */
export function* backwardSteps(root: Node): Generator<BackwardStep> {
  const topo = makeTopo(root);

  const grads = new Map<Node, number>([[root, 1]]);
  yield { phase: "init", currentNode: root, justUpdated: null, grads: new Map(grads) };

  for (let i = topo.length - 1; i >= 0; i--) {
    const current = topo[i];
    const nodeGrad = grads.get(current) ?? 0;
    for (const { target, localGradient } of current.children) {
      grads.set(target, (grads.get(target) ?? 0) + localGradient * nodeGrad);
      yield {
        phase: "propagate",
        currentNode: current,
        justUpdated: target,
        grads: new Map(grads),
      };
    }
  }

  yield { phase: "done", currentNode: root, justUpdated: null, grads: new Map(grads) };
}

// --- exemple ---
// z = x·y + x²  en  x = 2, y = 3
//   attendu :  ∂z/∂x = y + 2x = 7      ∂z/∂y = x = 2
//
//   const x = node(2)
//   const y = node(3)
//   const z = add(mul(x, y), pow(x, 2))
//
//   z.data            // 10
//   backward(z)       // remplit les .grad
//   x.grad            // 7
//   y.grad            // 2
