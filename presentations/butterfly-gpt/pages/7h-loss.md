---
layout: default
---

<script setup>
// THE REAL CODE, EXECUTED. We RESUME the 7g histogram: seed 7, context « a z »,
// the 27 probabilities (softmax of the untrained model's scores). Here we do NOT
// redo gpt or softmax — we GRAB that histogram and derive the loss: −ln p(« u »)
// = the error number. It's THIS number that the backward pass will lower.
import { initModel, makeConfig, gpt, emptyCache } from "microgpt-ts/model";
import { softmax } from "microgpt-ts/attention";
import { randomSeed } from "microgpt-ts/parameters";

if (typeof window !== "undefined") {
  const ALPHA = " abcdefghijklmnopqrstuvwxyz";
  const cfg = makeConfig(ALPHA.length, { nEmbd: 6, nHead: 2, blockSize: 8 });
  const model = initModel(randomSeed(7), cfg);
  const idA = ALPHA.indexOf("a"), idZ = ALPHA.indexOf("z"), idU = ALPHA.indexOf("u");

  // Same 27 probs as at the end of 7g (softmax of the scores for « a z »).
  let c = emptyCache();
  ({ cache: c } = gpt(model, cfg, idA, 0, c));
  const { scores } = gpt(model, cfg, idZ, 1, c);
  const probs = softmax(scores).map((n) => n.data);
  const pu = probs[idU];
  const loss = -Math.log(pu);

  const mk = (tag, style, text) => {
    const el = document.createElement(tag);
    if (style) Object.assign(el.style, style);
    if (text != null) el.textContent = text;
    return el;
  };
  const head = (t, color) => mk("div", { fontFamily: "'Anton',sans-serif", textTransform: "uppercase", fontSize: "0.7rem", color: color || "var(--crimson)", margin: "0.1rem 0 0.15rem" }, t);

  window.lossDemo = {
    render: (rawStep) => {
      const host = document.getElementById("loss-out");
      if (!host) return;
      const step = Number(rawStep) || 0;
      host.replaceChildren();

      // title: a z → u
      const seq = mk("div", { fontFamily: "'Anton',sans-serif", fontSize: "0.95rem", letterSpacing: "0.05em", marginBottom: "0.15rem" });
      seq.append(mk("span", {}, "a z → "));
      seq.append(mk("span", { color: "var(--teal)" }, "u"));
      seq.append(mk("span", { fontFamily: "'Fira Code',monospace", fontSize: "0.6rem", color: "var(--slate)", textTransform: "none", marginLeft: "0.35rem" }, "(azur · untrained model)"));
      host.append(seq);

      // THE 7g HISTOGRAM (still there): 27 probs, « u » in teal.
      const chart = mk("div", { display: "flex", alignItems: "flex-end", gap: "2px", height: "96px", borderBottom: "2px solid var(--ink)", paddingTop: "0.1rem" });
      probs.forEach((p, i) => {
        const isU = i === idU;
        const col = mk("div", { flex: "1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%" });
        col.append(mk("div", { width: "100%", height: (p * 900).toFixed(0) + "px", background: isU ? "var(--teal)" : "var(--crimson)", border: "1px solid var(--ink)", borderRadius: "2px 2px 0 0" }));
        col.append(mk("div", { fontFamily: "'Fira Code',monospace", fontSize: "7px", color: isU ? "var(--teal)" : "var(--slate)", fontWeight: isU ? "700" : "400", marginTop: "1px" }, ALPHA[i] === " " ? "␣" : ALPHA[i]));
        chart.append(col);
      });
      host.append(chart);

      if (step === 0) {
        return;
      }

      // −ln p(u) = the loss
      host.append(head('−ln p("u") = the loss', "var(--crimson)"));
      const big = mk("div", { display: "flex", alignItems: "baseline", gap: "0.5rem", margin: "0.05rem 0" });
      big.append(mk("span", { fontFamily: "'Fira Code',monospace", fontSize: "0.78rem", color: "var(--slate)" }, "−ln(" + pu.toFixed(3) + ") ="));
      big.append(mk("span", { fontFamily: "'Anton',sans-serif", fontSize: "2.1rem", color: "var(--crimson)", lineHeight: "1" }, loss.toFixed(2)));
      host.append(big);
      const punch = mk("div", { fontSize: "11px", color: "var(--ink)", marginTop: "0.3rem", fontWeight: "700" });
      punch.append(document.createTextNode("This number = "));
      punch.append(mk("span", { color: "var(--crimson)" }, "the starting point of the backward pass"));
      punch.append(document.createTextNode("."));
      host.append(punch);
    },
  };
}
</script>

# Loss

<div class="rule-ink w-24 my-2" />

<div class="grid gap-5" style="grid-template-columns: 2.4fr 2.6fr; align-items: start">

<div class="codecol">

<bgpt-sfx text-key="loss.sfx" color="amber" size="1.3rem" />

<p class="text-sm mt-1 mb-2" v-html="$t('loss.intro')"></p>

<div class="tag mb-1">10-loss.ts</div>

```ts
import { neg, log } from "./03-autograd";
import { softmax } from "./07-attention";

export const crossEntropy = (scores, targetId) => {
  const probs = softmax(scores);   
  return neg(log(probs[targetId]));  
};
```

<div class="panel mt-2" style="border-color: var(--amber); box-shadow: 5px 5px 0 var(--amber); padding: 0.5rem 1rem;">
  <p class="text-sm mt-0 mb-0" v-html="$t('loss.surprise')"></p>
</div>

</div>

<div class="codecol">

<div v-pre class="panel panel-crimson" style="display: flex; flex-direction: column; min-width: 0" data-signals="{step: 0}" data-effect="window.lossDemo.render($step)">
  <div style="display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 0.5rem">
    <button class="btn btn-crimson" style="font-family: 'Fira Code', monospace; font-size: 0.72rem; text-transform: none" data-attr:disabled="$step !== 0" data-on:click="$step = 1">compute the loss: −ln p("u")</button>
    <button class="btn" style="font-family: 'Fira Code', monospace; font-size: 0.72rem; text-transform: none; background: var(--slate)" data-on:click="$step = 0">↻ reset</button>
  </div>
  <div id="loss-out" class="codexec" style="background: #fff; flex: 1 1 auto"></div>
</div>

</div>

</div>

<style scoped>
.shiki, .slidev-code { font-size: 0.62rem !important; line-height: 1.3 !important; }
.slidev-code { margin: 0 !important; }
.tag { font-size: 0.86rem; }
.codecol { display: flex; flex-direction: column; min-width: 0; }
:deep(code) { font-family: "Fira Code", monospace; font-size: 0.9em; color: var(--crimson); background: transparent !important; padding: 0 !important; }
:deep(code)::before, :deep(code)::after { content: "" !important; }
</style>

<!--
Slide LOSS — comble le trou entre 7g (gpt → scores → softmax → histogramme) et la
passe arrière. On PIQUE l'histogramme de 7g (mêmes 27 probas, seed 7, « a z ») :
- au départ, l'histogramme de 7g : presque plat, « u » ≈ 3,4 % (≈ 1/27, le hasard).
- bouton → on lit p(« u ») et on prend −ln → UN chiffre : la loss.
  Échelle (cf. 10-loss.ts) : p≈1 → 0 ; p≈½ → 0,69 ; p≈0 → +∞ (le log châtie les
  erreurs faites avec aplomb). Modèle non entraîné → loss ≈ ln(27) ≈ 3,3.
- PUNCH : ce chiffre unique est le POINT DE DÉPART de la passe arrière — backward le
  dérive pour distribuer le blâme à chaque paramètre (slides suivantes : Adam).
- Rappel déroulé : 6f montrait déjà softmax + −ln, mais sur un mini-forward JOUET
  (chapitre autograd, avant l'archi) pour enseigner le moteur. Ici c'est le vrai gpt.
-->
