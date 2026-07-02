---
layout: default
---

<script setup>
// THE REAL CODE, EXECUTED — generation LIVE with OUR trained model
// (seed 10, 10000 steps = `vp run infer:hard`, cache by_seeds_hard/10-10000.json, exported as
// the browser asset `public/butterfly-model.json`: weights + config + uchars). On the
// 1st click we load the asset, rebuild the model (weights → Node via `node`) and
// the tokenizer (from `uchars`), then we sample with the REAL `sample` of
// microgpt-ts, letter by letter (typewriter effect). Temperature = the slider.
import { makeConfig } from "microgpt-ts/model";
import { node } from "microgpt-ts/autograd";
import { sample } from "microgpt-ts/sample";
import { randomSeed } from "microgpt-ts/parameters";
import { withBase } from "../lib/asset.js";

if (typeof window !== "undefined") {
  let model = null;
  let cfg = null;
  let tok = null;
  let busy = false;
  let runSeed = 10; // generation seed (incremented on each click → varied names)

  const setStatus = (txt) => {
    const s = document.getElementById("gen-status");
    if (s) s.textContent = txt;
  };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // Loads the asset once: rebuilds model + tokenizer (no training).
  const prepare = async () => {
    if (model) return;
    setStatus("loading the model (seed 10 · 10000 steps)…");
    const data = await (await fetch(withBase("/butterfly-model.json"))).json();
    cfg = makeConfig(data.vocabSize, { nEmbd: data.nEmbd, nHead: data.nHead, blockSize: data.blockSize });
    model = {};
    for (const k of Object.keys(data.matrices)) model[k] = data.matrices[k].map((row) => row.map(node));
    const uchars = data.uchars;
    tok = {
      uchars,
      BOS: uchars.length,
      vocabSize: uchars.length + 1,
      encode: (s) => [...s].map((ch) => uchars.indexOf(ch)),
      decode: (ids) => ids.filter((id) => id >= 0 && id < uchars.length).map((id) => uchars[id]).join(""),
    };
    setStatus("model ready ✓ (seed 10 · 10000 steps)");
  };

  window.gen = {
    run: async (rawTemp) => {
      if (busy) return;
      busy = true;
      const out = document.getElementById("gen-out");
      if (out) out.replaceChildren();
      await prepare();
      const temp = Math.max(0.1, Number(rawTemp) || 0.5);
      const rng = randomSeed((runSeed += 1));
      for (let i = 0; i < 12; i++) {
        const name = sample(model, cfg, tok, rng, temp) || "…";
        const line = document.createElement("div");
        line.style.fontFamily = "'Fira Code',monospace";
        line.style.fontSize = "13px";
        line.style.color = "var(--ink)";
        if (out) out.append(line);
        for (let k = 0; k < name.length; k++) {
          line.textContent = name.slice(0, k + 1);
          await sleep(28);
        }
        await sleep(120);
      }
      busy = false;
    },
  };
}
</script>

# {{ $t('inferenceLive.title') }}

<div class="rule-ink w-24 my-3" />

<div class="grid gap-5" style="grid-template-columns: 1fr 1.3fr; align-items: start">

<div>

<div class="panel panel-teal">
  <p class="text-sm mt-0 mb-0" v-html="$t('inferenceLive.dream')"></p>
</div>

<div class="panel mt-3 panel-amber">
  <div class="text-sm" style="display: flex; align-items: center; gap: 0.5rem">
    <span>{{ $t('inferenceLive.temperature') }}</span>
    <input type="range" min="0.2" max="1.2" step="0.1" data-bind:temp style="flex: 1" />
    <span class="tag" data-text="$temp"></span>
  </div>
</div>


</div>

<div v-pre class="panel panel-crimson" data-signals="{temp: 0.5}">
  <div style="display: flex; gap: 0.6rem; align-items: center; margin-bottom: 0.6rem">
    <button class="btn btn-crimson" data-on:click="window.gen.run($temp)">✨ generate</button>
    <span id="gen-status" class="text-xs opacity-70">click to generate</span>
  </div>
  <div id="gen-out" class="codexec" style="background: #fff; min-height: 200px"></div>
</div>

</div>
