import { type BackwardStep, type Node, backwardSteps, logValue } from "microgpt-ts";
import { PLAN, type PrecomputedGraph, precompute } from "./plan.ts";
import { ICON_ID } from "../views/IconsSprite.tsx";
import { makePubSub } from "../views/pubsub.ts";

// ════════════════════════════════════════════════════════════════════════
// SESSION — état mono-visiteur in-memory + broadcast vers les abonnés SSE
// ════════════════════════════════════════════════════════════════════════
// Une seule session pour tout le serveur (prototype). Chaque clic sur
// « Next » avance d'une étape : d'abord la passe AVANT (un nœud à la
// fois), puis la passe ARRIÈRE (un arc à la fois), puis « done ». Reset
// remet tout à zéro.

export type Phase = "forward" | "backward" | "done";

export type SessionSnapshot = {
  readonly svg: string;
  readonly phaseText: string;
  readonly stepIndex: number;
  readonly totalSteps: number;
  readonly done: boolean;
};

type SessionState = {
  graph: PrecomputedGraph;
  forwardCursor: number; // 0..plan.length ; chaque incrément ajoute un nœud
  bwIter: Iterator<BackwardStep> | null; // créé une fois le forward terminé
  bwCurrent: BackwardStep | null;
  bwCount: number; // nombre de steps `propagate` consommés (pour l'affichage)
  visited: Set<Node>;
  gradPopulated: Set<Node>;
  highlight: Node | null;
  phase: Phase;
};

const totalForwardSteps = PLAN.length;
// nb d'arcs = sum(node.children.length) sur tous les nœuds internes
const totalBackwardSteps = (() => {
  const g = precompute(PLAN);
  let n = 0;
  for (const node of g.orderedNodes) n += node.children.length;
  return n;
})();

const buildInitialState = (): SessionState => {
  const graph = precompute(PLAN);
  return {
    graph,
    forwardCursor: 0,
    bwIter: null,
    bwCurrent: null,
    bwCount: 0,
    visited: new Set(),
    gradPopulated: new Set(),
    highlight: null,
    phase: "forward",
  };
};

let state: SessionState = buildInitialState();

const phaseText = (s: SessionState): string => {
  if (s.phase === "forward") {
    if (s.forwardCursor === 0) return "Prêt — clique sur Next pour commencer la passe avant.";
    const justAdded = s.graph.orderedNodes[s.forwardCursor - 1];
    const name = s.graph.labels.get(justAdded) ?? "?";
    return `Forward [${s.forwardCursor}/${totalForwardSteps}] : création du nœud "${name}" (data = ${justAdded.data}).`;
  }
  if (s.phase === "backward") {
    if (s.bwCurrent?.phase === "init") {
      return `Backward [0/${totalBackwardSteps}] : passe avant terminée. ∂L/∂L = 1. Clique Next pour propager.`;
    }
    if (s.bwCurrent?.phase === "propagate" && s.bwCurrent.justUpdated) {
      const target = s.bwCurrent.justUpdated;
      const name = s.graph.labels.get(target) ?? "?";
      const g = s.bwCurrent.grads.get(target) ?? 0;
      return `Backward [${s.bwCount}/${totalBackwardSteps}] : ∂L/∂${name} += contribution → ${fmtNum(g)}.`;
    }
  }
  return `Terminé. Tous les gradients sont calculés. Reset pour rejouer.`;
};

const fmtNum = (n: number): string => (Number.isInteger(n) ? String(n) : n.toFixed(3));

const renderSvg = (s: SessionState): string =>
  logValue(s.graph.root, {
    labels: s.graph.labels,
    grads: s.bwCurrent?.grads ?? new Map(),
    visitedNodes: s.visited,
    gradPopulatedNodes: s.gradPopulated,
    highlightNode: s.highlight ?? undefined,
    // IDs des symbols inline servis par `<IconsSprite />` dans le layout —
    // importés de la source de vérité plutôt que re-hardcodés ici.
    icons: ICON_ID,
  });

const snapshot = (): SessionSnapshot => {
  const total = totalForwardSteps + totalBackwardSteps + 1; // +1 pour le step "init"
  const stepIndex =
    state.phase === "forward"
      ? state.forwardCursor
      : state.phase === "backward"
        ? totalForwardSteps + (state.bwCount === 0 ? 1 : state.bwCount + 1)
        : total;
  return {
    svg: renderSvg(state),
    phaseText: phaseText(state),
    stepIndex,
    totalSteps: total,
    done: state.phase === "done",
  };
};

// ── Progression ────────────────────────────────────────────────────────

export const advance = (): void => {
  if (state.phase === "forward") {
    if (state.forwardCursor < totalForwardSteps) {
      const newNode = state.graph.orderedNodes[state.forwardCursor];
      state.visited.add(newNode);
      state.highlight = newNode;
      state.forwardCursor += 1;
      if (state.forwardCursor === totalForwardSteps) {
        // Forward terminé → on amorce le générateur de backward, et on
        // consomme tout de suite le step 'init' pour avoir grads.get(root)=1.
        state.bwIter = backwardSteps(state.graph.root);
        const initStep = state.bwIter.next().value as BackwardStep;
        state.bwCurrent = initStep;
        state.gradPopulated.add(state.graph.root);
        state.phase = "backward";
        state.highlight = state.graph.root;
      }
    }
    return;
  }

  if (state.phase === "backward" && state.bwIter) {
    const next = state.bwIter.next();
    if (next.done) {
      state.phase = "done";
      state.highlight = null;
      return;
    }
    const step = next.value;
    state.bwCurrent = step;
    if (step.phase === "propagate" && step.justUpdated) {
      state.gradPopulated.add(step.justUpdated);
      state.highlight = step.justUpdated;
      state.bwCount += 1;
    } else if (step.phase === "done") {
      state.phase = "done";
      state.highlight = null;
    }
  }
};

export const reset = (): void => {
  state = buildInitialState();
};

// ── Pub/sub ────────────────────────────────────────────────────────────

// Canal SSE de la démo — fabrique partagée (Set de subscribers isolé ici).
export const { subscribe, broadcast } = makePubSub();

export const getSnapshot = (): SessionSnapshot => snapshot();
