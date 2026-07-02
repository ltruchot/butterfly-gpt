---
layout: default
---

<script setup>
// THE REAL CODE, EXECUTED — MULTI-HEAD attention. We build a REAL model, we
// compute the REAL q/k/v (linear on the embeddings), we SPLIT into nHead heads,
// then for each head: q·k/√headDim affinity, softmax, weighted sum of the
// values. We glue back (concat), project (matO), add the residual (vecX).
// The current token « z » looks at the past positions (a, z) and decides how much
// to draw from each. Head 0 is unrolled in detail; head 1 follows the same
// mechanics on the other slice and appears at the concat step.
import { dot, linear, softmax } from "microgpt-ts/attention";
import { embed } from "microgpt-ts/embeddings";
import { initModel, makeConfig } from "microgpt-ts/model";
import { randomSeed } from "microgpt-ts/parameters";
import { node, mul } from "microgpt-ts/autograd";

if (typeof window !== "undefined") {
  const ALPHA = " abcdefghijklmnopqrstuvwxyz";
  const CTX = "az"; // context; the current token = last letter « z »
  // SAME embeddings as slide 7b (seed 7, nEmbd 6) → the x vector is THE SAME:
  // that's the through-line, we recover the x of « a »/« z » seen at the end of embedding.
  const cfg = makeConfig(ALPHA.length, { nEmbd: 6, nHead: 2, blockSize: 8 });
  const model = initModel(randomSeed(7), cfg);
  const headDim = 3; // slice size fixed for the demo
  const pct = (p) => Math.round(p * 100);
  const num = (n) => (Math.round(n * 100) / 100).toFixed(2);

  const mk = (tag, style, text) => {
    const el = document.createElement(tag);
    if (style) Object.assign(el.style, style);
    if (text != null) el.textContent = text;
    return el;
  };

  // a vector cell (one number); a row of cells; a label
  const cell = (txt, bg, op) => mk("span", { width: "40px", textAlign: "center", padding: "1px 0", fontFamily: "'Fira Code',monospace", fontSize: "10px", border: "1.5px solid var(--ink)", borderRadius: "3px", background: bg, opacity: op == null ? "1" : String(op) }, txt);
  const vecBox = (arr, bg, op) => { const d = mk("div", { display: "flex", gap: "0.16rem" }); arr.forEach((n) => d.append(cell(num(n), bg, op))); return d; };
  const lab = (t, color) => mk("span", { fontFamily: "'Fira Code',monospace", fontSize: "11px", fontWeight: "700", color: color || "var(--ink)" }, t);

  // colors per head: head 0 = teal, head 1 = amber
  const HEAD_BG = ["#e3f1ec", "#fdecd2"];
  const HEAD_COL = ["var(--teal)", "var(--amber)"];
  // a vector shown slice by slice (one color per head, inked separator)
  const headVecBox = (perHead) => {
    const d = mk("div", { display: "flex", gap: "0.16rem", alignItems: "center" });
    perHead.forEach((arr, h) => {
      if (h > 0) d.append(mk("span", { width: "2px", height: "16px", background: "var(--ink)", margin: "0 0.15rem" }));
      arr.forEach((n) => d.append(cell(num(n), HEAD_BG[h])));
    });
    return d;
  };

  // real q/k/v of context « az » (current letter = « z »), split per head,
  // then concat → matO projection → residual. All in REAL microgpt-ts nodes.
  const compute = () => {
    const toks = [...CTX].map((c) => ALPHA.indexOf(c));
    const xs = toks.map((id, pos) => embed(model.tokenEmb, model.positionEmb, id, pos));
    const cur = xs.length - 1;
    // G: we AMPLIFY q/k/v for the demo. The model isn't trained → everything ≈ 0
    // (50/50 attention, tiny outputs). We scale up to make the mechanics
    // (the "choice" AND the concat→matO→residual chain) visible — x stays intact,
    // that's the through-line.
    const G = 90;
    const amp = (v) => v.map((n) => mul(n, node(G)));
    const qFull = amp(linear(xs[cur], model.attn_wq)); // full vector (nEmbd)
    const kFull = xs.map((x) => amp(linear(x, model.attn_wk)));
    const vFull = xs.map((x) => amp(linear(x, model.attn_wv))); // amplified like q/k

    const heads = [];
    for (let h = 0; h < cfg.nHead; h++) {
      const s = h * headDim;
      const qh = qFull.slice(s, s + headDim);
      const kh = kFull.map((k) => k.slice(s, s + headDim));
      const vh = vFull.map((v) => v.slice(s, s + headDim));
      const scores = kh.map((k) => mul(dot(qh, k), node(1 / Math.sqrt(headDim))));
      const w = softmax(scores);
      const outH = vh[0].map((_, j) => vh.reduce((acc, v, t) => acc + w[t].data * v[j].data, 0));
      heads.push({
        qnum: qh.map((n) => n.data),
        knum: kh.map((k) => k.map((n) => n.data)),
        vnum: vh.map((v) => v.map((n) => n.data)),
        scores: scores.map((l) => l.data),
        w: w.map((x) => x.data),
        outH,
      });
    }

    const vecContext = heads.flatMap((hd) => hd.outH); // concat of heads → nEmbd
    const vecAttn = linear(vecContext.map((n) => node(n)), model.attn_wo).map((n) => n.data);
    const xCur = xs[cur].map((n) => n.data);
    const residu = vecAttn.map((a, i) => a + xCur[i]); // residual: we add to vecX

    return {
      xnum: xs.map((x) => x.map((n) => n.data)), // full x (nEmbd) for the split
      heads,
      headOuts: heads.map((hd) => hd.outH),
      vecContext,
      vecAttn,
      residu,
      xCur,
    };
  };

  window.attn = {
    render: (rawStep) => {
      const host = document.getElementById("attn-out");
      if (!host) return;
      const step = Number(rawStep) || 0;
      const d = compute();
      const L = [...CTX]; // ["a", "z"]
      const H0 = d.heads[0];
      host.replaceChildren();

      // x — through-line, always visible: the vector seen in embedding 7b (full)
      const xhead = mk("div", { display: "flex", alignItems: "center", gap: "0.7rem", flexWrap: "wrap", marginBottom: "0.4rem", paddingBottom: "0.35rem", borderBottom: "1.5px dashed var(--slate)" });
      L.forEach((c, t) => {
        const grp = mk("div", { display: "flex", alignItems: "center", gap: "0.25rem" });
        grp.append(lab("vecX(" + c + ")", "var(--teal)"));
        grp.append(vecBox(d.xnum[t], "#eef"));
        xhead.append(grp);
      });
      host.append(xhead);

      // ⓪ split into heads: vecQ(z) sliced into nHead colored pieces
      if (step === 0) {
        const q = mk("div", { display: "flex", alignItems: "flex-start", gap: "0.4rem", marginBottom: "0.45rem" });
        q.append(lab("vecQ(z)", "var(--crimson)"));
        const headsRow = mk("div", { display: "flex", gap: "0.5rem", alignItems: "flex-start" });
        d.heads.forEach((hd, h) => {
          const col = mk("div", { display: "flex", flexDirection: "column", alignItems: "center", gap: "0.2rem" });
          col.append(vecBox(hd.qnum, HEAD_BG[h]));
          col.append(lab("head " + h, HEAD_COL[h]));
          headsRow.append(col);
        });
        q.append(headsRow);
        host.append(q);
        host.append(mk("div", { fontSize: "10.5px", color: "var(--ink)", lineHeight: "1.3" }, "► we unroll head 0; head 1 follows the same mechanics on its slice"));
        return;
      }

      // « head 0 » badge for the detailed steps
      if (step >= 1 && step <= 3) {
        host.append(mk("div", { display: "inline-block", fontSize: "10px", fontWeight: "700", color: "var(--paper)", background: HEAD_COL[0], padding: "1px 7px", borderRadius: "3px", marginBottom: "0.35rem" }, "head 0"));
      }

      // ① q·k: « z »'s query compared to each letter's key (head 0)
      if (step === 1) {
        const q = mk("div", { display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.4rem", flexWrap: "wrap" });
        q.append(lab("vecQ(z)", "var(--crimson)"));
        q.append(vecBox(H0.qnum, "#fde7ea"));
        q.append(lab("= matQ · vecX(z)", "var(--slate)"));
        host.append(q);
        L.forEach((c, t) => {
          const r = mk("div", { display: "flex", alignItems: "center", gap: "0.4rem", margin: "0.2rem 0" });
          r.append(lab("vecK(" + c + ")", "var(--teal)"));
          r.append(vecBox(H0.knum[t], "#e3f1ec"));
          r.append(lab("q·k = " + num(H0.scores[t])));
          host.append(r);
        });
        const wi = H0.scores[1] >= H0.scores[0] ? 1 : 0, lo = 1 - wi;
        host.append(mk("div", { fontSize: "10.5px", color: "var(--ink)", marginTop: "0.45rem", lineHeight: "1.3" },
          `${num(H0.scores[lo])} < ${num(H0.scores[wi])}  →  ${L[wi]} counts more than ${L[lo]} to guess what comes next`));
        return;
      }

      // ② softmax: scores become weights (sum 100 %)
      if (step === 2) {
        L.forEach((c, t) => {
          const r = mk("div", { display: "flex", alignItems: "center", gap: "0.5rem", margin: "0.3rem 0" });
          r.append(lab(c));
          r.append(lab("q·k=" + num(H0.scores[t])));
          r.append(lab("→", "var(--slate)"));
          r.append(mk("div", { height: "16px", width: Math.max(4, pct(H0.w[t]) * 1.4) + "px", background: "var(--crimson)", border: "1.5px solid var(--ink)", borderRadius: "3px" }));
          r.append(lab(pct(H0.w[t]) + " %", "var(--crimson)"));
          host.append(r);
        });
        host.append(mk("div", { fontSize: "10.5px", color: "var(--ink)", marginTop: "0.4rem", lineHeight: "1.3" },
          "softmax → positive weights, sum 100 %: each one's share of attention"));
        return;
      }

      // ③ wSum: head 0 output = values sum weighted by the weights
      if (step === 3) {
        L.forEach((c, t) => {
          const r = mk("div", { display: "flex", alignItems: "center", gap: "0.4rem", margin: "0.2rem 0" });
          r.append(lab("vecV(" + c + ")", "var(--amber)"));
          r.append(lab(pct(H0.w[t]) + " % ×", "var(--crimson)"));
          r.append(vecBox(H0.vnum[t], "#fff", 0.25 + 0.75 * H0.w[t]));
          host.append(r);
        });
        const o = mk("div", { display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.45rem", borderTop: "2px solid var(--ink)", paddingTop: "0.4rem" });
        o.append(lab("head 0 output", HEAD_COL[0]));
        o.append(vecBox(H0.outH, HEAD_BG[0]));
        host.append(o);
        host.append(mk("div", { fontSize: "10.5px", color: "var(--ink)", marginTop: "0.35rem", lineHeight: "1.3" },
          "a vector of 3 (headDim) — this head's contribution"));
        return;
      }

      // ④ concat: we glue the nHead head outputs → vecContext (nEmbd)
      if (step === 4) {
        d.headOuts.forEach((o, h) => {
          const r = mk("div", { display: "flex", alignItems: "center", gap: "0.4rem", margin: "0.2rem 0" });
          r.append(lab("head " + h + " output", HEAD_COL[h]));
          r.append(vecBox(o, HEAD_BG[h]));
          host.append(r);
        });
        const o = mk("div", { display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.45rem", borderTop: "2px solid var(--ink)", paddingTop: "0.4rem" });
        o.append(lab("vecContext", "var(--crimson)"));
        o.append(headVecBox(d.headOuts));
        host.append(o);
        host.append(mk("div", { fontSize: "10.5px", color: "var(--ink)", marginTop: "0.35rem", lineHeight: "1.3" },
          "concat: 3 + 3 = 6 (nEmbd) — the heads glue end to end"));
        return;
      }

      // ⑤ matO: output projection vecContext → vecAttn
      if (step === 5) {
        const a = mk("div", { display: "flex", alignItems: "center", gap: "0.4rem", margin: "0.2rem 0" });
        a.append(lab("vecContext", "var(--ink)"));
        a.append(headVecBox(d.headOuts));
        host.append(a);
        host.append(mk("div", { fontSize: "11px", fontFamily: "'Fira Code',monospace", color: "var(--slate)", margin: "0.25rem 0" }, "↓ linear(vecContext, matO)"));
        const b = mk("div", { display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.1rem", borderTop: "2px solid var(--ink)", paddingTop: "0.4rem" });
        b.append(lab("vecAttn", "var(--crimson)"));
        b.append(vecBox(d.vecAttn, "#f7d7d2"));
        host.append(b);
        host.append(mk("div", { fontSize: "10.5px", color: "var(--ink)", marginTop: "0.35rem", lineHeight: "1.3" },
          "matO: a last learned mixing before rejoining the main flow"));
        return;
      }

      // ⑥ residual: we ADD vecAttn to vecX → the attention block's output
      if (step === 6) {
        const a = mk("div", { display: "flex", alignItems: "center", gap: "0.4rem", margin: "0.2rem 0" });
        a.append(lab("vecAttn", "var(--crimson)"));
        a.append(vecBox(d.vecAttn, "#f7d7d2"));
        host.append(a);
        const x = mk("div", { display: "flex", alignItems: "center", gap: "0.4rem", margin: "0.2rem 0" });
        x.append(lab("+  x(z)", "var(--teal)"));
        x.append(vecBox(d.xCur, "#eef"));
        host.append(x);
        const o = mk("div", { display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.45rem", borderTop: "2px solid var(--ink)", paddingTop: "0.4rem" });
        o.append(lab("output", "var(--ink)"));
        o.append(vecBox(d.residu, "#e3f1ec"));
        host.append(o);
        host.append(mk("div", { fontSize: "10.5px", color: "var(--ink)", marginTop: "0.35rem", lineHeight: "1.3" },
          "the block doesn't overwrite x: it ADDS its finding on top (residual)"));
        return;
      }
    },
  };
}
</script>

<div class="grid" style="gap: 0.5rem; grid-template-columns: minmax(0, 1fr) 26rem; align-items: stretch; height: 100%">

<div class="codecol">

<div class="tag mb-1">07-attention.ts</div>

```ts
import { dot, linear, softmax } from "./helpers";

const { keys, values } = cache;

const vecQ = linear(vecX, matQ);
keys.push(linear(vecX, matK));
values.push(linear(vecX, matV));

const headDim = nEmbd / nHead; // here: 3
const out: Vec = [];
for (let h = 0; h < nHead; h++) {
  const s = h * headDim;
  const qh = vecQ.slice(s, s + headDim);
  const kh = keys.map((k) => k.slice(s, s + headDim));
  const vh = values.map((v) => v.slice(s, s + headDim));

  const scale = Math.sqrt(headDim);
  const w = softmax(kh.map((k) => dot(qh, k) / scale));
  for (let j = 0; j < headDim; j++)
    out.push(vh.reduce((a, v, t) => a + w[t] * v[j], 0));
}

const vecContext = out;
const vecAttn = linear(vecContext, matO);
const output = vecAttn.map((a, i) => a + vecX[i]);
```

</div>

<div v-pre class="panel panel-crimson" style="margin-top: 0; display: flex; flex-direction: column" data-signals="{astep: 0}" data-effect="window.attn.render($astep)">
  <div style="display: flex; flex-wrap: wrap; gap: 0.35rem; margin-bottom: 0.6rem">
    <button class="btn btn-amber" style="font-family: 'Fira Code', monospace; font-size: 0.7rem; text-transform: none" data-attr:disabled="$astep !== 0" data-on:click="$astep = 1">① q·k</button>
    <button class="btn btn-amber" style="font-family: 'Fira Code', monospace; font-size: 0.7rem; text-transform: none" data-attr:disabled="$astep !== 1" data-on:click="$astep = 2">② softmax</button>
    <button class="btn btn-amber" style="font-family: 'Fira Code', monospace; font-size: 0.7rem; text-transform: none" data-attr:disabled="$astep !== 2" data-on:click="$astep = 3">③ wSum</button>
    <button class="btn btn-crimson" style="font-family: 'Fira Code', monospace; font-size: 0.7rem; text-transform: none" data-attr:disabled="$astep !== 3" data-on:click="$astep = 4">④ concat</button>
    <button class="btn" style="font-family: 'Fira Code', monospace; font-size: 0.7rem; text-transform: none" data-attr:disabled="$astep !== 4" data-on:click="$astep = 5">⑤ matO</button>
    <button class="btn" style="font-family: 'Fira Code', monospace; font-size: 0.7rem; text-transform: none" data-attr:disabled="$astep !== 5" data-on:click="$astep = 6">⑥ +x</button>
    <button class="btn" style="font-family: 'Fira Code', monospace; font-size: 0.7rem; text-transform: none; background: var(--slate)" data-on:click="$astep = 0">⓪ ↻</button>
  </div>
  <div id="attn-out" class="codexec" style="background: #fff; min-height: 150px; flex: 1"></div>
</div>

</div>

<style scoped>
.shiki, .slidev-code { font-size: 0.78rem !important; line-height: 1.35 !important; }
.codecol { display: flex; flex-direction: column; min-width: 0 }
.codecol .slidev-code { min-width: 0; overflow: auto; margin: 0 }
</style>

<!--
La démo exécute le VRAI code (mêmes fonctions que 07-attention.ts), pas une
maquette. Le découpage en têtes est explicite (pas ⓪), la tête 0 est déroulée
en détail, puis concat → matO → résidu ferment le bloc.

Note orale — comment interpréter q·k :

1. q·k(z) > q·k(a) NE veut PAS dire « z est précédé de z plutôt que de a ».
   L'attention mesure : pour prédire la lettre SUIVANTE, le token courant (z)
   puise plus dans z que dans a — une PERTINENCE DE CONTEXTE, pas un comptage
   de qui-précède-qui.

2. La query est celle de z (lettre courante), qui regarde EN ARRIÈRE vers a et z
   (lui-même). Poids fort sur z = « pour deviner ma suite, je m'appuie surtout
   sur la dernière lettre » (un effet de récence, par ex.).

3. La statistique « quelle lettre SUIT » vit AILLEURS : la projection finale
   (outputProj → scores → softmax sur le vocabulaire, étape ④ du pipeline).
   L'attention ne sort pas de probabilités de lettres ; elle rassemble du contexte.

4. ICI le modèle n'est PAS entraîné : les q/k/v sont amplifiés ×90 (x intact, fil
   rouge) pour rendre la mécanique visible, mais les nombres sont du BRUIT. Les
   pourcentages sont du hasard grossi — le modèle ne « pense » rien encore. Ce
   n'est qu'APRÈS entraînement que q·k porterait un sens.
-->
