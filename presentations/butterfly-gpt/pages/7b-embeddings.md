---
layout: default
---

<script setup>
// THE REAL CODE, EXECUTED — the embeddings. We build a REAL small model
// (initModel) and call the REAL `embed(tokenEmb, positionEmb, id, pos)` from the
// pure sub-export `microgpt-ts/embeddings`. For each letter of « azur », we
// show: the token row (its "ID card"), the position row,
// and their SUM — the vector the rest of the model receives. nEmbd reduced to 6
// to fit on screen. Rendered to the DOM (createElement) outside the Vue scope.
import { embed } from "microgpt-ts/embeddings";
import { initModel, makeConfig } from "microgpt-ts/model";
import { randomSeed } from "microgpt-ts/parameters";

if (typeof window !== "undefined") {
  const ALPHA = " abcdefghijklmnopqrstuvwxyz"; // a character's id = its index
  const WORD = "azur";
  const cfg = makeConfig(ALPHA.length, { nEmbd: 6, blockSize: 8 });
  const model = initModel(randomSeed(7), cfg);
  const num = (n) => { const v = Math.round(n * 100) / 100; return (v === 0 ? 0 : v).toFixed(2); };

  const mk = (tag, style, text) => {
    const el = document.createElement(tag);
    if (style) Object.assign(el.style, style);
    if (text != null) el.textContent = text;
    return el;
  };
  const CELL = { width: "44px", textAlign: "center", padding: "2px 0", fontFamily: "'Fira Code',monospace", fontSize: "11px", border: "1.5px solid var(--ink)", borderRadius: "3px" };
  const lbl = (t) => mk("span", { width: "5.2rem", flexShrink: "0", fontWeight: "700", fontSize: "12px" }, t);
  const row = (label, vec, bg) => {
    const r = mk("div", { display: "flex", alignItems: "center", gap: "0.3rem", margin: "0.12rem 0" });
    r.append(lbl(label));
    vec.forEach((nd) => r.append(mk("span", { ...CELL, background: bg }, num(nd.data))));
    return r;
  };

  window.emb = {
    render: (rawSel) => {
      const host = document.getElementById("emb-out");
      if (!host) return;
      const sel = Math.max(0, Math.min(WORD.length - 1, Number(rawSel) || 0));
      const ch = WORD[sel];
      const tokenId = ALPHA.indexOf(ch);
      host.replaceChildren();

      host.append(mk("div", { fontFamily: "'Anton',sans-serif", textTransform: "uppercase", fontSize: "0.85rem", color: "var(--crimson)", marginBottom: "0.3rem" },
        `letter "${ch}"  ·  position ${sel}`));

      // the two tables looked up
      const tok = [...model.tokenEmb[tokenId]];
      const pos = [...model.positionEmb[sel]];
      host.append(row(`token "${ch}"`, tok, "#fff"));
      host.append(row(`position ${sel}`, pos, "#fdebc8"));
      // the REAL embed = element-wise sum
      const x = embed(model.tokenEmb, model.positionEmb, tokenId, sel);
      const plus = mk("div", { textAlign: "center", color: "var(--crimson)", fontWeight: "700", margin: "0.1rem 0" }, "= sum ↓");
      host.append(plus);
      host.append(row("→ vector x", x, "#f7d7d2"));
    },
  };
}
</script>

# EMBEDDINGS

<div class="rule-ink w-24 my-3" />

<div class="grid gap-5" style="grid-template-columns: 1fr 1.25fr; align-items: start">

<div>

<div class="panel panel-teal">
  <bgpt-sfx text-key="embeddings.diveSfx" color="white" size="1.5rem" />
  <ul class="mt-5 mb-0">
    <li>{{ $t('embeddings.li1') }}</li>
    <li v-html="$t('embeddings.li2')"></li>
    <li v-html="$t('embeddings.li3')"></li>
  </ul>
</div>


</div>

<div>

<div v-pre class="panel panel-crimson" data-signals="{sel: 0}" data-effect="window.emb.render($sel)">
  <div style="display: flex; gap: 0.4rem; margin-bottom: 0.6rem">
    <button class="btn" style="font-family: 'Fira Code', monospace" data-on:click="$sel = 0">a</button>
    <button class="btn" style="font-family: 'Fira Code', monospace" data-on:click="$sel = 1">z</button>
    <button class="btn" style="font-family: 'Fira Code', monospace" data-on:click="$sel = 2">u</button>
    <button class="btn" style="font-family: 'Fira Code', monospace" data-on:click="$sel = 3">r</button>
  </div>
  <div id="emb-out" class="codexec" style="background: #fff"></div>
</div>

<div class="text-center mt-3">
  <bgpt-plate src="/comic-plongeon.jpg" max-height="22vh" />
</div>

</div>

</div>
