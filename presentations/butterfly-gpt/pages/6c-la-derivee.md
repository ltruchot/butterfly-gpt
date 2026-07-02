---
layout: default
---

# {{ $t('laDerivee.title') }}

<div class="rule-ink w-24 my-3" />

<!-- δ vit dans le signal Datastar $t (le curseur du widget l'écrit) ; le
     cartouche de gauche le lit via data-text. Signal porté par la grille (ancêtre
     des deux colonnes) → défini avant d'être lu. -->
<div class="grid grid-cols-[0.8fr_1.3fr] gap-6 mt-2 items-start" data-signals="{t: 2}">

<div>

<div class="panel panel-teal" v-click="2">
  <div class="label-crimson" style="font-size: 1.2rem">{{ $t('laDerivee.defLabel') }}</div>
  <p class="text-sm mt-1 mb-0" v-html="$t('laDerivee.defText')"></p>
</div>

<!-- mini-cartouche (à droite sous le teal, moitié de largeur → on laisse la
     place à la boss en bas à gauche) : la dérivée δ courante -->
<div class="panel panel-ink mt-3" style="width: 50%; margin-left: auto; padding: 0.45rem 0.7rem; text-align: center" v-click="4">
  <div style="font-family: 'Fira Code', monospace; font-size: 0.8rem; opacity: 0.75; line-height: 1.1">{{ $t('laDerivee.slopeLabel') }}</div>
  <div style="font-family: 'Fira Code', monospace; font-size: 1rem; line-height: 1.1; display: flex; align-items: center; justify-content: center; gap: 0.35rem">δ = <span style="font-family: 'Anton', sans-serif; font-size: 2rem; color: var(--crimson); line-height: 1" data-text="window.bgpt.derivee.slopeStr($t)"></span> m/s</div>
</div>

</div>

<div>

<div class="panel mb-3 panel-crimson" v-click="3">
  <div class="label-teal" style="font-size: 1.1rem; display: inline-block; margin-right: 0.6rem">{{ $t('laDerivee.formulaLabel') }}</div>
  <span class="centered-formula" style="font-family: 'Fira Code', monospace; font-size: 0.95rem">
    <span> ( f(x+h) − f(x) ) / h</span>
  </span>
  <div class="centered-formula" style="font-family: 'Fira Code', monospace; font-size: 0.9rem; display: flex; gap: 1.2rem; margin-top: 0.5rem">
    <span v-html="$t('laDerivee.addLine')"></span>
    <span v-html="$t('laDerivee.mulLine')"></span>
  </div>
</div>

<div v-click="4">
<div v-pre class="deriv">
  <bgpt-derivee data-attr:t="$t" data-on:drag-t="$t = el.dataset.dragT"></bgpt-derivee>
  <div class="ctrl">
    <span class="text-sm" data-text="window.bgpt.t('laDerivee.time')"></span>
    <input type="range" min="0" max="10" step="0.01" data-bind:t />
  </div>
  <div class="readout">
    <span data-text="window.bgpt.t('laDerivee.slopeSpeed')"></span>
    <span class="codechip">δ = <span class="num" data-text="window.bgpt.derivee.slopeStr($t)"></span></span>
    <strong data-attr:style="'color: ' + window.bgpt.derivee.phaseColorTextOf($t)" data-text="window.bgpt.derivee.phaseTextOf($t)"></strong>
  </div>
</div>
</div>

</div>

</div>

<div style="position: absolute; left: 1rem; bottom: 0; width: 185px; text-align: center" v-click="1">
  <div style="margin-bottom: 1rem; position: relative; z-index: 1; transform: rotate(-5deg)">
    <bgpt-sfx text-key="common.mathBoss" color="ink" size="1.3rem" />
  </div>
  <img :src="$asset('/klowd-boss-math-2.png')" style="width: 185px; display: block" />
</div>
