---
layout: default
---

<script setup>
// THE REAL CODE, EXECUTED — the full forward pass of gpt() (09-model). We RESUME
// the journey: same model (seed 7) and same context « az » as slides 7b→7f.
// We unroll the current token « z » (« a » is already in the cache): embed → rmsnorm
// → attention (+residual) → MLP (+residual) → projection → scores → softmax.
import { embed } from "microgpt-ts/embeddings";
import { rmsnorm } from "microgpt-ts/rmsnorm";
import { attention, linear, softmax } from "microgpt-ts/attention";
import { mlp } from "microgpt-ts/mlp";
import { initModel, makeConfig } from "microgpt-ts/model";
import { randomSeed } from "microgpt-ts/parameters";
import { add } from "microgpt-ts/autograd";

if (typeof window !== "undefined") {
  const ALPHA = " abcdefghijklmnopqrstuvwxyz";
  const cfg = makeConfig(ALPHA.length, { nEmbd: 6, nHead: 2, blockSize: 8 });
  const model = initModel(randomSeed(7), cfg);
  const addVec = (a, b) => a.map((ai, i) => add(ai, b[i]));
  const num = (n) => (Math.round(n * 100) / 100).toFixed(2);

  // « a » (pos 0) already went through: its key/value is in the cache.
  const kvOf = (ch, pos) => {
    const xn = rmsnorm(rmsnorm(embed(model.tokenEmb, model.positionEmb, ALPHA.indexOf(ch), pos)));
    return { k: linear(xn, model.attn_wk), v: linear(xn, model.attn_wv) };
  };
  const cacheA = kvOf("a", 0);

  const mk = (tag, style, text) => {
    const el = document.createElement(tag);
    if (style) Object.assign(el.style, style);
    if (text != null) el.textContent = text;
    return el;
  };
  const head = (t, color) => mk("div", { fontFamily: "'Anton',sans-serif", textTransform: "uppercase", fontSize: "0.68rem", color: color || "var(--crimson)", margin: "0.26rem 0 0.03rem" }, t);
  const vrow = (vec, bg) => {
    const r = mk("div", { display: "flex", gap: "0.22rem", flexWrap: "wrap" });
    vec.forEach((nd) => r.append(mk("span", { width: "42px", textAlign: "center", padding: "2px 0", fontFamily: "'Fira Code',monospace", fontSize: "10px", border: "1.5px solid var(--ink)", borderRadius: "3px", background: bg }, num(nd.data))));
    return r;
  };

  window.fwd2 = {
    render: (rawStep) => {
      const host = document.getElementById("fwd2-out");
      if (!host) return;
      const step = Number(rawStep) || 0;
      host.replaceChildren();

      let x = embed(model.tokenEmb, model.positionEmb, ALPHA.indexOf("z"), 1);
      host.append(head('① embedding — token "z" + position 1', "var(--teal)"));
      host.append(vrow(x, "#fff"));

      if (step >= 1) {
        x = rmsnorm(x);
        host.append(head("② rmsnorm", "var(--teal)"));
        host.append(vrow(x, "#eef"));
      }
      if (step >= 2) {
        const res1 = x;
        const xn = rmsnorm(x);
        const q = linear(xn, model.attn_wq);
        const k = linear(xn, model.attn_wk);
        const v = linear(xn, model.attn_wv);
        const xAttn = attention(q, [cacheA.k, k], [cacheA.v, v], cfg.nHead);
        x = addVec(linear(xAttn, model.attn_wo), res1);
        host.append(head('③ attention + residual (looks at "a" and "z")', "var(--crimson)"));
        host.append(vrow(x, "#f7d7d2"));
      }
      if (step >= 3) {
        const res2 = x;
        x = addVec(mlp(rmsnorm(x), model.mlp_fc1, model.mlp_fc2), res2);
        host.append(head("④ MLP + residual", "var(--amber)"));
        host.append(vrow(x, "#fde7c8"));
      }
      if (step >= 4) {
        const scores = linear(x, model.outputProj);
        const probs = softmax(scores).map((p) => p.data);
        const iP = ALPHA.indexOf("u");
        host.append(head("⑤ projection → scores → softmax: one prob per letter (still ≈ equal)", "var(--ink)"));
        const r = mk("div", { display: "flex", alignItems: "flex-end", gap: "1px", height: "56px", marginTop: "0.25rem" });
        probs.forEach((p, i) => {
          const isP = i === iP;
          const col = mk("div", { flex: "1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%" });
          col.append(mk("div", { width: "100%", height: (p * 560).toFixed(0) + "px", background: isP ? "var(--teal)" : "var(--crimson)", border: "0.5px solid var(--ink)", borderRadius: "1px 1px 0 0" }));
          col.append(mk("div", { fontFamily: "'Fira Code',monospace", fontSize: "8px", color: isP ? "var(--teal)" : "var(--slate)", fontWeight: isP ? "700" : "400", marginTop: "1px" }, ALPHA[i] === " " ? "␣" : ALPHA[i]));
          r.append(col);
        });
        host.append(r);
        const seq = mk("div", { fontFamily: "'Anton',sans-serif", fontSize: "1rem", marginTop: "0.5rem", letterSpacing: "0.06em" });
        seq.append(mk("span", {}, "a  z  "));
        seq.append(mk("span", { color: "var(--slate)" }, "→  "));
        seq.append(mk("span", { color: "var(--teal)" }, "u ?"));
        seq.append(mk("span", { fontFamily: "'Fira Code',monospace", fontSize: "0.62rem", color: "var(--slate)", textTransform: "none", marginLeft: "0.4rem" }, "(azur)"));
        host.append(seq);
        const t = mk("div", { fontSize: "10.5px", color: "var(--ink)", marginTop: "0.15rem", lineHeight: "1.35" });
        host.append(t);
      }
    },
  };
}
</script>

<div class="grid gap-5" style="grid-template-columns: 2.4fr 2.6fr; align-items: stretch; height: 100%">

<div class="codecol">
<div class="tag mb-2">09-model.ts — gpt()</div>

```ts
export const gpt = (model, cfg, tokenId, posId, cache) => {
  // 1. embedding (token + position), 2. normalization
  let x = embed(model.tokenEmb, model.positionEmb, tokenId, posId);
  x = rmsnorm(x);

  // 3. transformer block — attention (+ residual)
  const xResidual1 = x;
  const xn = rmsnorm(x);
  const q = linear(xn, model.attn_wq);
  const k = linear(xn, model.attn_wk);
  const v = linear(xn, model.attn_wv);
  const keys = [...cache.keys, k];
  const values = [...cache.values, v];
  const xAttn = attention(q, keys, values, cfg.nHead);
  x = addVec(linear(xAttn, model.attn_wo), xResidual1);

  // 3 (cont.). MLP (+ residual)
  const xResidual2 = x;
  x = addVec(mlp(rmsnorm(x), model.mlp_fc1, model.mlp_fc2), xResidual2);

  // 4. final projection to the scores (one per letter)
  const scores = linear(x, model.outputProj);
  return { scores, cache: { keys, values } };
};
```

</div>

<div v-pre class="panel panel-crimson" style="display: flex; flex-direction: column; min-width: 0" data-signals="{step: 0}" data-effect="window.fwd2.render($step)">
  <div style="display: flex; flex-wrap: wrap; gap: 0.35rem; margin-bottom: 0.5rem">
    <button class="btn" style="font-family: 'Fira Code', monospace; font-size: 0.7rem; text-transform: none" data-attr:disabled="$step !== 0" data-on:click="$step = 1">rmsnorm</button>
    <button class="btn btn-crimson" style="font-family: 'Fira Code', monospace; font-size: 0.7rem; text-transform: none" data-attr:disabled="$step !== 1" data-on:click="$step = 2">attention</button>
    <button class="btn btn-amber" style="font-family: 'Fira Code', monospace; font-size: 0.7rem; text-transform: none" data-attr:disabled="$step !== 2" data-on:click="$step = 3">MLP</button>
    <button class="btn" style="font-family: 'Fira Code', monospace; font-size: 0.7rem; text-transform: none" data-attr:disabled="$step !== 3" data-on:click="$step = 4">scores</button>
    <button class="btn" style="font-family: 'Fira Code', monospace; font-size: 0.7rem; text-transform: none; background: var(--slate)" data-on:click="$step = 0">↻</button>
  </div>
  <div id="fwd2-out" class="codexec" style="background: #fff; flex: 1 1 auto"></div>
</div>

</div>

<style scoped>
.shiki, .slidev-code { font-size: 0.58rem !important; line-height: 1.3 !important; }
.tag { font-size: 0.9rem; }
.codecol { display: flex; flex-direction: column; min-height: 0; min-width: 0; }
.codecol .slidev-code { flex: 1 1 0; min-height: 0; min-width: 0; overflow: auto; margin: 0; }
</style>

<!--
La passe avant complète, composée des VRAIES briques (embed/rmsnorm/attention/mlp).
Encadré KV-cache : microgpt traite un token à la fois et construit le cache K/V
explicitement ; ici les clés/valeurs sont des Node vivants → on backpropage à
travers. C'est conceptuellement toujours présent, juste caché dans les implés
vectorisées de production.
-->
