---
layout: default
---

<script setup>
// THE REAL CODE, EXECUTED — inference step by step, on OUR trained model (seed
// 10 · 10000 steps = `vp run infer:hard`, exported as the browser asset
// `public/butterfly-model.json`: weights + config + uchars). We CANNOT call
// `sample()` as-is: it runs the whole loop at once. Like slide 6e
// (which replays the forward pass with the real autograd primitives), here we REPLAY
// the `sample()` loop letter by letter, calling the SAME real
// trunk functions: `gpt`, `div`, `node`, `softmax`, `choose`. No cheating.
import { gpt, makeConfig, emptyCache } from "microgpt-ts/model";
import { node, div } from "microgpt-ts/autograd";
import { softmax } from "microgpt-ts/attention";
import { choose } from "microgpt-ts/sample";
import { randomSeed } from "microgpt-ts/parameters";
import { withBase } from "../lib/asset.js";

if (typeof window !== "undefined") {
  let params = null;
  let config = null;
  let tok = null;
  let rng = randomSeed(10);
  let runSeed = 10;

  // ── Generation state (replays the variables of the sample() loop) ──
  let cache = emptyCache();
  let seq = []; // = `produced`: the accepted letters (without BOS)
  let posId = 0;
  let curTokenId = null; // = `tokenId`: the injected token (BOS at start)
  let phase = 0; // 0 blank · 1 scores · 2 ÷temp · 3 softmax · 4 letter picked
  let scores = null; // Node[]  (output of gpt)
  let tempered = null; // Node[]  (scores ÷ temperature)
  let probs = null; // number[] (softmax)
  let chosen = null; // picked id
  let draw01 = null; // value of the rng() draw ∈ [0,1[ (for the pointer)
  let scoreRef = null; // FIXED scale of raw scores (to see the ÷ temp effect)
  let finished = false;

  const setStatus = (txt) => { const s = document.getElementById("inf-status"); if (s) s.textContent = txt; };

  // Loads the asset once: rebuilds model + tokenizer (no training).
  const prepare = async () => {
    if (params) return;
    setStatus("loading the model (seed 10 · 10000 steps)…");
    const data = await (await fetch(withBase("/butterfly-model.json"))).json();
    config = makeConfig(data.vocabSize, { nEmbd: data.nEmbd, nHead: data.nHead, blockSize: data.blockSize });
    params = {};
    for (const k of Object.keys(data.matrices)) params[k] = data.matrices[k].map((row) => row.map(node));
    const uchars = data.uchars;
    tok = {
      uchars,
      BOS: uchars.length,
      vocabSize: uchars.length + 1,
      decode: (ids) => ids.filter((id) => id >= 0 && id < uchars.length).map((id) => uchars[id]).join(""),
    };
    setStatus("model ready ✓");
  };

  // ── Mini DOM builders (no literal opening angle bracket: the SFC parser
  //    would take it for a tag) ─────────────────────────────────────────────
  const mk = (tag, style, text) => {
    const el = document.createElement(tag);
    if (style) Object.assign(el.style, style);
    if (text != null) el.textContent = text;
    return el;
  };
  const headline = (txt, color) =>
    mk("div", { fontFamily: "'Anton',sans-serif", textTransform: "uppercase", fontSize: "0.72rem", color: color || "var(--crimson)", margin: "0.35rem 0 0.15rem" }, txt);

  // readable label for a token: BOS stays "BOS" (begin AND end), space → "␣"
  const charLabel = (id) => { if (id === tok.BOS) return "BOS"; const c = tok.uchars[id]; return c === " " ? "␣" : c; };

  // a letter "chip" (all the same template for clean alignment)
  const letterChip = (txt, bg, strong) =>
    mk("span", {
      display: "inline-block", minWidth: "1.15rem", textAlign: "center", padding: "1px 5px",
      border: "1.5px solid var(--ink)", borderRadius: "4px", background: bg || "#fff",
      fontFamily: "'Fira Code',monospace", fontSize: "13px", fontWeight: strong ? "700" : "400", color: "var(--ink)",
    }, txt);

  // ── The word being built: [BOS] + accepted letters + cursor / end ──
  const wordRow = () => {
    const row = mk("div", { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.25rem", marginBottom: "0.3rem" });
    row.append(mk("span", { fontWeight: "700", fontSize: "12px", marginRight: "0.2rem" }, "word"));
    row.append(letterChip("BOS", "#dff3f0", true));
    for (const id of seq) row.append(letterChip(charLabel(id), "#fff"));
    if (finished) row.append(letterChip("BOS ✓", "#dff3f0", true));
    else row.append(letterChip("?", "#fdebc8", true)); // the position we predict
    return row;
  };

  // ── Le tableau des candidats (barres) ──
  // phases 1-2: we read the SCORES (raw, then ÷ temperature). phases 3-4: the
  // PROBABILITIES (softmax). In phase 4, we highlight the PICKED letter.
  const candRows = () => {
    const box = mk("div", {});
    const useProb = phase >= 3;
    const arr = useProb ? probs : (phase === 1 ? scores : tempered).map((n) => n.data);
    const order = arr.map((_, i) => i).sort((a, b) => arr[b] - arr[a]);
    let shown = order.slice(0, 9);
    if (phase >= 4 && chosen != null && !shown.includes(chosen)) shown = [...shown.slice(0, 8), chosen];
    const W = 150; // largeur max d'une barre (px)
    // Scores: FIXED scale (raw-score ref) → dividing by the temperature
    // VISIBLY changes the bars (and the number). Probs: width ∝ prob.
    const sLo = scoreRef ? scoreRef.lo : Math.min(...shown.map((i) => arr[i]));
    const sHi = scoreRef ? scoreRef.hi : Math.max(...shown.map((i) => arr[i]));
    for (const i of shown) {
      const isPick = phase >= 4 && i === chosen;
      const w = useProb
        ? Math.max(2, arr[i] * W)
        : Math.max(2, Math.min(W, ((arr[i] - sLo) / ((sHi - sLo) || 1)) * W * 0.45));
      const r = mk("div", { display: "flex", alignItems: "center", gap: "0.4rem", margin: "0.06rem 0", padding: "1px 3px", borderRadius: "3px", background: isPick ? "#f7d7d2" : "transparent" });
      r.append(letterChip(charLabel(i), isPick ? "var(--crimson)" : "#fff", isPick));
      r.append(mk("span", { height: "12px", width: w + "px", background: isPick ? "var(--crimson)" : (useProb ? "var(--teal)" : "var(--slate)"), border: "1.5px solid var(--ink)", borderRadius: "2px", opacity: useProb ? "1" : "0.6" }));
      r.append(mk("span", { fontFamily: "'Fira Code',monospace", fontSize: "10.5px", color: "var(--slate)" }, useProb ? Math.round(arr[i] * 100) + " %" : arr[i].toFixed(1)));
      if (isPick) r.append(mk("span", { fontFamily: "'Fira Code',monospace", fontSize: "10.5px", fontWeight: "700", color: "var(--crimson)" }, "← picked"));
      box.append(r);
    }
    return box;
  };

  // ── The cumulative bar + the pointer (the butterfly effect MADE VISIBLE) ──
  // The probs are laid end to end (index order, as `choose` walks them).
  // The draw `r = draw01 × total` falls somewhere: the segment
  // it hits wins. Shift the pointer by a hair → another letter is born.
  const cumBar = () => {
    const wrap = mk("div", { marginTop: "0.55rem" });
    wrap.append(headline("where does the draw land?", "var(--crimson)"));
    const tot = probs.reduce((s, w) => s + w, 0);
    const x = Math.min(0.999, Math.max(0, draw01 == null ? 0 : draw01));
    const track = mk("div", { position: "relative", width: "100%", marginTop: "0.7rem" });
    const bar = mk("div", { display: "flex", width: "100%", height: "20px", border: "1.5px solid var(--ink)", borderRadius: "3px", overflow: "hidden" });
    probs.forEach((pr, i) => {
      bar.append(mk("div", { width: (pr / tot) * 100 + "%", height: "100%", background: i === chosen ? "var(--crimson)" : (i % 2 ? "#bfe6df" : "#dff3f0") }));
    });
    track.append(bar);
    track.append(mk("div", { position: "absolute", top: "-4px", height: "28px", left: "calc(" + x * 100 + "% - 1px)", width: "2px", background: "var(--ink)" }));
    track.append(mk("div", { position: "absolute", top: "-15px", left: "calc(" + x * 100 + "% )", transform: "translateX(-50%)", fontFamily: "'Fira Code',monospace", fontSize: "9px", color: "var(--ink)", whiteSpace: "nowrap" }, "draw"));
    wrap.append(track);
    wrap.append(mk("div", { fontFamily: "'Fira Code',monospace", fontSize: "10.5px", color: "var(--slate)", marginTop: "0.4rem" }, "it lands in the share of \"" + charLabel(chosen) + "\" — a hair to the left, another letter."));
    return wrap;
  };

  const draw = () => {
    const host = document.getElementById("inf-out");
    if (!host) return;
    host.replaceChildren();
    host.append(wordRow());
    if (phase >= 1) {
      host.append(headline(phase >= 3 ? "probabilities of the next token" : (phase === 2 ? "scores ÷ temperature" : "raw scores"), phase >= 3 ? "var(--teal)" : "var(--slate)"));
      host.append(candRows());
    }
    if (phase >= 4 && draw01 != null) host.append(cumBar());
    if (finished) host.append(mk("div", { fontSize: "11px", opacity: "0.8", marginTop: "0.35rem" }, "The model re-drew BOS — the same token as at the start: BOS marks the begin AND the end of a name. \"" + (tok.decode(seq) || "…") + "\" is done. ↻ for another."));
  };

  window.infer = {
    init: () => draw(),
    // ① forward pass: the REAL gpt(), which also updates the K/V cache.
    forward: async () => {
      if (finished) return;
      await prepare();
      if (curTokenId == null) curTokenId = tok.BOS; // startup: "begin of word" token
      const out = gpt(params, config, curTokenId, posId, cache);
      cache = out.cache;
      scores = out.scores;
      // FIXED scale anchored on the best candidates (the ones we display),
      // so the bars stand apart AND the ÷ temp stretches them visibly.
      const top = scores.map((n) => n.data).sort((a, b) => b - a).slice(0, 12);
      scoreRef = { lo: Math.min(...top), hi: Math.max(...top) };
      draw01 = null; // new letter: we forget the previous draw
      phase = 1; draw();
    },
    // ② scores ÷ temperature (the REAL div/node of the autograd).
    temper: (rawTemp) => {
      if (!scores) return;
      const t = Math.max(0.1, Number(rawTemp) || 0.5);
      tempered = scores.map((l) => div(l, node(t)));
      phase = 2; draw();
    },
    // ③ softmax → probabilities (the REAL softmax of the trunk).
    soft: () => {
      if (!tempered) return;
      probs = softmax(tempered).map((p) => p.data);
      phase = 3; draw();
    },
    // ④ weighted draw (the REAL choose) → we accept the letter, we feed it back.
    //    We wrap `rng` in a "tap" that REMEMBERS the draw (for the
    //    pointer), without changing the real `choose` at all.
    pick: () => {
      if (!probs) return;
      const tap = () => { const value = rng(); draw01 = value; return value; };
      chosen = choose(probs, tap);
      phase = 4;
      if (chosen === tok.BOS) { finished = true; draw(); return; }
      seq.push(chosen);
      curTokenId = chosen; // feed back: becomes the input of the next position
      posId += 1;
      draw();
    },
    // full cycle in one click (for the following tokens).
    next: async (rawTemp) => {
      if (finished) return;
      await window.infer.forward();
      window.infer.temper(rawTemp);
      window.infer.soft();
      window.infer.pick();
    },
    reset: () => {
      rng = randomSeed((runSeed += 1)); // different seed → another name
      cache = emptyCache(); seq = []; posId = 0; curTokenId = null;
      phase = 0; scores = tempered = probs = chosen = draw01 = scoreRef = null; finished = false;
      setStatus(params ? "model ready ✓" : "click to start");
      draw();
    },
  };
}
</script>

<div class="grid gap-5" style="grid-template-columns: 2.21fr 2.79fr; align-items: stretch; height: 100%">

<div class="codecol">
<div class="tag mb-2">{{ $t('inferenceCode.tag') }}</div>

```ts
import { type Tokenizer } from "./02-tokenizer.ts";
import { div, node, type Node } from "./03-autograd.ts";
import { type StateDict } from "./04-parameters.ts";
import { softmax } from "./07-attention.ts";
import { emptyCache, gpt, type ModelConfig } from "./09-model.ts";

export const choose = (weights: number[], rng: () => number): number => {
  // ... weighted random draw (roulette wheel)
};

export const sample = (
  model: StateDict, cfg: ModelConfig, tok: Tokenizer,
  rng: () => number, temperature: number,
): string => {
  let cache = emptyCache();
  let tokenId = tok.BOS;
  const produced: number[] = [];

  for (let posId = 0; posId < cfg.blockSize; posId++) {
    const out = gpt(model, cfg, tokenId, posId, cache);
    cache = out.cache;
    const tempered: Node[] = out.scores.map((s) => div(s, node(temperature)));
    const probs = softmax(tempered).map((p) => p.data);
    tokenId = choose(probs, rng);
    if (tokenId === tok.BOS) break;
    produced.push(tokenId);
  }
  return tok.decode(produced);
};
```

</div>

<div v-pre class="panel panel-teal" style="display: flex; flex-direction: column" data-signals="{step: 0, temp: 0.5}" data-effect="window.infer.init()">
  <div style="display: flex; flex-wrap: wrap; gap: 0.35rem; margin-bottom: 0.4rem">
    <button class="btn" style="text-transform: none; font-family: 'Fira Code', monospace; font-size: 0.72rem" data-attr:disabled="$step !== 0" data-on:click="$step = 1; window.infer.forward()">1 · gpt → scores</button>
    <button class="btn btn-amber" style="text-transform: none; font-family: 'Fira Code', monospace; font-size: 0.72rem" data-attr:disabled="$step !== 1" data-on:click="$step = 2; window.infer.temper($temp)">2 · ÷ temp</button>
    <button class="btn btn-amber" style="text-transform: none; font-family: 'Fira Code', monospace; font-size: 0.72rem" data-attr:disabled="$step !== 2" data-on:click="$step = 3; window.infer.soft()">3 · softmax</button>
    <button class="btn btn-crimson" style="text-transform: none; font-family: 'Fira Code', monospace; font-size: 0.72rem" data-attr:disabled="$step !== 3" data-on:click="$step = 4; window.infer.pick()">4 · choose</button>
    <button class="btn" style="text-transform: none; font-family: 'Fira Code', monospace; font-size: 0.72rem" data-on:click="window.infer.next($temp)">→ next token</button>
    <button class="btn" style="text-transform: none; font-family: 'Fira Code', monospace; font-size: 0.72rem; background: var(--slate)" data-on:click="$step = 0; window.infer.reset()">↻ reset</button>
  </div>
  <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.4rem; font-size: 0.74rem">
    <span>temperature</span>
    <input type="range" min="0.2" max="1.2" step="0.1" data-bind:temp style="flex: 1" />
    <span class="tag" data-text="$temp"></span>
    <span id="inf-status" class="text-xs opacity-70">click to start</span>
  </div>
  <div id="inf-out" class="codexec inf-out"></div>
</div>

</div>

<style scoped>
.shiki, .slidev-code { font-size: 0.62rem !important; line-height: 1.32 !important; }
.tag { font-size: 0.9rem; }
/* code + démo remplissent toute la hauteur de la slide 16:9 */
.codecol { display: flex; flex-direction: column; min-height: 0; }
.codecol .slidev-code { flex: 1 1 0; min-height: 0; overflow: auto; margin: 0; }
/* zone de sortie : remplit la hauteur, défile si besoin */
.inf-out { flex: 1 1 0; min-height: 0; min-width: 0; margin: 0; overflow: auto; background: #fff; }
</style>

<!--
L'inférence = on rejoue la boucle de sample(), lettre par lettre, avec le VRAI
modèle entraîné.
- ① gpt(...) : la passe avant complète (embeddings → attention → MLP → outputProj)
  recrache un score par lettre possible. Le cache K/V garde le passé.
- ② ÷ température : on divise les scores. < 1 creuse les écarts (sage, sûr) ;
  > 1 les aplatit (audacieux, fantaisiste). Le slider le montre en direct.
- ③ softmax : les scores deviennent des probabilités (somme = 1).
- ④ effet papillon : un tirage pondéré — pas le plus probable systématiquement,
  sinon toujours le même nom. La lettre tirée est réinjectée → on recommence.
  La barre cumulée montre OÙ le tirage tombe : un poil de décalage → autre lettre.
- Tirer BOS = le modèle décide que le mot est fini.
La slide suivante (9c) lâche la bride : des dizaines de noms générés d'un coup.
-->
