---
layout: default
---

<script setup>
// THE RESIDUAL, EXECUTED. Same computation as 7c (seed 7, raw embeddings, q·k ×90):
// attention produces a CORRECTION (head 0 = the numbers from 7c). The residual = we
// ADD it to the input vector x (we don't erase x); then rmsnorm resets the
// volume to ~1 → the MLP's input (next slide). Untrained model: the
// correction is tiny (≈ 0), it's rmsnorm that sets the scale. NB: wo (attention's
// internal projection) is omitted here — simplified version, faithful in 7g.
import { attention, linear } from "microgpt-ts/attention";
import { rmsnorm } from "microgpt-ts/rmsnorm";
import { embed } from "microgpt-ts/embeddings";
import { initModel, makeConfig } from "microgpt-ts/model";
import { randomSeed } from "microgpt-ts/parameters";
import { add, node, mul } from "microgpt-ts/autograd";

if (typeof window !== "undefined") {
  const ALPHA = " abcdefghijklmnopqrstuvwxyz";
  const CTX = "az"; // same context as 7c; current token = "z"
  const cfg = makeConfig(ALPHA.length, { nEmbd: 6, nHead: 2, blockSize: 8 });
  const model = initModel(randomSeed(7), cfg);
  const headDim = cfg.nEmbd / cfg.nHead;
  const num = (n) => (Math.round(n * 100) / 100).toFixed(2);
  const addVec = (a, b) => a.map((ai, i) => add(ai, b[i]));
  const G = 90; // q·k magnification, same as 7c
  const amp = (vec) => vec.map((n) => mul(n, node(G)));

  // Same computation as the MLP slide → same numbers throughout.
  const ids = [...CTX].map((c) => ALPHA.indexOf(c));
  const embs = ids.map((id, pos) => embed(model.tokenEmb, model.positionEmb, id, pos));
  const keys = embs.map((e) => amp(linear(e, model.attn_wk)));
  const values = embs.map((e) => linear(e, model.attn_wv));
  const cur = ids.length - 1;
  const q = amp(linear(embs[cur], model.attn_wq));
  const correction = attention(q, keys, values, cfg.nHead); // what the attention block proposes
  const summed = addVec(correction, embs[cur]); // residual: x + correction
  const normed = rmsnorm(summed); // → MLP input
  const D = {
    cor: correction.map((n) => n.data),
    x: embs[cur].map((n) => n.data),
    sum: summed.map((n) => n.data),
    mlp: normed.map((n) => n.data),
  };

  const mk = (tag, style, text) => {
    const el = document.createElement(tag);
    if (style) Object.assign(el.style, style);
    if (text != null) el.textContent = text;
    return el;
  };
  const cell = (v, bg, color) =>
    mk("span", { width: "34px", textAlign: "center", padding: "1px 0", fontFamily: "'Fira Code',monospace", fontSize: "10px", border: "1.5px solid var(--ink)", borderRadius: "3px", background: bg, color: color || "var(--ink)" }, num(v));
  const lab = (t, color) => mk("span", { width: "24px", fontFamily: "'Fira Code',monospace", fontSize: "11px", fontWeight: "700", color: color || "var(--ink)" }, t);
  const head = (t, color) => mk("div", { fontFamily: "'Anton',sans-serif", textTransform: "uppercase", fontSize: "0.7rem", color: color || "var(--crimson)", margin: "0.3rem 0 0.05rem" }, t);
  const note = (t) => mk("div", { fontSize: "10.5px", color: "var(--ink)", marginTop: "0.35rem", lineHeight: "1.3" }, t);
  const row = (arr, bg, prefix, pcolor) => {
    const d = mk("div", { display: "flex", alignItems: "center", gap: "0.16rem", margin: "0.08rem 0" });
    d.append(lab(prefix == null ? "" : prefix, pcolor));
    arr.forEach((v) => d.append(cell(v, bg)));
    return d;
  };

  window.bridge = {
    render: (rawStep) => {
      const host = document.getElementById("bridge-out");
      if (!host) return;
      const step = Number(rawStep) || 0;
      host.replaceChildren();

      // always: x = the current vector (embedding of "z", running thread of 7b/7c)
      host.append(head("x — the current vector (embedding of \"z\")", "var(--ink)"));
      const rx = mk("div", { display: "flex", alignItems: "center", gap: "0.16rem", margin: "0.08rem 0" });
      rx.append(lab("x", "var(--slate)"));
      D.x.forEach((v, i) => rx.append(cell(v, i < headDim ? "#e3f1ec" : "#eef")));
      host.append(rx);
      if (step === 0) {
        host.append(note("the vector of \"z\": its first 3 numbers (teal) = the \"z\" row seen in 7c."));
      }

      if (step >= 1) {
        host.append(head("① + the attention block's correction (head 0 = 7c output)", "var(--crimson)"));
        const rc = mk("div", { display: "flex", alignItems: "center", gap: "0.16rem", margin: "0.08rem 0" });
        rc.append(lab("+", "var(--crimson)"));
        D.cor.forEach((v, i) => rc.append(cell(v, i < headDim ? "#e3f1ec" : "#fde7c8")));
        host.append(rc);
        host.append(row(D.sum, "#f7d7d2", "=", "var(--crimson)"));
        host.append(note("the residual: we KEEP x, we ADD the correction (tiny here — model not trained)."));
      }
      if (step >= 2) {
        host.append(head("② rmsnorm: volume reset to ~1", "var(--teal)"));
        host.append(row(D.mlp, "#e3f1ec", "→", "var(--teal)"));
        host.append(note("= the MLP's input (next slide). No surprise."));
      }
    },
  };
}
</script>

# {{ $t('annexeResiduelsRmsnorm.title') }}

<div class="rule-ink w-24 my-3" />

<div class="grid gap-5" style="grid-template-columns: 0.92fr 1.08fr; align-items: start">

<div>

<div class="panel panel-teal">
  <div class="label-teal" style="font-size: 1rem">{{ $t('annexeResiduelsRmsnorm.labelResidual') }}</div>
  <p class="text-sm mt-1 mb-1" v-html="$t('annexeResiduelsRmsnorm.residualP1')"></p>
  <div class="text-center my-1" style="font-family: 'Fira Code', monospace; font-size: 1.05rem; color: var(--crimson)">{{ $t('annexeResiduelsRmsnorm.formula') }}</div>
  <p class="text-sm mb-0" v-html="$t('annexeResiduelsRmsnorm.residualP2')"></p>
</div>

<div class="panel mt-2 panel-amber">
  <div class="label-crimson" style="font-size: 0.9rem">{{ $t('annexeResiduelsRmsnorm.labelRmsnorm') }}</div>
  <p class="text-sm mt-1 mb-0" v-html="$t('annexeResiduelsRmsnorm.rmsnormP')"></p>
</div>

</div>

<div class="codecol">
<div class="tag mb-1">{{ $t('annexeResiduelsRmsnorm.tagResidual') }}</div>

<div v-pre class="panel panel-ink" data-signals="{step: 0}" data-effect="window.bridge.render($step)">
  <div style="display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 0.45rem">
    <button class="btn btn-crimson" style="font-family: 'Fira Code', monospace; font-size: 0.72rem; text-transform: none" data-attr:disabled="$step !== 0" data-on:click="$step = 1">① + correction</button>
    <button class="btn btn-teal" style="font-family: 'Fira Code', monospace; font-size: 0.72rem; text-transform: none" data-attr:disabled="$step !== 1" data-on:click="$step = 2">② rmsnorm</button>
    <button class="btn" style="font-family: 'Fira Code', monospace; font-size: 0.72rem; text-transform: none; background: var(--slate)" data-on:click="$step = 0">↻</button>
  </div>
  <div id="bridge-out" class="codexec" style="background: #fff; min-height: 140px"></div>
</div>

</div>

</div>

<style scoped>
.tag { font-size: 0.9rem; }
.codecol { display: flex; flex-direction: column; min-width: 0 }
</style>

<!--
- Slide CHARNIÈRE entre attention (7c) et MLP (7f). Deux idées seulement :
  · LE RÉSIDU : « bloc » = une étape qui retouche le vecteur (attention, MLP).
    Au lieu de tout refaire, le bloc calcule le RESTE à corriger (le « résidu »,
    d'où le nom) et on l'AJOUTE : x = x + bloc(x). x n'est jamais effacé → voie
    express pour le gradient (ResNet, 2015) → réseaux profonds entraînables.
  · RMSNORM : les +/× répétés font dériver la taille des nombres (explosent ou
    s'éteignent) ; on divise par la taille moyenne → retour autour de 1.
- Démo : la correction de l'attention (tête 0 = les nombres de 7c) est minuscule
  car le modèle n'est PAS entraîné — ce n'est pas un « mélange » qui efface, il
  n'y a presque rien à ajouter. On l'ajoute à x (résidu), puis rmsnorm donne
  l'échelle (~1) = l'entrée du MLP. Lineage : même calcul qu'en 7e, mêmes nombres.
- Simplification (comme 7c/7e) : wo (projection interne de l'attention) omise ici ;
  elle est montrée fidèlement dans le code complet de 7g.
-->
