---
layout: default
---

<script setup>
// THE REAL CODE, EXECUTED — the MLP. The input = the attention block's OUTPUT (slide 7ca):
// we replay the SAME computation (seed 7, raw embeddings, q·k ×90, concat → matO → + residual)
// to recover EXACTLY that vector — no surprise. Then: fc1 UNFOLDS (nEmbd →
// 4·nEmbd), ReLU is the ELBOW (negatives → 0, "dead" neurons in gray), fc2 FOLDS
// back to nEmbd. The MLP itself has no q/k/v: it looks at no neighbor, it thinks alone.
import { dot, linear, softmax } from "microgpt-ts/attention";
import { embed } from "microgpt-ts/embeddings";
import { initModel, makeConfig } from "microgpt-ts/model";
import { randomSeed } from "microgpt-ts/parameters";
import { node, mul, relu } from "microgpt-ts/autograd";

if (typeof window !== "undefined") {
  const ALPHA = " abcdefghijklmnopqrstuvwxyz";
  const CTX = "az"; // same context as 7c; the current token = « z »
  const cfg = makeConfig(ALPHA.length, { nEmbd: 6, nHead: 2, blockSize: 8 });
  const model = initModel(randomSeed(7), cfg);
  const G = 90; // q·k scale-up, same as 7ca (otherwise 50/50 attention)
  const amp = (vec) => vec.map((n) => mul(n, node(G)));
  const headDim = 3; // same slice as 7ca
  // The MLP input = the attention block's OUTPUT (slide 7ca), IDENTICALLY:
  // q/k/v scaled ×90 → per head (q·k, softmax, weighted sum) → concat → matO
  // → + residual (added to x). NO rmsnorm: we reuse the vector shown in 7ca.
  const ids = [...CTX].map((c) => ALPHA.indexOf(c));
  const embs = ids.map((id, pos) => embed(model.tokenEmb, model.positionEmb, id, pos));
  const cur = ids.length - 1;
  const qFull = amp(linear(embs[cur], model.attn_wq));
  const kFull = embs.map((e) => amp(linear(e, model.attn_wk)));
  const vFull = embs.map((e) => amp(linear(e, model.attn_wv)));
  const headOuts = [];
  for (let h = 0; h < cfg.nHead; h++) {
    const s = h * headDim;
    const qh = qFull.slice(s, s + headDim);
    const kh = kFull.map((k) => k.slice(s, s + headDim));
    const vh = vFull.map((v) => v.slice(s, s + headDim));
    const w = softmax(kh.map((k) => mul(dot(qh, k), node(1 / Math.sqrt(headDim)))));
    headOuts.push(vh[0].map((_, j) => vh.reduce((acc, v, t) => acc + w[t].data * v[j].data, 0)));
  }
  const vecContext = headOuts.flat();
  const vecAttn = linear(vecContext.map((n) => node(n)), model.attn_wo).map((n) => n.data);
  const xCur = embs[cur].map((n) => n.data);
  const x = vecAttn.map((a, i) => node(a + xCur[i])); // = attention block output (7ca)
  const num = (n) => (Math.round(n * 100) / 100).toFixed(2);

  const mk = (tag, style, text) => {
    const el = document.createElement(tag);
    if (style) Object.assign(el.style, style);
    if (text != null) el.textContent = text;
    return el;
  };
  const cell = (v, bg, color) =>
    mk("span", { width: "30px", textAlign: "center", padding: "0", fontFamily: "'Fira Code',monospace", fontSize: "9px", border: "1.5px solid var(--ink)", borderRadius: "3px", background: bg, color: color || "var(--ink)" }, num(v));
  const wrap = (style) => mk("div", { display: "flex", flexWrap: "wrap", gap: "0.16rem", margin: "0.06rem 0", ...(style || {}) });
  const head = (t) => mk("div", { fontFamily: "'Anton',sans-serif", textTransform: "uppercase", fontSize: "0.7rem", color: "var(--crimson)", margin: "0.16rem 0 0.02rem" }, t);

  window.mlp = {
    render: (rawStep) => {
      const host = document.getElementById("mlp-out");
      if (!host) return;
      const step = Number(rawStep) || 0;
      host.replaceChildren();

      // the MLP input = the attention block's output (7ca)
      host.append(head("Vector X  → attention block output"));
      const rin = wrap();
      x.forEach((nd) => rin.append(cell(nd.data, "#fff")));
      host.append(rin);
      if (step === 0) return;

      const hidden = linear(x, model.mlp_fc1); // expansion 6 → 24 (pre-ReLU)
      host.append(head("① fc1 → projection of X into big matrix"));
      const rh = wrap();
      hidden.forEach((nd) => rh.append(cell(nd.data, "#eef")));
      host.append(rh);

      if (step >= 2) {
        host.append(head("② ReLU, the elbow, negatives → 0"));
        const rr = wrap();
        hidden.forEach((nd) => {
          const r = relu(nd).data;
          rr.append(cell(r, r === 0 ? "#dcdcdc" : "#fde7c8", r === 0 ? "#999" : "var(--ink)"));
        });
        host.append(rr);
      }

      if (step >= 3) {
        const hiddenRelu = hidden.map((h) => relu(h));
        const out = linear(hiddenRelu, model.mlp_fc2); // contraction 24 → 6
        host.append(head("③ fc2 — folds"));
        const ro = wrap();
        out.forEach((nd) => ro.append(cell(nd.data, "#f7d7d2", "var(--crimson)")));
        host.append(ro);
      }
    },
  };
}
</script>

# Perceptron

<div class="rule-ink w-24 my-3" />

<div class="grid gap-5" style="grid-template-columns: 1.03fr 1.07fr; align-items: start">

<div>

<div class="panel panel-teal">
  <div class="label-teal" style="font-size: 1.05rem; ">multi-layer perceptron</div>
    <div class="text-xs" style="margin: 0 0 0.4rem 0; line-height: 1.4">{{ $t('mlp.clarify') }}</div><br>
    <div style="display: flex; gap: 0.5rem; align-items: stretch">
    <div style="flex: 1; text-align: center">
      <svg viewBox="0 0 150 76" style="width: 100%; height: auto; border: 1.5px solid var(--ink); border-radius: 4px; background: #fff">
        <circle cx="32" cy="20" r="4" fill="var(--crimson)" />
        <circle cx="118" cy="22" r="4" fill="var(--crimson)" />
        <circle cx="28" cy="56" r="4" fill="var(--crimson)" />
        <circle cx="120" cy="54" r="4" fill="var(--crimson)" />
        <circle cx="75" cy="12" r="4" fill="var(--crimson)" />
        <circle cx="74" cy="66" r="4" fill="var(--crimson)" />
        <circle cx="66" cy="36" r="4" fill="var(--teal)" />
        <circle cx="84" cy="38" r="4" fill="var(--teal)" />
        <circle cx="75" cy="46" r="4" fill="var(--teal)" />
        <line x1="20" y1="60" x2="130" y2="16" stroke="var(--slate)" stroke-width="2" stroke-dasharray="5 4" />
      </svg>
      <div class="text-xs" style="margin-top: 0.05rem">{{ $t('mlp.before') }}<strong style="color: var(--crimson)">✗</strong></div>
    </div>
    <div style="flex: 1; text-align: center">
      <svg viewBox="0 0 150 76" style="width: 100%; height: auto; border: 1.5px solid var(--ink); border-radius: 4px; background: #fff">
        <circle cx="32" cy="20" r="4" fill="var(--crimson)" />
        <circle cx="118" cy="22" r="4" fill="var(--crimson)" />
        <circle cx="28" cy="56" r="4" fill="var(--crimson)" />
        <circle cx="120" cy="54" r="4" fill="var(--crimson)" />
        <circle cx="75" cy="12" r="4" fill="var(--crimson)" />
        <circle cx="74" cy="66" r="4" fill="var(--crimson)" />
        <circle cx="66" cy="36" r="4" fill="var(--teal)" />
        <circle cx="84" cy="38" r="4" fill="var(--teal)" />
        <circle cx="75" cy="46" r="4" fill="var(--teal)" />
        <ellipse cx="75" cy="41" rx="20" ry="18" fill="none" stroke="var(--teal)" stroke-width="2.5" />
      </svg>
      <div class="text-xs" style="margin-top: 0.05rem">{{ $t('mlp.after') }}<strong style="color: var(--teal)">✓</strong></div>
    </div>
  </div>
  <br>
  <p class="text-xs" style="margin: 0 0 0.4rem 0; line-height: 1.4" v-html="$t('mlp.twoLayers')"></p>
  <ul class="text-xs" style="list-style-position: inside; padding-left: 0; margin: 0 0 0.4rem 0; line-height: 1.55">
    <li v-html="$t('mlp.li1')"></li>
    <li v-html="$t('mlp.li2')"></li>
    <li v-html="$t('mlp.li3')"></li>
  </ul>
  <p class="text-xs opacity-70" style="margin: 0.25rem 0 0" v-html="$t('mlp.fcNote')"></p>
</div>

</div>

<div class="codecol">

<div class="tag mb-1">{{ $t('mlp.tag') }}</div>

```ts
const relu = (vec: Vec): Vec => vec.map((n) => (n < 0 ? 0 : n));
const mlp  = (x: Vec, fc1: Mat, fc2: Mat): Vec => {
  const temp = relu(linear(x, fc1));
  return linear(temp, fc2);
};
```

<div v-pre class="panel panel-crimson" style="margin-top: 0.3rem" data-signals="{step: 0}" data-effect="window.mlp.render($step)">
  <div style="display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 0.35rem">
    <button class="btn btn-amber" style="font-family: 'Fira Code', monospace; font-size: 0.72rem; text-transform: none" data-attr:disabled="$step !== 0" data-on:click="$step = 1">① fc1</button>
    <button class="btn btn-crimson" style="font-family: 'Fira Code', monospace; font-size: 0.72rem; text-transform: none" data-attr:disabled="$step !== 1" data-on:click="$step = 2">② ReLU</button>
    <button class="btn" style="font-family: 'Fira Code', monospace; font-size: 0.72rem; text-transform: none" data-attr:disabled="$step !== 2" data-on:click="$step = 3">③ fc2</button>
    <button class="btn" style="font-family: 'Fira Code', monospace; font-size: 0.72rem; text-transform: none; background: var(--slate)" data-on:click="$step = 0">↻</button>
  </div>
  <div id="mlp-out" class="codexec" style="background: #fff; min-height: 150px"></div>
</div>

</div>

</div>

<style scoped>
.shiki, .slidev-code { font-size: 0.69rem !important; line-height: 1.35 !important; }
.tag { font-size: 0.9rem; }
.codecol { display: flex; flex-direction: column; min-width: 0 }
.codecol .slidev-code { min-width: 0; overflow: auto; margin: 0 }
</style>

<!--
- « Perceptron » (Rosenblatt, 1958) = l'ancêtre du neurone artificiel : somme
  pondérée + seuil. MLP = on en empile (multi-layer). C'est lui qui fait le gros
  du « raisonnement » par position. Karpathy : le Transformer ALTERNE
  communication (attention) et calcul (MLP). Le sablier : fc1 DÉPLIE (×4 = plus
  de détecteurs de motifs), ReLU est le COUDE, fc2 REPLIE vers nEmbd.

- POURQUOI LE LINÉAIRE NE SUFFIT PAS (le cœur de la slide). Empiler des couches
  PUREMENT linéaires (additions + produits de matrices) revient à UNE SEULE
  grande transformation linéaire : on peut étirer, tourner, projeter l'espace
  des vecteurs… mais jamais le PLIER. Or le langage est ambigu et contextuel :
  « avocat » = un métier, un fruit, la robe du barreau… selon le voisinage
  (« avocat bien mûr » vs « cabinet d'avocats »). Une simple carte de distances
  ne suffit pas : certaines proximités ne doivent compter que dans CERTAINS
  contextes.

- LE COUDE (ReLU) casse la linéarité → le réseau apprend des seuils et des
  réponses conditionnelles, il peut PLIER l'espace, créer des reliefs, des
  frontières STATISTIQUES SOUPLES (pas des boîtes nettes autour des concepts).
  Division du travail : l'attention SÉLECTIONNE quels mots du contexte pèsent ;
  le MLP non-linéaire MODULE la représentation.

- GARDE-FOUS (rester vrai) :
  · les activations ne donnent pas de contours NETS — des faisceaux de
    régularités qui s'activent différemment selon le contexte.
  · ReLU / GELU / SwiGLU ≠ Softmax. Les activations feed-forward apportent la
    non-linéarité ; Softmax transforme des scores en DISTRIBUTION (pondérer
    l'attention, ou les probas de sortie) — métier différent.
  · la dérivée ne « découvre » pas la proximité entre tokens : elle sert à
    l'ENTRAÎNEMENT (rétropropagation) pour ajuster les poids et réduire l'erreur.

- Démo NON entraînée : les nombres sont du bruit ; on montre la MÉCANIQUE
  (déplie / coude / replie), pas une « pensée ».
-->
