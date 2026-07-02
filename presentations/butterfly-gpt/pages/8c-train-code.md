---
layout: default
---

<!-- TODO (futur) — vue « optimizer code » dédiée :
     repartir du graphe FINAL (logValue, comme 6j) et STRIPPER tout sauf les
     feuilles-PARAMÈTRES (les boîtes teal). Les options `params` / `hide` /
     `stopAt` de logValue le permettent déjà. On y montrerait alors `adamStep`
     (packages/microgpt-ts/src/11-adam.ts) qui ne touche QUE ces feuilles :
     poids ← poids − lr × grad (m̂/v̂ pour Adam). -->

<script setup>
// THE REAL CODE, EXECUTED — training LIVE, in the browser. The engine
// (lib/trainEngine) chains forward → loss → backward → Adam over the embedded
// corpus, one step at a time; we `await setTimeout(0)` between steps so we don't
// freeze the page. The loss curve (lib/lossChart) redraws as it goes.
// Same algorithms as `vp run train`, smaller model so it runs in a few sec.
import { makeEngine } from "../lib/trainEngine";
import { lossChartSVG } from "../lib/lossChart";
import { BUTTERFLY_DOCS } from "../lib/corpus";

if (typeof window !== "undefined") {
  let engine = null;
  let raw = [];
  let ema = [];
  let running = false;
  let stop = false;

  const draw = () => {
    const host = document.getElementById("train-out");
    if (host && engine) host.innerHTML = lossChartSVG(raw, ema, engine.numSteps, engine.lnVocab);
  };

  window.trainer = {
    init: () => {
      if (!engine) engine = makeEngine(BUTTERFLY_DOCS, 150);
      draw();
    },
    reset: () => {
      stop = true;
      engine = makeEngine(BUTTERFLY_DOCS, 150);
      raw = [];
      ema = [];
      running = false;
      setTimeout(draw, 0);
    },
    start: async () => {
      if (running) return;
      if (!engine) engine = makeEngine(BUTTERFLY_DOCS, 150);
      running = true;
      stop = false;
      while (engine.step() < engine.numSteps && !stop) {
        const loss = engine.trainOne();
        raw.push(loss);
        ema.push(ema.length ? ema[ema.length - 1] * 0.9 + loss * 0.1 : loss);
        if (engine.step() % 2 === 0) draw();
        await new Promise((r) => setTimeout(r, 0));
      }
      draw();
      running = false;
    },
  };
}
</script>

# {{ $t('trainCode.title') }}

<div class="rule-ink w-24 my-3" />

<div class="grid gap-5" style="grid-template-columns: 1fr 1.6fr; align-items: start">

<div>


<div class="panel mt-2 panel-crimson">
  <div class="label-teal" style="font-size: 1rem">{{ $t('trainCode.surpriseLabel') }}</div>
  <p class="text-sm mt-1 mb-0" v-html="$t('trainCode.lossFormula')"></p>
</div>



</div>

<div v-pre class="panel panel-crimson" data-signals="{on: 0}" data-effect="window.trainer.init()">
  <div style="display: flex; gap: 0.5rem; margin-bottom: 0.6rem">
    <button class="btn btn-crimson" data-on:click="window.trainer.start()">▶ train</button>
    <button class="btn" style="background: var(--slate)" data-on:click="window.trainer.reset()">↻ reset</button>
  </div>
  <div id="train-out" class="codexec" style="background: #fff; padding: 0.3rem"></div>
</div>

</div>
