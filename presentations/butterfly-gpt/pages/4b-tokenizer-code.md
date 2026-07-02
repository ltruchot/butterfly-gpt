---
layout: default
---

<script setup>
// THE REAL CODE, EXECUTED. We import the real production factory from the
// narrow sub-export `microgpt-ts/tokenizer` (PURE factory, no disk IO → safe on
// the browser side). Datastar `data-on:click` expressions are evaluated inside
// the Datastar sandbox, outside this module's scope → we expose the helpers
// via `window`. ⚠️ DO NOT name the helpers `encode`/`decode`: those names are
// intercepted by Datastar → we use `toIds`/`fromIds`.
import { makeTokenizer } from "microgpt-ts/tokenizer";
if (typeof window !== "undefined") {
  const toDocs = (text) => text.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);

  // ── Raw results (text) ──
  const vocabText = (text) => {
    const { uchars, BOS, vocabSize } = makeTokenizer(toDocs(text));
    const shown = uchars.map((c) => (c === " " ? "␣" : c)); // space (id 0) made visible
    // Indent with NON-BREAKING spaces ( ): a normal leading space on a long
    // line that wraps ends up on its own line (fake "break" + lost indent).
    // The non-breaking space stays glued to the array.
    const indent = " ".repeat(2);
    const PER = 8; // tokens per line (short enough not to wrap)
    const rows = Array.from({ length: Math.ceil(shown.length / PER) }, (_, r) =>
      indent + shown.slice(r * PER, r * PER + PER).map((c) => JSON.stringify(c)).join(","));
    return [
      `vocab (${uchars.length}) = [`,
      ...rows,
      `]`,
      ``,
      `BOS = ${BOS}`,
      `vocabSize = ${vocabSize}`,
    ].join("\n");
  };
  const idsText = (text) => {
    const { encode } = makeTokenizer(toDocs(text));
    return `encode("azur") = ${JSON.stringify(encode("azur"))}`;
  };
  const charsText = (text) => {
    const { decode } = makeTokenizer(toDocs(text));
    const ids = [13, 15, 9, 18, 29]; // = "moiré" with the default vocab
    return `decode([${ids}]) = ${JSON.stringify(decode(ids))}`;
  };

  // ── Mini-highlighting (strings "…" and numbers), HTML output in the pre ──
  // NB: we avoid any LITERAL opening angle bracket in this script (Slidev's SFC
  // parser would read it as a tag and break the slide) → charCode 60.
  const LT = String.fromCharCode(60);
  const span = (cls, m) => LT + 'span class="' + cls + '">' + m + LT + "/span>";
  const hl = (s) =>
    s.replace(/&/g, "&amp;").replace(new RegExp(LT, "g"), "&lt;").replace(/>/g, "&gt;")
      .replace(/"[^"]*"/g, (m) => span("tk-str", m))
      .replace(/\b\d+\b/g, (m) => span("tk-num", m));
  const put = (text) => { const el = document.getElementById("tk-out"); if (el) el.innerHTML = hl(text); };

  // ⚠️ DO NOT name a method `encode`/`decode`: intercepted by Datastar.
  window.tk = {
    showVocab: (text) => put(vocabText(text)),
    showIds: (text) => put(idsText(text)),
    showChars: (text) => put(charsText(text)),
    clear: () => { const el = document.getElementById("tk-out"); if (el) el.innerHTML = ""; },
  };
}
</script>

<div class="grid gap-5" style="grid-template-columns: 3fr 2fr; align-items: stretch; height: 100%">

<div class="codecol">
<div class="tag mb-2">02-tokenizer.ts</div>

```ts
export const makeTokenizer = (docs: string[]) => {
  const rank = (c: string) =>
    c === " " ? 0 : c >= "a" && c <= "z" ? 1 : 2;

  const uchars = Array.from(new Set(docs.join(""))) 
    .sort()                            
    .sort((a, b) => rank(a) - rank(b)); 

  const BOS = uchars.length;

  const encode = (s: string): number[] =>
    Array.from(s, (ch) => uchars.indexOf(ch));

  const decode = (ids: number[]): string =>
    ids.filter((i) => i >= 0 && i < uchars.length)
       .map((i) => uchars[i]).join("");

  return { uchars, BOS, encode, decode };
};
```

</div>

<div v-pre class="panel panel-teal" style="display: flex; flex-direction: column" data-signals="{docs: 'azur\nmoiré\nazuré commun\nmachaon\ncitron\nvulcain\nflambé\npaon-du-jour\nbelle-dame\nsphinx\nzygène andalouse\nbalkanique\nbrowns\ngazé\nhespérie\ncuivré\ndamier', ready: false}">
  <textarea class="codexec" data-bind:docs style="height: 9rem; min-height: 0; width: 100%; resize: none"></textarea>
  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin: 0.6rem 0">
    <button class="btn" style="text-transform: none; font-family: 'Fira Code', monospace; font-size: 0.78rem" data-attr:disabled="$ready" data-on:click="$ready = true; window.tk.showVocab($docs)">makeTokenizer</button>
    <button class="btn btn-amber" style="text-transform: none; font-family: 'Fira Code', monospace; font-size: 0.78rem" data-attr:disabled="!$ready" data-on:click="window.tk.showIds($docs)">encode('azur')</button>
    <button class="btn btn-crimson" style="text-transform: none; font-family: 'Fira Code', monospace; font-size: 0.78rem" data-attr:disabled="!$ready" data-on:click="window.tk.showChars($docs)">decode([13,15,9,18,29])</button>
    <button class="btn" style="text-transform: none; font-family: 'Fira Code', monospace; font-size: 0.78rem; background: var(--slate)" data-on:click="$ready = false; window.tk.clear()">↻ reset</button>
  </div>
  <div id="tk-out" class="codexec tk-out"></div>
</div>

</div>

<style scoped>
.shiki, .slidev-code { font-size: 0.93rem !important; line-height: 1.4 !important; }
.tag { font-size: 0.95rem; }
/* code + demo fill the full height of the 16:9 slide */
.codecol { display: flex; flex-direction: column; min-height: 0; }
.codecol .slidev-code { flex: 1 1 0; min-height: 0; overflow: auto; margin: 0; }
/* output zone: fills the height (the .tk-str/.tk-num coloring is in charte.css
   because the spans are injected at runtime, out of the scoped's reach) */
.tk-out { flex: 1 1 0; min-height: 0; min-width: 0; margin: 0; overflow-wrap: anywhere; }
.tk-out:empty::before { content: "// click makeTokenizer"; opacity: 0.4; }
</style>

<!--
Le tokenizer, c'est juste ça : ramasser les caractères distincts, les trier,
numéroter. encode = uchars.index(ch), decode = uchars[id]. Le modèle ne verra
plus jamais une lettre, seulement des entiers.
-->
