---
layout: default
---

<script setup>
// THE REAL CODE, EXECUTED — the six blocks of `lib/matrix-helpers.ts`, demonstrated
// one by one on examples you can work out in your head. Datastar expressions are
// evaluated outside this module → we expose the rendering via `window.helpers`. Output
// built in the DOM (createElement): no literal angle brackets, inline styles.
import { sum, vecProduct, dot, div, softmax, linear } from "../lib/matrix-helpers";

if (typeof window !== "undefined") {
  // n2: integer as-is, otherwise 2 decimals; fmt: a number OR a vector
  const n2 = (x) => (Number.isInteger(x) ? String(x) : x.toFixed(2));
  const fmt = (out) => (Array.isArray(out) ? "[" + out.map(n2).join(", ") + "]" : n2(out));

  // each block: the call (as you'd write it), the real computation, an intuition
  const DEMOS = {
    sum: { call: "sum([1, 2, 3])", run: () => sum([1, 2, 3]), note: "adds up the cells → a number" },
    vecProduct: { call: "vecProduct([1, 2, 3], [4, 5, 6])", run: () => vecProduct([1, 2, 3], [4, 5, 6]), note: "multiplies cell by cell → a vector" },
    dot: { call: "dot([1, 2, 3], [4, 5, 6])", run: () => dot([1, 2, 3], [4, 5, 6]), note: "= sum(vecProduct(…)) → a number (the alignment)" },
    div: { call: "div(6, 2)", run: () => div(6, 2), note: "a simple division (÷)" },
    softmax: { call: "softmax([0, 1, 0])", run: () => softmax([0, 1, 0]), note: "scores → probs (sum 1), inflates the largest" },
    linear: { call: "linear([2, 3], [[1,0],[0,1],[1,1]])", run: () => linear([2, 3], [[1, 0], [0, 1], [1, 1]]), note: "one dot per matrix row → a vector" },
  };

  const mk = (tag, style, text) => {
    const el = document.createElement(tag);
    if (style) Object.assign(el.style, style);
    if (text != null) el.textContent = text;
    return el;
  };

  window.helpers = {
    render: (rawFn) => {
      const host = document.getElementById("helpers-out");
      if (!host) return;
      const d = DEMOS[rawFn] || DEMOS.sum;
      host.replaceChildren();

      // the call
      host.append(mk("div", { fontFamily: "'Fira Code',monospace", fontSize: "15px", color: "var(--ink)", marginBottom: "0.5rem" }, d.call));
      // => result (large, crimson)
      const line = mk("div", { display: "flex", alignItems: "center", gap: "0.5rem" });
      line.append(mk("span", { fontFamily: "'Fira Code',monospace", fontSize: "15px", color: "var(--slate)" }, "⟹"));
      line.append(mk("span", { fontFamily: "'Anton',sans-serif", fontSize: "1.6rem", color: "var(--crimson)", letterSpacing: "0.03em" }, fmt(d.run())));
      host.append(line);
      // the intuition
      host.append(mk("div", { fontSize: "11.5px", color: "var(--ink)", opacity: "0.75", marginTop: "0.6rem", lineHeight: "1.4" }, d.note));
    },
  };
}
</script>

# {{ $t('annexeHelpers.title') }}

<div class="rule-ink w-24 my-3" />

<div class="grid gap-5" style="grid-template-columns: 2.4fr 2.6fr; align-items: stretch; height: 100%">

<div class="codecol">
<div class="tag mb-2">{{ $t('annexeHelpers.tagFile') }}</div>

```ts
type Vec = number[]; type Mat = number[][];
// sum of the cells → a number
const sum = (v: Vec): number => v.reduce((a, b) => a + b, 0);
// term-by-term product → a vector
const vecProduct = (a: Vec, b: Vec): Vec => a.map((x, i) => x * b[i]);
// dot product = multiply cell by cell THEN sum
const dot = (a: Vec, b: Vec): number => sum(vecProduct(a, b));
// division (in Karpathy's code: ×  the inverse) — here a simple ÷
const div = (a: number, b: number): number => a / b;
// scores → probabilities (sum = 1), inflating the largest
const softmax = (s: Vec): Vec => {
  const m = Math.max(...s);
  const exps = s.map((x) => Math.exp(x - m));
  return exps.map((e) => div(e, sum(exps)));
};
// apply a matrix to a vector = one dot per row
const linear = (v: Vec, mat: Mat): Vec => mat.map((row) => dot(row, v));
```

</div>

<div>

<div class="panel mb-3 panel-teal">
  <p class="text-sm mt-0 mb-0" v-html="$t('annexeHelpers.intro')"></p>
</div>

<div v-pre class="panel panel-crimson" style="display: flex; flex-direction: column; min-width: 0" data-signals="{fn: 'sum'}" data-effect="window.helpers.render($fn)">
  <div style="display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 0.6rem">
    <button class="btn" style="font-family: 'Fira Code', monospace; font-size: 0.74rem; text-transform: none" data-attr:disabled="$fn === 'sum'" data-on:click="$fn = 'sum'">sum</button>
    <button class="btn btn-amber" style="font-family: 'Fira Code', monospace; font-size: 0.74rem; text-transform: none" data-attr:disabled="$fn === 'vecProduct'" data-on:click="$fn = 'vecProduct'">vecProduct</button>
    <button class="btn btn-amber" style="font-family: 'Fira Code', monospace; font-size: 0.74rem; text-transform: none" data-attr:disabled="$fn === 'dot'" data-on:click="$fn = 'dot'">dot</button>
    <button class="btn" style="font-family: 'Fira Code', monospace; font-size: 0.74rem; text-transform: none" data-attr:disabled="$fn === 'div'" data-on:click="$fn = 'div'">div</button>
    <button class="btn btn-crimson" style="font-family: 'Fira Code', monospace; font-size: 0.74rem; text-transform: none" data-attr:disabled="$fn === 'softmax'" data-on:click="$fn = 'softmax'">softmax</button>
    <button class="btn" style="font-family: 'Fira Code', monospace; font-size: 0.74rem; text-transform: none" data-attr:disabled="$fn === 'linear'" data-on:click="$fn = 'linear'">linear</button>
  </div>
  <div id="helpers-out" class="codexec" style="background: #fff; flex: 1 1 auto; min-height: 120px; padding: 0.8rem"></div>
</div>

<p class="text-xs opacity-70 mt-2 mb-0" v-html="$t('annexeHelpers.footnote')"></p>

</div>

</div>

<style scoped>
.shiki, .slidev-code { font-size: 0.6rem !important; line-height: 1.3 !important; }
.tag { font-size: 0.86rem; }
.codecol { display: flex; flex-direction: column; min-height: 0; min-width: 0; }
.codecol .slidev-code { flex: 1 1 0; min-height: 0; min-width: 0; overflow: auto; margin: 0; }
:deep(code) { font-family: "Fira Code", monospace; font-size: 0.9em; color: var(--crimson); background: transparent !important; padding: 0 !important; }
:deep(code)::before, :deep(code)::after { content: "" !important; }
</style>

<!--
Slide HELPERS — pose les briques vecteur/matrice AVANT « Pleine conscience » (7c),
qui les empile. Jumeau NUMÉRIQUE pédagogique (lib/matrix-helpers.ts) : on comprend
le calcul, pas de gradient. Les vraies briques du tronc (dot/linear/softmax dans
07-attention.ts, div dans 03-autograd.ts) opèrent, elles, sur des Node.
- sum / vecProduct / dot : le trio du produit scalaire (l'« alignement » q·k).
- div : la division de la normalisation softmax.
- softmax : scores → probas, gonfle le favori.
- linear : une matrice appliquée = un dot par ligne (q, k, v, projection).
-->
