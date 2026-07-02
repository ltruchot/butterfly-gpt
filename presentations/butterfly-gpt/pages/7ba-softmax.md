---
layout: default
---

<script setup>
// THE SOFTMAX DEMO, in Datastar (like 09/12). Datastar expressions are
// evaluated outside this module → we expose the render via `window`. We build the
// columns directly in the DOM (createElement): no literal angle bracket to
// escape, and inline styles (injected nodes are out of the scoped reach).
if (typeof window !== "undefined") {
  const mk = (tag, style, text) => {
    const e = document.createElement(tag);
    if (style) Object.assign(e.style, style);
    if (text != null) e.textContent = text;
    return e;
  };
  const UP = 64; // height of the "counts" zone (above the letter)
  const DOWN = 84; // height of the "probabilities" zone (below)
  const BARW = 22;

  // A column: count (number + rising bar) · letter · falling bar + %
  const col = (letter, count, prob, maxCount, maxProb, isTop) => {
    const c = mk("div", { display: "flex", flexDirection: "column", alignItems: "center", width: "40px" });

    const up = mk("div", { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: UP + "px" });
    up.append(mk("div", { fontFamily: "'Fira Code',monospace", fontSize: "12px", color: "var(--ink)", marginBottom: "2px" }, String(count)));
    up.append(mk("div", { width: BARW + "px", height: Math.round((count / maxCount) * (UP - 22)) + "px", background: "var(--teal)", border: "1.5px solid var(--ink)" }));

    const mid = mk("div", { fontWeight: "700", fontSize: "16px", color: "var(--ink)", lineHeight: "1.5" }, letter);

    const down = mk("div", { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", height: DOWN + "px" });
    down.append(mk("div", { width: BARW + "px", height: Math.round((prob / maxProb) * (DOWN - 22)) + "px", background: isTop ? "var(--crimson)" : "var(--amber)", border: "1.5px solid var(--ink)" }));
    down.append(mk("div", { fontFamily: "'Fira Code',monospace", fontSize: "12px", color: "var(--ink)", marginTop: "2px" }, Math.round(prob * 100) + " %"));

    c.append(up, mid, down);
    return c;
  };

  window.smx = {
    render: (word) => {
      const host = document.getElementById("smx-cols");
      if (!host) return;
      // keep only letters (a letter: lowercase ≠ uppercase)
      const letters = Array.from((word || "").toLowerCase()).filter((ch) => ch.toLowerCase() !== ch.toUpperCase());
      const counts = new Map();
      for (const ch of letters) counts.set(ch, (counts.get(ch) || 0) + 1);
      const keys = Array.from(counts.keys()).sort((a, b) => a.localeCompare(b, "fr"));
      host.replaceChildren();
      if (keys.length === 0) {
        host.append(mk("div", { opacity: "0.45", fontSize: "0.85rem", padding: "2.5rem 0" }, "type a word…"));
        return;
      }
      const cnt = keys.map((k) => counts.get(k));
      const maxCount = Math.max(...cnt);
      // faithful softmax (recenter − max, cf. 07-attention.ts), no temperature
      const m = Math.max(...cnt);
      const exps = cnt.map((x) => Math.exp(x - m));
      const tot = exps.reduce((a, b) => a + b, 0);
      const probs = exps.map((e) => e / tot);
      const maxProb = Math.max(...probs);
      keys.forEach((k, i) => host.append(col(k, cnt[i], probs[i], maxCount, maxProb, probs[i] === maxProb)));
    },
  };
}
</script>

# Softmax

<div class="rule-ink w-24 my-3" />

<div class="grid grid-cols-[0.8fr_1.3fr] gap-6 mt-2 items-start">

<div>

<div class="panel panel-teal">
  <div class="label-crimson" style="font-size: 1.2rem">{{ $t('softmax.defLabel') }}</div>
  <p class="text-sm mt-1 mb-0" v-html="$t('softmax.def1')"></p>
  <p class="text-sm mt-1 mb-0">{{ $t('softmax.def2') }}</p>
</div>

</div>

<div>

<div class="panel mb-3 panel-crimson">
  <div class="label-teal" style="font-size: 1.1rem; display: inline-block; margin-right: 0.6rem">{{ $t('softmax.formulaLabel') }}</div>
  <span class="centered-formula" style="font-family: 'Fira Code', monospace; font-size: 0.95rem">
    softmax(z<sub>i</sub>) = e<sup>z<sub>i</sub></sup> / Σ<sub>j</sub> e<sup>z<sub>j</sub></sup>
  </span>
</div>

<div v-pre class="panel smx-demo panel-teal" data-signals="{word: 'papillon'}" data-effect="window.smx.render($word)">
  <input class="smx-input" maxlength="15" data-bind:word placeholder="type a word (max 15)" />
  <div id="smx-cols" style="display: flex; justify-content: center; align-items: flex-start; gap: 0.5rem; margin-top: 0.6rem; min-height: 180px"></div>
</div>


</div>

</div>

<div style="position: absolute; left: calc(1rem + 5%); bottom: 0; width: 156px; text-align: center">
  <div style="margin-bottom: 0.15rem; position: relative; z-index: 1; transform: rotate(-5deg)">
    <bgpt-sfx text-key="common.mathBoss" color="crimson" size="0.95rem" />
  </div>
  <img :src="$asset('/klowd-boss-math-2.png')" style="width: 156px; display: block" />
</div>

<style scoped>
.smx-input {
  width: 100%;
  font-family: "Fira Code", monospace;
  font-size: 1rem;
  text-align: center;
  padding: 0.4rem 0.6rem;
  border: 2.5px solid var(--ink);
  border-radius: 3px;
  background: #fff;
  color: var(--ink);
}
.smx-input:focus {
  outline: none;
  box-shadow: 3px 3px 0 var(--teal);
}
</style>

<!--
Pourquoi pas la fréquence ?
- scores parfois négatifs → exp() rend tout positif
- "trancher" = feature : pousse le meilleur, discrimine mieux
- sort de la "bouillie" plus vite → noms nets
- fréquence constate · softmax tranche
-->

