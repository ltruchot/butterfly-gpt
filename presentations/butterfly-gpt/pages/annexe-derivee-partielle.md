---
layout: default
---

# {{ $t('partielle.title') }}

<div class="rule-ink w-24 my-3" />

<div class="grid grid-cols-[0.8fr_1.3fr] gap-6 mt-2 items-start">

<div>

<div class="panel panel-teal">
  <div class="label-crimson" style="font-size: 1.2rem">{{ $t('partielle.defLabel') }}</div>
  <p class="text-sm mt-1 mb-0" v-html="$t('partielle.defText')"></p>
</div>

</div>

<div>

<div class="panel mb-3 panel-crimson">
  <div class="label-teal" style="font-size: 1.1rem; display: inline-block; margin-right: 0.6rem">{{ $t('partielle.formulaLabel') }}</div>
  <span class="centered-formula" style="font-family: 'Fira Code', monospace; font-size: 0.95rem">
    ∂(L × H) / ∂L = H&nbsp;&nbsp;·&nbsp;&nbsp;∂(L × H) / ∂H = L
  </span>
</div>

<!-- parterre L×H, 100% Datastar : 2 curseurs (signaux $L/$H + $active = le côté
     poussé), rendu SVG par <bgpt-derivee-partielle>, lecture via data-text. -->
<div v-pre class="part" data-signals="{l: 5, h: 3, active: 'L'}">
  <bgpt-derivee-partielle data-attr:l="$l" data-attr:h="$h" data-attr:active="$active"></bgpt-derivee-partielle>
  <div class="ctrl">
    <span class="text-sm" style="width: 5.5rem" data-text="window.bgpt.t('partielle.width')"></span>
    <input class="slider-l" type="range" min="1" max="9" step="0.1" data-bind:l data-on:input="$active = 'L'" />
  </div>
  <div class="ctrl">
    <span class="text-sm" style="width: 5.5rem" data-text="window.bgpt.t('partielle.height')"></span>
    <input class="slider-h" type="range" min="1" max="6" step="0.1" data-bind:h data-on:input="$active = 'H'" />
  </div>
  <div class="readout">
    <span class="codechip"><span data-text="window.bgpt.t('partielle.areaPrefix')"></span><span class="num" data-text="window.bgpt.deriveePartielle.lStr($l)"></span> × <span class="num" data-text="window.bgpt.deriveePartielle.hStr($h)"></span> = <span class="num" data-text="window.bgpt.deriveePartielle.aireStr($l, $h)"></span></span>
    <strong data-attr:style="'color: ' + ($active === 'L' ? 'var(--teal)' : 'var(--amber)')" data-text="window.bgpt.deriveePartielle.partialLabelOf($active, $l, $h)"></strong>
  </div>
</div>

<p class="text-sm opacity-70 mt-2 mb-0" v-html="$t('partielle.footer')"></p>

</div>

</div>

<!--
- Une fonction à 2 entrées a 2 dérivées : une par entrée. On fige tout sauf une.
- Exemple du parterre : ∂aire/∂largeur = hauteur, ∂aire/∂hauteur = largeur.
- Intuition à garder : pour une multiplication, la dérivée d'une entrée = l'autre.
-->



<div style="position: absolute; left: 1rem; bottom: 0; width: 185px; text-align: center">
  <div style="margin-bottom: -0.8rem; position: relative; z-index: 1; transform: rotate(-5deg)">
    <bgpt-sfx text-key="common.mathBoss" color="crimson" size="0.95rem" />
  </div>
  <img :src="$asset('/klowd-boss-math-2.png')" style="width: 185px; display: block" />
</div>
