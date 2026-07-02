---
layout: default
---

<script setup>
// THE REAL CODE, EXECUTED. We reuse the EXACT "azur" lineage: seed 7,
// context "a z", target "u" (azur) — like 7g. At each step we redo the
// REAL microgpt loop: forward pass (gpt) → loss (crossEntropy) → backward
// → adamStep. We INSIST on this one case → Adam turns the 804 knobs and "u"
// becomes more and more probable. It all comes from the trunk (pure modules, safe
// in the browser); nothing is made up, these are Karpathy's hyperparameters.
import { initModel, makeConfig, gpt, emptyCache } from "microgpt-ts/model";
import { crossEntropy } from "microgpt-ts/loss";
import { backward } from "microgpt-ts/autograd";
import { softmax } from "microgpt-ts/attention";
import { adamStep, initAdam, makeAdamConfig } from "microgpt-ts/adam";
import { randomSeed, flattenParams } from "microgpt-ts/parameters";

if (typeof window !== "undefined") {
  const ALPHA = " abcdefghijklmnopqrstuvwxyz";
  const cfg = makeConfig(ALPHA.length, { nEmbd: 6, nHead: 2, blockSize: 8 });
  const adamCfg = makeAdamConfig(1000); // Karpathy defaults: lr 0.01 · β1 0.85 · β2 0.99 · eps 1e-8
  const idA = ALPHA.indexOf("a"), idZ = ALPHA.indexOf("z"), idU = ALPHA.indexOf("u");
  const MAX = 16;

  // p("u" | "a z"): two forward passes (a then z, KV-cache), softmax over "u".
  const probU = (model) => {
    let c = emptyCache();
    ({ cache: c } = gpt(model, cfg, idA, 0, c));
    const { scores } = gpt(model, cfg, idZ, 1, c);
    return softmax(scores)[idU].data;
  };

  // Replays n Adam steps from the start (deterministic, reset-safe).
  const replay = (n) => {
    let model = initModel(randomSeed(7), cfg);
    let opt = initAdam(flattenParams(model).length);
    const hist = [{ pu: probU(model), loss: null }];
    for (let s = 0; s < n; s++) {
      let c = emptyCache();
      ({ cache: c } = gpt(model, cfg, idA, 0, c));
      const { scores } = gpt(model, cfg, idZ, 1, c);
      const loss = crossEntropy(scores, idU); // −ln p("u")
      backward(loss); // each knob gets its share of the error
      ({ model, opt } = adamStep(model, opt, s, adamCfg)); // Adam turns the 804 knobs
      hist.push({ pu: probU(model), loss: loss.data });
    }
    return hist;
  };

  const mk = (tag, style, text) => {
    const el = document.createElement(tag);
    if (style) Object.assign(el.style, style);
    if (text != null) el.textContent = text;
    return el;
  };

  window.adam = {
    render: (rawN) => {
      const host = document.getElementById("adam-out");
      if (!host) return;
      const n = Math.min(Number(rawN) || 0, MAX);
      host.replaceChildren();
      const hist = replay(n);
      const cur = hist[hist.length - 1];

      // Header: the case, the step, the loss
      const head = mk("div", { fontFamily: "'Anton',sans-serif", textTransform: "uppercase", fontSize: "0.74rem", color: "var(--ink)", marginBottom: "0.2rem" });
      head.append(mk("span", {}, "a z → "));
      head.append(mk("span", { color: "var(--teal)" }, "u"));
      head.append(mk("span", { fontFamily: "'Fira Code',monospace", fontSize: "0.62rem", color: "var(--slate)", textTransform: "none", marginLeft: "0.35rem" }, "(azur) · step " + n + "/" + MAX));
      if (cur.loss != null) head.append(mk("span", { fontFamily: "'Fira Code',monospace", fontSize: "0.66rem", color: "var(--crimson)", marginLeft: "0.5rem" }, "loss " + cur.loss.toFixed(2)));
      host.append(head);

      // Histogram: p("u") at each step (the through-line that climbs)
      const chart = mk("div", { display: "flex", alignItems: "flex-end", gap: "3px", height: "108px", padding: "0.2rem 0", borderBottom: "2px solid var(--ink)" });
      hist.forEach((h, i) => {
        const isCur = i === hist.length - 1;
        const col = mk("div", { flex: "1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%" });
        col.append(mk("div", { fontFamily: "'Fira Code',monospace", fontSize: "8px", color: isCur ? "var(--teal)" : "var(--slate)", fontWeight: isCur ? "700" : "400", marginBottom: "2px" }, Math.round(h.pu * 100) + ""));
        col.append(mk("div", { width: "100%", height: (h.pu * 96).toFixed(0) + "px", background: isCur ? "var(--teal)" : "#bcd9d2", border: "1px solid var(--ink)", borderRadius: "2px 2px 0 0" }));
        chart.append(col);
      });
      host.append(chart);

      // Verdict
      const verdict = mk("div", { fontSize: "11px", lineHeight: "1.4", marginTop: "0.4rem", color: "var(--ink)" });
      if (n === 0) {
        verdict.append(document.createTextNode("\"u\" is ~"));
        verdict.append(mk("span", { fontWeight: "700" }, Math.round(cur.pu * 100) + " %"));
        verdict.append(document.createTextNode(" (≈ 1 in 27, random). Click to insist."));
      } else {
        verdict.append(mk("span", { fontWeight: "700", color: "var(--teal)" }, "\"u\" rose to " + Math.round(cur.pu * 100) + " %"));
        verdict.append(document.createTextNode(n >= MAX ? ": the model learned \"after a z, comes u\"." : " — Adam turns the knobs, the error melts"));
      }
      host.append(verdict);
    },
  };
}
</script>

# Adam
<div class="rule-ink w-24 my-2" />
<p class="text-base" style="color: var(--slate)">
{{ $t('adam.stepByStep') }}
</p>

<div style="display: flex; align-items: stretch; gap: 0.22rem; font-family: 'Fira Code', monospace; font-size: 0.62rem; margin: 0.3rem 0 0.15rem; flex-wrap: wrap">
  <div style="background: var(--paper); color: var(--ink); padding: 0.18rem 0.42rem; border: 2px solid var(--ink); border-radius: 3px; line-height: 1.15" v-html="$t('adam.pipe1')"></div>
  <span style="align-self: center; color: var(--ink); font-size: 1.86rem">→</span>
  <div style="background: #0f5e5a; color: var(--paper); padding: 0.18rem 0.42rem; border: 2px solid var(--ink); border-radius: 3px; line-height: 1.15" v-html="$t('adam.pipe2')"></div>
  <span style="align-self: center; color: var(--ink); font-size: 1.86rem">→</span>
  <div style="background: #b5223a; color: var(--paper); padding: 0.18rem 0.42rem; border: 2px solid var(--ink); border-radius: 3px; line-height: 1.15" v-html="$t('adam.pipe3')"></div>
  <span style="align-self: center; color: var(--ink); font-size: 1.86rem">→</span>
  <div style="background: #2b3a42; color: var(--paper); padding: 0.18rem 0.42rem; border: 2px solid var(--ink); border-radius: 3px; line-height: 1.15" v-html="$t('adam.pipe4')"></div>
  <span style="align-self: center; color: var(--ink); font-size: 1.86rem">→</span>
  <div style="background: #e8a33d; color: var(--ink); padding: 0.18rem 0.42rem; border: 3px solid var(--ink); border-radius: 3px; font-weight: 700; line-height: 1.15" v-html="$t('adam.pipe5')"></div>
  <span style="align-self: center; color: var(--ink); font-size: 1.86rem">⟲</span>
</div>


<div class="grid gap-5" style="grid-template-columns: 2.6fr 2.4fr; align-items: start">

<div class="codecol">

<div class="panel" style="border-color: var(--amber); box-shadow: 5px 5px 0 var(--amber); margin-bottom: 0.4rem">
  <bgpt-sfx text="ADAptive Moment" color="amber" size="1.3rem" /> <span class="text-sm" style="color: var(--slate)">(Estimation Optimizer)</span><br>
  
  <p class="text-sm mt-1 mb-0" v-html="$t('adam.gradient')"></p>
</div>

<div class="tag mb-1">11-adam.ts</div>

```ts
// Adam's empirical settings (Karpathy's values, "blessed optimizer")
const lr = 0.01; // learning rate
const β1 = 0.85; // 15% room for novelty
const β2 = 0.99; // 1% room for novelty

const g = p.grad;            
m = β1 * m + (1 - β1) * g; // m = recent moving average
v = β2 * v + (1 - β2) * g * g; // v = long moving average of squares 

p.data -= lr * m / Math.sqrt(v); // step smoothed by m and slowed by v
```

</div>

<div class="codecol">

<div v-pre class="panel panel-crimson" style="display: flex; flex-direction: column; min-width: 0" data-signals="{n: 0}" data-effect="window.adam.render($n)">
  <div style="display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 0.5rem">
    <button class="btn btn-crimson" style="font-family: 'Fira Code', monospace; font-size: 0.74rem; text-transform: none" data-attr:disabled="$n >= 16" data-on:click="$n = $n + 1">▶ one Adam step</button>
    <button class="btn" style="font-family: 'Fira Code', monospace; font-size: 0.74rem; text-transform: none; background: var(--slate)" data-on:click="$n = 0">↻ reset</button>
  </div>
  <div id="adam-out" class="codexec" style="background: #fff; flex: 1 1 auto"></div>
</div>

</div>

</div>

<style scoped>
.shiki, .slidev-code { font-size: 0.66rem !important; line-height: 1.25 !important; }
.slidev-code { margin: 0 !important; }
.tag { font-size: 0.84rem; }
.codecol { display: flex; flex-direction: column; min-width: 0; }
/* inline code: monospace crimson, WITHOUT the theme's decorative backticks */
:deep(code) { font-family: "Fira Code", monospace; font-size: 0.9em; color: var(--crimson); background: transparent !important; padding: 0 !important; }
:deep(code)::before, :deep(code)::after { content: "" !important; }
</style>

<!--
Refonte (l'ancienne version était hors-sol : poids abstrait, gradients inventés,
vocabulaire « biais » non contextualisé). Ici tout est fidèle et branché au lignage :
- CE QU'EST ADAM : l'optimiseur. backward donne le SENS (gradient), Adam le COMBIEN.
  Nom = ADAptive Moment estimation → les deux buffers m (moment d'ordre 1, moyenne)
  et v (moment d'ordre 2, agitation = moyenne des carrés). C'est le « monstre » de
  microgpt (Karpathy : the blessed optimizer).
- NOTRE CODE : le bloc montre la CONSTRUCTION de chaque grandeur (sinon m/v/g/lr
  tombent du ciel) : lr/β1/β2 = constantes choisies (Karpathy) ; m, v = deux mémoires
  par bouton, à ZÉRO au départ, qu'on met à jour en mélangeant l'ancien + une pincée de
  g (resp. g²) ; g = p.grad (vient de backward) ; lrT = lr qui décroît ; le pas final.
  C'est une VERSION D'ENSEIGNEMENT du vrai adamStep (11-adam.ts, FP pur) : on a retiré
  du visuel le `+ eps` (anti division par 0, 1e-8) et le recalage des tout premiers pas
  (`m̂ = m/(1−β1^(step+1))`, idem v̂ — m,v partent de 0 donc sous-estiment au début).
  ⚠️ Ce recalage est une homonymie : RIEN à voir avec le biais d'une couche linéaire
  (microgpt n'en a aucun). La DÉMO, elle, utilise le vrai adamStep (avec eps + recalage).
- DEUX IDÉES, avec analogie correcte :
  · momentum (m) = bille lourde : moyenne lissée du gradient, garde la direction.
  · pas adaptatif (v) = on divise par √agitation : chaque bouton a son propre dosage.
- DÉMO (vraie boucle) : seed 7, « a z → u ». On répète passe avant → crossEntropy →
  backward → adamStep. p(« u ») grimpe ~3 % → ~99 % et la loss tombe ~3,4 → ~0,02 en
  ~16 pas : on VOIT le modèle apprendre « après a z, viens u ». (Zoom sur UN cas ;
  l'entraînement réel, lui, brasse tout le corpus → slide suivante.)
-->
