---
layout: default
---

<script setup>
// THE CODE — SIMPLIFIED version (we "cheat" a bit). The real `04-parameters.ts`
// wraps each number in a `node()` → an autograd `Node`. But autograd hasn't been
// seen yet: here a parameter = a PLAIN NUMBER. Same roles, same shapes, same
// total (4192) as Karpathy — without the autograd layer.
// We build REAL numbers (seeded Gaussian draw) and count them.
// Datastar `data-*` expressions are evaluated outside this module → we expose
// the helpers via `window`.
const mulberry32 = (seed) => {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
const { cos, log, sqrt, PI } = Math;

const gaussian = (rng, std = 0.08) => sqrt(-2 * log(1 - rng())) * cos(2 * PI * rng()) * std;
const matrix = (rng, nout, nin) =>
  Array.from({ length: nout }, () => Array.from({ length: nin }, () => gaussian(rng)));
// Karpathy config: vocab 27, nEmbd 16, context 16 → 4192 parameters.
const buildStateDict = (rng, V = 27, E = 16, B = 16) => ({
  tokenEmb: matrix(rng, V, E),
  positionEmb: matrix(rng, B, E),
  attn_wq: matrix(rng, E, E),
  attn_wk: matrix(rng, E, E),
  attn_wv: matrix(rng, E, E),
  attn_wo: matrix(rng, E, E),
  mlp_fc1: matrix(rng, 4 * E, E),
  mlp_fc2: matrix(rng, E, 4 * E),
  outputProj: matrix(rng, V, E),
});
const flatten = (s) => Object.values(s).flatMap((m) => m.flat());
if (typeof window !== "undefined") {
  window.params = {
    build: () => {
      const s = buildStateDict(mulberry32(42));
      const lines = Object.entries(s).map(
        ([k, m]) => `${k.padEnd(12)} ${m.length}×${m[0].length} = ${m.length * m[0].length}`,
      );
      const total = flatten(s).length;
      return `${lines.join("\n")}\n${"─".repeat(22)}\nTotal = ${total} parameters`;
    },
  };
}
</script>

<div class="grid gap-5" style="grid-template-columns: 3fr 2fr; align-items: stretch">

<div>
<div class="tag mb-2">04-parameters.ts</div>

```ts
type Vec = number[]; 
type Mat = Vec[];   
type StateDict = Record<string, Mat>;
type Rng = () => number;

const { cos, log, sqrt, PI } = Math;

const gaussian = (rng: Rng, std = 0.08): number =>
  sqrt(-2 * log(1 - rng())) * cos(2 * PI * rng()) * std;

const matrix = (rng: Rng, nout: number, nin: number): Mat =>
  Array.from({ length: nout }, () =>
    Array.from({ length: nin }, () => gaussian(rng)));

const buildMatrices = (rng, V, E, B): StateDict => ({
  tokenEmb:   matrix(rng, V, E),   // vocabulary
  positionEmb:matrix(rng, B, E),   // positions
  attn_wq:    matrix(rng, E, E),   // attention
  mlp_fc1:    matrix(rng, 4*E, E), // perceptrons
  outputProj: matrix(rng, V, E),   // projections
});
```

</div>

<div v-pre class="panel panel-teal" style="display: flex; flex-direction: column" data-signals="{out: '', step: 0}">
  <div style="display:flex; gap:0.5rem; align-items:center; margin-bottom:0.7rem">
    <button class="btn" style="text-transform:none; font-family:'Fira Code',monospace; font-size:0.78rem" data-attr:disabled="$step !== 0" data-on:click="$out = window.params.build(); $step = 1">buildMatrices</button>
    <a class="btn btn-crimson" style="text-transform:none; font-family:'Fira Code',monospace; font-size:0.78rem; text-decoration:none; color:#fff; border:2.5px dashed #fff" data-attr:href="window.bgpt.asset('/butterfly-model.json')" target="_blank">See params</a>
  </div>
  <textarea class="codexec" data-bind:out placeholder="// click buildMatrices" style="flex:1; min-height:0; width:100%; resize:none"></textarea>
  <div style="display:flex; justify-content:flex-end; margin-top:0.6rem">
    <button class="btn" style="text-transform:none; font-family:'Fira Code',monospace; font-size:0.78rem; background:var(--slate)" data-on:click="$out = ''; $step = 0">↻ reset</button>
  </div>
</div>

</div>

<style scoped>
.shiki, .slidev-code { font-size: 0.79rem !important; line-height: 1.28 !important; }
.tag { font-size: 0.9rem; }
</style>

<!--
- On TRICHE : le vrai 04-parameters.ts fait `node(gaussian(...))` → des Node.
- Ici, de simples nombres, pour rester indépendant de l'autograd (pas encore vu).
- Mêmes shapes, même total 4192 que Karpathy (vocab 27, nEmbd 16, contexte 16).
- L'armure autograd (Node) arrive juste après, section 6.
-->
