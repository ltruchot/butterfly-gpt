---
layout: default
---

<script setup>
// THE REAL CODE, EXECUTED. We import the real production functions from the
// narrow sub-export `microgpt-ts/dataset` (never the barrel → never the
// tokenizer → never disk IO on the browser side). Datastar `data-on:click`
// expressions are strings evaluated inside the Datastar sandbox, outside this
// module's scope → we expose the functions via `window`.
import { cleanLines, randomShuffle } from "microgpt-ts/dataset";
if (typeof window !== "undefined") window.bf = { cleanLines, randomShuffle };
</script>

<div class="grid gap-5" style="grid-template-columns: 3fr 2fr; align-items: stretch">

<div>
<div class="tag mb-2">01-dataset.ts</div>

```ts
import * as nodeFs from "node:fs";

const PATH = "butterflies/french.refined.txt";

export const loadRawDataset = (): string => 
  nodeFs.readFileSync(PATH, "utf8");

export const cleanLines = (raw: string): string[] =>
  raw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

export const randomShuffle =
  (arr: string[], seed: number): string[] => {
    // ... seeded Fisher-Yates shuffle
  };

export const getAllDocs = (): string[] =>
  cleanLines(loadRawDataset());
```

</div>

<div v-pre class="panel panel-teal" style="display: flex; flex-direction: column" data-signals="{raw: 'azur\nazuré commun\npaon-du-jour\nbelle-dame\nazuré commun\nmachaon\n   sphinx tête-de-mort\nflambé\n\npetite tortue\nmachaon\ncitron\nvulcain', out: '', step: 0}">
  <div style="display:flex; gap:0.5rem; align-items:center; margin-bottom:0.7rem">
    <button class="btn" style="text-transform:none; font-family:'Fira Code',monospace; font-size:0.78rem" data-attr:disabled="$step !== 0" data-on:click="$out = $raw; $step = 1">loadRawDataset</button>
    <button class="btn btn-amber" style="text-transform:none; font-family:'Fira Code',monospace; font-size:0.78rem" data-attr:disabled="$step !== 1" data-on:click="$out = window.bf.cleanLines($out).join('\n'); $step = 2">cleanLines</button>
    <button class="btn btn-crimson" style="text-transform:none; font-family:'Fira Code',monospace; font-size:0.78rem" data-attr:disabled="$step < 2" data-on:click="$out = window.bf.randomShuffle($out.split('\n'), 42).join('\n'); $step = 2">shuffle</button>
  </div>
  <textarea class="codexec" data-bind:out placeholder="// click loadRawDataset" style="flex:1; min-height:0; width:100%; resize:none"></textarea>
  <div style="display:flex; justify-content:flex-end; margin-top:0.6rem">
    <button class="btn" style="text-transform:none; font-family:'Fira Code',monospace; font-size:0.78rem; background:var(--slate)" data-on:click="$out = ''; $step = 0">↻ reset</button>
  </div>
</div>

</div>

<style scoped>
.shiki, .slidev-code { font-size: 0.98rem !important; line-height: 1.3 !important; }
.tag { font-size: 0.95rem; }
</style>

<!--
Note : mon propre algo de nettoyage fait ~200 lignes à lui seul, alors que
tout vient de Wikipédia. Nettoyer, ce n'est pas une tâche facile.
-->
