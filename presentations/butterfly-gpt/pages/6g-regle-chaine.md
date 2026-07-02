---
layout: default
---

<script setup>
import { ref } from "vue";
const MARCHEUR = 5;  // the walker, 5 km/h (fixed) — reused verbatim in 14c
const bike = ref(4); // bike = ×bike faster than the walker
const car = ref(2);  // car = ×car faster than the bike
</script>

# {{ $t('regleChaine.title') }}

<div class="rule-ink w-24 my-3" />

<div class="grid grid-cols-[0.8fr_1.3fr] gap-6 mt-2 items-start">

<div>

<div class="panel panel-teal">
  <div class="label-crimson" style="font-size: 1.2rem">{{ $t('regleChaine.defLabel') }}</div>
  <p class="text-sm mt-1 mb-0" v-html="$t('regleChaine.defText')"></p>
</div>

</div>

<div>

<div class="panel mb-3 panel-crimson">
  <div class="label-teal" style="font-size: 1.1rem; display: inline-block; margin-right: 0.6rem">{{ $t('regleChaine.formulaLabel') }}</div>
  <span class="centered-formula" style="font-family: 'Fira Code', monospace; font-size: 0.95rem">
    df/dx = df/du × du/dx
  </span>
</div>

<div class="panel panel-teal">

<div class="flex items-center gap-3">
  <span class="text-sm" style="width: 12rem">🚗 {{ $t('regleChaine.fastA') }} <strong>×{{ car }}</strong> {{ $t('regleChaine.fastB') }} 🚴</span>
  <input type="range" min="1" max="6" v-model.number="car" class="rail-noir" style="flex: 1; --accent: var(--crimson)" />
  <span class="tag" >×{{ car }}</span>
</div>


<div class="flex items-center gap-3">
  <span class="text-sm" style="width: 12rem">🚴 {{ $t('regleChaine.fastA') }} <strong>×{{ bike }}</strong> {{ $t('regleChaine.fastB') }} 🚶</span>
  <input type="range" min="1" max="6" v-model.number="bike" class="rail-noir" style="flex: 1; --accent: var(--amber)" />
  <span class="tag">×{{ bike }}</span>
</div>




<div class="mt-4 mb-0">
  {{ $t('regleChaine.so') }} 🚗 {{ $t('regleChaine.fastA') }} <strong>×{{ bike * car }}</strong> {{ $t('regleChaine.fastB') }} 🚶
</div>

</div>

</div>

</div>

<div style="position: absolute; left: 15%; bottom: 0; width: 185px; text-align: center">
  <div style="margin-bottom: -0.8rem; position: relative; z-index: 1; transform: translateY(-50%) rotate(-5deg)">
    <bgpt-sfx text-key="common.mathBoss" color="crimson" size="1.14rem" />
  </div>
  <img :src="$asset('/klowd-boss-math-2.png')" style="width: 185px; display: block" />
</div>

<div class="panel panel-amber" style="position: absolute; right: 1.5rem; bottom: 1.4rem; max-width: 19rem; padding: 0.5rem 0.7rem">
  <div class="label-crimson" style="font-size: 0.85rem">{{ $t('regleChaine.alsoLabel') }}</div>
  <p class="text-xs mt-1 mb-0" v-html="$t('regleChaine.alsoText')"></p>
</div>

<style scoped>
/* Sliders à RAIL NOIR : on abandonne le rendu natif (appearance: none) pour peindre
   nous-mêmes la piste en noir et garder un pouce coloré (--accent, posé inline par
   slider : crimson = voiture, amber = vélo). */
.rail-noir {
  -webkit-appearance: none;
  appearance: none;
  height: 8px;
  border-radius: 4px;
  background: var(--ink);
  border: 1.5px solid var(--ink);
}
.rail-noir::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--accent, #fff);
  border: 1.5px solid var(--ink);
  cursor: pointer;
}
.rail-noir::-moz-range-track {
  height: 8px;
  border-radius: 4px;
  background: var(--ink);
}
.rail-noir::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--accent, #fff);
  border: 1.5px solid var(--ink);
  cursor: pointer;
}
</style>
