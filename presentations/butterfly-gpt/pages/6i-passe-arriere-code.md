---
layout: default
---

<script setup>
// THE REAL CODE, EXECUTED — the BACKWARD pass. We start from EXACTLY the data of
// the forward pass (same `build()`), then we TRACE the blame back node by node, in
// REVERSE topo order, showing the CHAIN RULE at each arc:
//   grad(child) = ∂local × grad(parent)   (= the line target.grad += localGradient × node.grad)
// The walk is driven by `backwardSteps` (the step-by-step generator of the core).
import { node, add, mul, backward, backwardSteps, makeTopo } from "microgpt-ts/autograd";
import { logValue } from "microgpt-ts"; // SVG rendering of the graph (graph view)

if (typeof window !== "undefined") {
  // ── Inputs identical to 6e (the « azur » example) ───────────────────────────
  const TOKEN_A = [-0.42, 0.15, 0.7];
  const POS_0 = [0.12, -0.22, 0.4];
  const PROJ = {
    a: [0.2, -0.5, 0.1],
    z: [-0.4, 0.3, 0.25],
    u: [0.5, 0.1, -0.3],
    r: [-0.1, -0.2, 0.6],
  };
  const CANDS = ["a", "z", "u", "r"];
  const TRUE = "z";

  // ── The forward pass (IDENTICAL to 6e), stopped at the SCORES — the backward
  //    pass of this slide is rooted at « score z » (softmax + −ln: slides 7ba / 7h). ──
  const build = () => {
    const tokenA = TOKEN_A.map(node);
    const pos0 = POS_0.map(node);
    const x = tokenA.map((t, k) => add(t, pos0[k]));
    const prod = {};
    const score = {};
    for (const c of CANDS) {
      prod[c] = PROJ[c].map((w, k) => mul(x[k], node(w)));
      score[c] = add(add(prod[c][0], prod[c][1]), prod[c][2]);
    }
    return { tokenA, pos0, x, prod, score };
  };

  // ── SHARED preparation (a single build per update): graph, clear labels, and
  //    the ORDERED LIST of the walk's events (the arcs of the visible top). ──
  const walk = () => {
    const g = build();
    const root = g.score[TRUE]; // ← the backward pass is rooted at « score z »

    // CLEAR labels: we recognize the branch score z → products → x → emb/pos/weights.
    const labels = new Map();
    const ops = new Map();
    g.tokenA.forEach((n, k) => labels.set(n, "emb a" + k));
    g.pos0.forEach((n, k) => labels.set(n, "pos " + k));
    g.x.forEach((n, k) => labels.set(n, "x" + k));
    g.prod[TRUE].forEach((n, k) => {
      labels.set(n, "x" + k + "·weight");
      labels.set(n.children[1].target, "weight z" + k); // the parameter leaf (node)
    });
    labels.set(root, "score z");
    labels.set(root.children[0].target, "Σ part."); // the intermediate add of score z

    // PARAMETERS = all the leaves of the sub-graph (embeddings, positions, projection
    // weights) — the only values the optimizer can modify.
    const params = new Set();
    const sp = new Set();
    const collectParams = (v) => { if (sp.has(v)) return; sp.add(v); if (v.children.length === 0) params.add(v); else v.children.forEach((a) => collectParams(a.target)); };
    collectParams(root);

    // parent count (in the sub-graph) → spots the SHARED nodes (+= ).
    const parentCount = new Map();
    const seenP = new Set();
    const countP = (v) => { if (seenP.has(v)) return; seenP.add(v); for (const a of v.children) { parentCount.set(a.target, (parentCount.get(a.target) ?? 0) + 1); countP(a.target); } };
    countP(root);

    // FOCUS DIM 0: we keep the nEmbd=3 toy (computation IDENTICAL to 6e, faithful) but
    // we only DISPLAY the branch of dimension 0 (emb a0 → x0 → prod0 → score z).
    // Hiding the products of dims 1 and 2 prunes their whole sub-tree (x, emb, pos,
    // weights): the graph becomes a narrow COLUMN → readable, zoomable, less noise.
    const hide = new Set([g.prod[TRUE][1], g.prod[TRUE][2]]);
    const visible = new Set();
    const collectVis = (v) => { if (visible.has(v)) return; visible.add(v); v.children.forEach((a) => { if (!hide.has(a.target)) collectVis(a.target); }); };
    collectVis(root);

    // EVENTS: the VISIBLE arcs (the dim 0 chain), REVERSE topo order, via
    // backwardSteps. An arc = one application of the chain rule — we go down
    // 1 by 1 to the leaves (emb a0 / pos 0 / weight z0), no skipping.
    const events = [];
    const displayGrad = new Map([[root, 1]]);
    for (const s of backwardSteps(root)) {
      if (s.phase !== "propagate") continue;
      const parent = s.currentNode, child = s.justUpdated;
      if (!visible.has(parent) || !visible.has(child)) continue; // dim 0 only
      const arc = parent.children.find((a) => a.target === child);
      const result = s.grads.get(child) ?? 0;
      events.push({ child, parent, local: arc.localGradient, parentGrad: s.grads.get(parent) ?? 0, result, shared: (parentCount.get(child) ?? 0) > 1 });
      displayGrad.set(child, result);
    }

    backward(root); // final grads (deposited on node.grad)
    return { g, root, labels, ops, events, displayGrad, params, hide, visible };
  };

  // ── STEPS (signal `step`) ───────────────────────────────────────────────────
  //   0 forward · 1 makeTopo (order) · 2 backward (score z.grad = 1) ·
  //   ≥3 walk: micro-step m = step-3 ; event = ⌊m/2⌋ ; phase = m%2
  //     (0 = pose the equation "= ?", 1 = solve "= result").
  //   LAST = 3 + 2·(number of events) → finish note.
  window.bwd = {
    walk,

    // ── GRAPH VIEW: same graph (logValue); the node of the current event is
    //    HIGHLIGHTED, its grad fills in at the "solve" phase. ──
    renderGraph: (rawStep, w) => {
      const host = document.getElementById("bwd-graph");
      if (!host) return;
      const step = Number(rawStep) || 0;
      const { root, labels, ops, events, displayGrad, params, hide, visible } = w;
      const r2 = (n) => Math.round(n * 100) / 100;
      const LAST = 3 + 2 * events.length;

      const all = [];
      const seen = new Set();
      const collect = (v) => { if (seen.has(v)) return; seen.add(v); all.push(v); v.children.forEach((a) => collect(a.target)); };
      collect(root);
      const derivatives = new Map();
      const grads = new Map();
      for (const v of all) {
        if (v.children.length) derivatives.set(v, r2(v.children[0].localGradient));
        // displayed grad = that of the arc (the walk lays it node by node).
        grads.set(v, r2(displayGrad.has(v) ? displayGrad.get(v) : v.grad));
      }

      // order badges RENUMBERED on the visible nodes only (otherwise the hidden
      // dims would consume numbers → badges with gaps: 1, 4, 7…).
      const topo = makeTopo(root).filter((n) => visible.has(n));
      const order = new Map(topo.map((n, i) => [n, i + 1]));

      // grads revealed, node highlighted, and the COMPUTATION shown IN the grad box
      // of the active node (the "equation" phase).
      const gp = new Set();
      if (step >= 2) gp.add(root);
      let highlight;
      const gradText = new Map();
      if (step >= 3) {
        const m = step - 3;
        const curEvent = Math.floor(m / 2);
        const curPhase = m % 2;
        const cnum = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(2));
        events.forEach((ev, i) => {
          if (step >= LAST || i < curEvent || (i === curEvent && curPhase === 1)) gp.add(ev.child);
        });
        if (curEvent < events.length && step < LAST) {
          const ev = events[curEvent];
          highlight = ev.child;
          // phase 0 = we POSE the computation "∂ × grad" in the grad box;
          // phase 1 = the numeric grad (the node enters gradPopulated).
          if (curPhase === 0) gradText.set(ev.child, cnum(ev.local) + "×" + cnum(ev.parentGrad));
        }
      }

      // the graph = JUST the graph — the walk fills it node by node.
      host.innerHTML =
        logValue(root, {
          labels,
          ops,
          grads,
          derivatives,
          gradPopulatedNodes: gp,
          order: step >= 1 ? order : undefined,
          showGrad: step >= 2,
          highlightNode: highlight,
          gradText, // the ∂ × grad computation in the active node's box
          params, // parameter leaves marked in teal
          hide, // dims 1 and 2 hidden → we only show the dim 0 column
          maxDepth: 7, // we go down to the leaves (emb a0 / pos 0 / weight z0)
        });
    },

    // ── Dispatcher: a single view (the graph), driven by the walk. ──
    update: (rawStep) => {
      const w = walk();
      window.bwd._last = 3 + 2 * w.events.length; // final step
      window.bwd.renderGraph(rawStep, w);
    },
    // ▶ next disabled BEFORE the walk (step < 2) and AT THE FINISH (step ≥ LAST).
    // We go through a function (no magic number nor < / > in the markup).
    atEnd: (rawStep) => {
      const s = Number(rawStep) || 0;
      const L = window.bwd._last;
      return s < 2 || (L != null && s >= L);
    },
  };
}
</script>

<div class="grid gap-3" style="grid-template-columns: 2.48fr 2.52fr; align-items: stretch; height: 100%">

<div class="codecol">
<div class="tag mb-2">{{ $t('passeArriereCode.codeTag') }}</div>

```ts
type Arc = { target: Node; localGradient: number };
type Node = { data: number; grad: number; children: Arc[] };

export const makeTopo = (root: Node): readonly Node[] => {
  const topo: Node[] = [];
  const seen = new Set<Node>();
  const visit = (current: Node): void => {
    if (seen.has(current)) return;
    seen.add(current);
    current.children.forEach(({ target }) => visit(target));
    topo.push(current);
  };
  visit(root);
  return topo;
};

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
```

</div>

<div v-pre class="panel panel-crimson" style="display: flex; flex-direction: column; min-width: 0" data-signals="{step: 0}" data-effect="window.bwd.update($step)">
  <div style="display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 0.4rem">
    <button class="btn" style="text-transform: none; font-family: 'Fira Code', monospace; font-size: 0.74rem; background: var(--teal); color: #fff" data-attr:disabled="$step !== 0" data-on:click="$step = 1">makeTopo()</button>
    <button class="btn btn-crimson" style="text-transform: none; font-family: 'Fira Code', monospace; font-size: 0.74rem" data-attr:disabled="$step !== 1" data-on:click="$step = 2">backward()</button>
    <button class="btn btn-amber" style="text-transform: none; font-family: 'Fira Code', monospace; font-size: 0.74rem" data-attr:disabled="window.bwd.atEnd($step)" data-on:click="$step = $step + 1">▶ next</button>
    <button class="btn" style="text-transform: none; font-family: 'Fira Code', monospace; font-size: 0.74rem; background: var(--slate)" data-on:click="$step = 0">↻ reset</button>
  </div>
  <div id="bwd-graph" class="codexec bwd-out"></div>
</div>

</div>

<style scoped>
.shiki, .slidev-code { font-size: 0.663rem !important; line-height: 1.3 !important; }
.tag { font-size: 0.9rem; }
/* min-width:0 → la colonne de code respecte sa part de grille (sinon ses longues
   lignes la forcent plus large et écrasent le panneau de droite). */
.codecol { display: flex; flex-direction: column; min-height: 0; min-width: 0; }
.codecol .slidev-code { flex: 1 1 0; min-height: 0; min-width: 0; overflow: auto; margin: 0; }
.bwd-out { flex: 1 1 0; min-height: 0; min-width: 0; margin: 0; overflow: hidden; background: #fff; }
/* vue graphe : on ZOOME la colonne dim 0 à 1.7× la hauteur du panneau → plus
   lisible. Le débordement vertical déclenche un SCROLL (overflow:auto). Crucial :
   la hauteur du panneau (#bwd-graph) est fixée par le flex (flex:1 1 0), donc
   agrandir le SVG NE la change PAS — pas de re-render Slidev qui réinitialiserait
   le signal `step`. Flux bloc (pas de flex-center) pour que le HAUT reste
   atteignable au scroll (un item flex centré plus grand que son conteneur clippe
   son début). Centrage horizontal via margin auto sur le SVG. */
#bwd-graph { overflow: auto; display: block; }
/* :deep() — le SVG est injecté en innerHTML, il n'a PAS l'attribut de scoping
   Slidev ; sans :deep le sélecteur scopé ne le matcherait jamais. */
#bwd-graph :deep(svg) { height: 221%; width: auto; max-width: none; max-height: none; display: block; margin: 0 auto; }
</style>

<!--
Passe arrière PAS-À-PAS (règle de la chaîne), pilotée par backwardSteps :
- On enracine sur « score z » : softmax + −ln (la « surprise ») sont leurs propres
  slides (7ba / 7h). Ici l'arbre est court → score z → produits → x → emb/pos/poids.
- makeTopo() : ordonne (pastilles 1…N), aucun grad.
- backward() : score z.grad = 1 (l'étincelle) ; la sous-case grad apparaît.
- ▶ suivant : remonte un arc à la fois, ordre topo INVERSE. Chaque arc = 2 micro-pas :
    (équation) grad(enfant) = ∂ × grad(parent) = a × b = ?   puis   (résultat) = r.
  Le nœud actif est surligné (orange) ; son grad se remplit à la résolution.
- feuilles = PARAMÈTRES (emb / pos / poids, en teal) : apprendre = poids ← poids − lr × grad
  (détail Adam : slide Adam de la section entraînement).
-->
