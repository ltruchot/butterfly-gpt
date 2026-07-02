---
layout: default
---

<script setup>
// THE REAL CODE, EXECUTED. We import the real autograd primitives from the narrow
// sub-export `microgpt-ts/autograd` (PURE module, no IO → safe on the browser
// side). The demo builds REAL `Node`s: we read `.data` (the value of the forward
// pass) AND `node.children[i].localGradient` (the local derivative noted "in the
// margin" by each operation). Datastar `data-*` expressions are evaluated outside
// this module → we expose the rendering via `window.fwd`. We build the output to
// the DOM (createElement): no literal opening angle bracket (the SFC parser would
// take it for a tag) and inline styles (nodes injected outside scoped).
import { node, add, mul, exp, div } from "microgpt-ts/autograd";

if (typeof window !== "undefined") {
  // ── Inputs ("random" parameters) — taken from the prose 14-autograd-idee ──
  const TOKEN_A = [-0.42, 0.15, 0.7]; // vector of the token « a »
  const POS_0 = [0.12, -0.22, 0.4]; // vector of position 0
  // one projection row per next candidate (the « azur » example)
  const PROJ = {
    a: [0.2, -0.5, 0.1],
    z: [-0.4, 0.3, 0.25],
    u: [0.5, 0.1, -0.3],
    r: [-0.1, -0.2, 0.6],
  };
  const CANDS = ["a", "z", "u", "r"];
  const TRUE = "z"; // the REAL next token (a → z in « azur »)

  // numbers: 2 decimals, no « -0.00 »
  const num = (n) => { const v = Math.round(n * 100) / 100; return (v === 0 ? 0 : v).toFixed(2); };

  // ── The forward pass, with the REAL autograd ─────────────────────────────────
  const build = () => {
    const tokenA = TOKEN_A.map(node);
    const pos0 = POS_0.map(node);
    const x = tokenA.map((t, k) => add(t, pos0[k])); // 1) add (cell by cell)
    const prod = {}; // 2) mul (cell by cell): x ⊙ projⱼ
    const score = {}; // 3) add: sum of cells → 1 scalar score / candidate
    for (const c of CANDS) {
      prod[c] = PROJ[c].map((w, k) => mul(x[k], node(w)));
      score[c] = add(add(prod[c][0], prod[c][1]), prod[c][2]);
    }
    // 4) we read the scores as "probabilities" (exp + normalization) to rank
    //    them — computed behind the scenes, we no longer DISPLAY the percentage.
    const e = {};
    for (const c of CANDS) e[c] = exp(score[c]);
    const sumE = add(add(add(e.a, e.z), e.u), e.r);
    const p = {};
    for (const c of CANDS) p[c] = div(e[c], sumE);
    return { tokenA, pos0, x, prod, score, p };
  };

  // ── Mini DOM builders ─────────────────────────────────────────────────────────
  const mk = (tag, style, text) => {
    const el = document.createElement(tag);
    if (style) Object.assign(el.style, style);
    if (text != null) el.textContent = text;
    return el;
  };
  // Every "cell" has EXACTLY the same size (a sign, 1 digit, the dot, 2 decimals
  // → "-0.00") for a perfect grid alignment.
  const CASE = { width: "46px", boxSizing: "border-box", textAlign: "center", padding: "0 4px", fontFamily: "'Fira Code',monospace", fontSize: "11px", color: "var(--ink)" };
  const chip = (n, color) =>
    mk("span", { ...CASE, display: "inline-block", border: "1.5px solid var(--ink)", borderRadius: "3px", background: color || "#fff" }, n);
  // double cell: [ value (forward pass) | noted local derivative (for ↩) ].
  // The derivative comes from the REAL graph: node.children[0].localGradient.
  const dcell = (val, deriv) => {
    const box = mk("span", { display: "inline-flex", border: "1.5px solid var(--ink)", borderRadius: "3px", overflow: "hidden" });
    box.append(mk("span", { ...CASE, background: "#fff" }, val));
    box.append(mk("span", { ...CASE, background: "#fdebc8", borderLeft: "1.5px solid var(--ink)", fontWeight: "700" }, deriv));
    return box;
  };
  const lbl = (txt, w) => mk("span", { width: w || "3rem", fontWeight: "700", fontSize: "12px" }, txt);
  // LEAF row (inputs / parameters): values only, no local derivative
  const leafRow = (label, vals, w, color) => {
    const row = mk("div", { display: "flex", alignItems: "center", gap: "0.3rem", margin: "0.16rem 0" });
    row.append(lbl(label, w));
    vals.forEach((v) => row.append(chip(num(v), color)));
    return row;
  };
  // computed NODE row: one double cell per cell (value + noted derivative)
  const nodeRow = (label, nodes, w) => {
    const row = mk("div", { display: "flex", alignItems: "center", gap: "0.3rem", margin: "0.16rem 0" });
    row.append(lbl(label, w));
    nodes.forEach((nd) => row.append(dcell(num(nd.data), num(nd.children[0].localGradient))));
    return row;
  };
  const headline = (txt, color) =>
    mk(
      "div",
      { fontFamily: "'Anton',sans-serif", textTransform: "uppercase", fontSize: "0.72rem", color: color || "var(--crimson)", margin: "0.45rem 0 0.18rem" },
      txt,
    );

  // ── Render a step (0..4) — rebuilds everything, so reset-safe ────────────────
  window.fwd = {
    render: (rawStep) => {
      const host = document.getElementById("fwd-out");
      if (!host) return;
      const step = Number(rawStep) || 0;
      const g = build();
      host.replaceChildren();

      // ── The starts: token « a » + position 0 (ALWAYS visible) ──
      host.append(headline("merged input", "var(--teal)"));
      host.append(leafRow("\"a\"", g.tokenA.map((n) => n.data), "3rem", "#dff3f0"));
      host.append(leafRow("pos 0", g.pos0.map((n) => n.data), "3rem", "#dff3f0"));
      if (step >= 1) host.append(nodeRow("→ x", g.x, "3rem")); // add: ∂ = 1 (copy)

      // ── The candidates: each step ADDS its block (nothing is erased) ──
      // steps 0-1: we see the projections (leaves); from the mul on, their value
      // shows up as the noted derivative in the products → we replace them then.
      if (step <= 1) {
        host.append(headline("candidates a·z·u·r — projections", "var(--crimson)"));
        for (const c of CANDS) host.append(leafRow(c, PROJ[c], "1.3rem", "#fff"));
      }
      if (step >= 2) {
        host.append(headline("products  x ⊙ projⱼ  (mul: ∂ = the other factor)", "var(--crimson)"));
        for (const c of CANDS) host.append(nodeRow(c, g.prod[c], "1.3rem"));
      }
      if (step >= 3) {
        // candidate rank by prob (computed behind the scenes, NO LONGER shown in %):
        // we put it in words — "very likely" at the top, "very unlikely" at the bottom.
        const QUAL = ["very likely", "likely", "unlikely", "very unlikely"];
        const ranked = [...CANDS].sort((a, b) => g.p[b].data - g.p[a].data);
        host.append(headline(step >= 4 ? "scores → analysis: who is likely?" : "scores  Σ of cells  (add: ∂ = 1)", "var(--crimson)"));
        for (const c of CANDS) {
          const isTrue = c === TRUE;
          const row = mk("div", { display: "flex", alignItems: "center", gap: "0.4rem", margin: "0.16rem 0", background: isTrue && step >= 4 ? "#f7d7d2" : "transparent", borderRadius: "3px", padding: "1px 3px" });
          row.append(lbl(c, "1.3rem"));
          row.append(dcell(num(g.score[c].data), num(g.score[c].children[0].localGradient)));
          if (step >= 4) {
            const pr = g.p[c].data;
            // the bar = the prob, WITHOUT the percentage: just "more / less likely"
            row.append(mk("span", { height: "11px", width: Math.round(pr * 90) + "px", background: isTrue ? "var(--crimson)" : "var(--teal)", border: "1.5px solid var(--ink)", borderRadius: "2px" }));
            row.append(mk("span", { fontFamily: "'Fira Code',monospace", fontSize: "10.5px", color: "var(--slate)" }, QUAL[ranked.indexOf(c)]));
            // we mark the TARGET: the real next token (a → z in « azur »)
            if (isTrue) row.append(mk("span", { fontFamily: "'Fira Code',monospace", fontSize: "10px", fontWeight: "700", color: "var(--crimson)" }, "← true (a→z)"));
          }
          host.append(row);
        }
      }
    },
  };
}
</script>

<div class="grid gap-5" style="grid-template-columns: 2.45fr 2.55fr; align-items: stretch; height: 100%">

<div class="codecol">
<div class="tag mb-2">03-autograd.ts {{ $t('passeAvantCode.codeTag') }}</div>

```ts
type Arc = { target: Node; localGradient: number };
type Node = { data: number; grad: number; children: Arc[] };

const arc = (target, localGradient): Arc => ({
  target, localGradient
});
const node = (data): Node => ({
  data, grad: 0, children: []
});
const op = (data, children): Node => ({
  data, grad: 0, children
});

const add = (a: Node, b: Node): Node =>
  op(a.data + b.data, [arc(a, 1), arc(b, 1)]);

const mul = (a: Node, b: Node): Node =>
  op(a.data * b.data, [arc(a, b.data), arc(b, a.data)]);

const exp = (a: Node): Node => {
  const e = Math.exp(a.data);
  return op(e, [arc(a, e)]);
};

const log = (a: Node): Node =>
  op(Math.log(a.data), [arc(a, 1 / a.data)]);
```

</div>

<div v-pre class="panel panel-teal" style="display: flex; flex-direction: column" data-signals="{step: 0}" data-effect="window.fwd.render($step)">
  <div style="display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 0.5rem">
    <button class="btn" style="text-transform: none; font-family: 'Fira Code', monospace; font-size: 0.74rem" data-attr:disabled="$step !== 0" data-on:click="$step = 1">add</button>
    <button class="btn btn-amber" style="text-transform: none; font-family: 'Fira Code', monospace; font-size: 0.74rem" data-attr:disabled="$step !== 1" data-on:click="$step = 2">mul</button>
    <button class="btn btn-amber" style="text-transform: none; font-family: 'Fira Code', monospace; font-size: 0.74rem" data-attr:disabled="$step !== 2" data-on:click="$step = 3">add Σ</button>
    <button class="btn btn-crimson" style="text-transform: none; font-family: 'Fira Code', monospace; font-size: 0.74rem" data-attr:disabled="$step !== 3" data-on:click="$step = 4">analyze…</button>
    <button class="btn" style="text-transform: none; font-family: 'Fira Code', monospace; font-size: 0.74rem; background: var(--slate)" data-on:click="$step = 0">↻ reset</button>
  </div>
  <div id="fwd-out" class="codexec fwd-out"></div>
</div>

</div>

<style scoped>
.shiki, .slidev-code { font-size: 0.72rem !important; line-height: 1.3 !important; }
.tag { font-size: 0.9rem; }
/* code + démo remplissent toute la hauteur de la slide 16:9 */
.codecol { display: flex; flex-direction: column; min-height: 0; }
.codecol .slidev-code { flex: 1 1 0; min-height: 0; overflow: auto; margin: 0; }
/* zone de sortie : remplit la hauteur, défile si besoin */
.fwd-out { flex: 1 1 0; min-height: 0; min-width: 0; margin: 0; overflow: auto; background: #fff; }
</style>

<!--
La passe avant = chaque op calcule SA valeur ET note SA dérivée locale.
- add  : routeur → dérivée 1 · 1 (recopie le blâme à l'identique)
- mul  : échangeur → dérivée = la valeur de l'autre facteur
- add Σ: somme des cases → 1 score par candidat
- analyser : on lit les scores en « plus / moins probable » (la barre = la proba,
  calculée en coulisse mais plus affichée en %). Softmax a sa propre slide (7ba) ;
  la « surprise » (−ln) sera la slide LOSS (7h).
- tout reste dans le graphe : la passe arrière le remontera (blâme)
-->
