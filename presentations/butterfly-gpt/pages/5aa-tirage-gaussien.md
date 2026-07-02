---
layout: default
---

# {{ $t('tirageGaussien.title') }}

<div class="rule-ink w-24 my-3" />

<!-- Tout l'état interactif vit dans des SIGNAUX Datastar portés par ce wrapper
     (ancêtre commun de la démo ET des cartouches absolus à droite, qui lisent $x).
     σ = le curseur ; throw1/50/500 + reset = des compteurs-nonce que le web
     component <bgpt-tirage> observe. Le composant RENVOIE les stats du dernier
     tir par l'event `bgpt-tir` (data-on ci-dessous), d'où les cartouches `data-text`. -->
<div data-signals="{sigma: 0.08, throw1: 0, throw50: 0, throw500: 0, reset: 0, shots: 0, hasLast: false, u1: '', u2: '', r: '', deg: '', x: ''}">

<div class="grid grid-cols-[0.8fr_1.3fr] gap-6 mt-2 items-start">

<div>

<div class="panel panel-teal" style="padding: 0.5rem 0.85rem">
  <div class="label-teal" style="font-size: 1rem">{{ $t('tirageGaussien.gaussLabel') }}</div>
  <p class="text-sm mt-1 mb-0" style="line-height: 1.3" v-html="$t('tirageGaussien.gaussSum')"></p>
  <p class="text-sm mt-1 mb-0" style="line-height: 1.3" v-html="$t('tirageGaussien.gaussFact')"></p>
</div>

<div class="panel mt-3 panel-amber" style="padding: 0.45rem 0.85rem">
  <div class="label-amber" style="font-size: 1rem">Box-Muller <span class="text-xs opacity-60"></span></div>
  <p class="text-sm mt-1 mb-0" style="line-height: 1.25" v-html="$t('tirageGaussien.bmU')"></p>
  <p class="text-sm mt-1 mb-0" style="line-height: 1.25" v-html="$t('tirageGaussien.bm1')"></p>
  <p class="text-sm mt-1 mb-0" style="line-height: 1.25" v-html="$t('tirageGaussien.bm2')"></p>
  <p class="text-sm mt-1 mb-0" style="line-height: 1.25" v-html="$t('tirageGaussien.bm3')"></p>
</div>

</div>

<div>

<div v-pre class="panel panel-ink" style="max-width: 300px">

<bgpt-tirage
  data-attr:sigma="$sigma"
  data-attr:throw1="$throw1"
  data-attr:throw50="$throw50"
  data-attr:throw500="$throw500"
  data-attr:reset="$reset"
  data-on:bgpt-tir="$shots = el.dataset.shots; $hasLast = el.dataset.hasLast === 'true'; $u1 = el.dataset.u1; $u2 = el.dataset.u2; $r = el.dataset.r; $deg = el.dataset.deg; $x = el.dataset.x"
></bgpt-tirage>

<div class="flex items-center gap-2 mt-2" style="flex-wrap: wrap">
  <button class="btn btn-crimson" style="text-transform: none" data-on:click="$throw1++" data-text="window.bgpt.t('tirageGaussien.btnThrow')"></button>
  <button class="btn btn-amber" style="text-transform: none" data-on:click="$throw50++">+50</button>
  <button class="btn btn-amber" style="text-transform: none" data-on:click="$throw500++">+500</button>
  <button class="btn" style="text-transform: none; background: var(--slate)" data-on:click="$reset++">↻</button>
  <span class="text-xs opacity-70 ml-1"><span data-text="$shots"></span> <span data-text="window.bgpt.t('tirageGaussien.shots')"></span></span>
  <span class="ml-auto text-sm" style="display: inline-flex; align-items: center; gap: 0.4rem">σ <input type="range" min="0.02" max="0.16" step="0.01" data-bind:sigma style="width: 90px; accent-color: var(--amber)" /> <span class="tag" data-text="(+$sigma).toFixed(2)"></span></span>
</div>

<div class="mt-2 text-sm" data-show="$hasLast" style="display: flex; flex-direction: column; gap: 0.25rem">
  <span class="codechip"><span data-text="window.bgpt.t('tirageGaussien.radius')"></span> = √(−2·<span class="fn">ln</span> <span class="num" data-text="$u1"></span>) = <span class="num" data-text="$r"></span></span>
  <span class="codechip">angle = 2π·<span class="num" data-text="$u2"></span> = <span class="num" data-text="$deg"></span>°</span>
  <span class="codechip">x = <span data-text="window.bgpt.t('tirageGaussien.radius')"></span>·<span class="fn">cos</span>(angle)·σ = <span class="num" data-text="$x"></span></span>
</div>
</div>

</div>

</div>

<!-- formule (la cloche elle-même), placée haut dans le coin droit -->
<div class="panel" style="position: absolute; left: 74.03%; top: 19.7%; width: 224px; border-color: var(--crimson); box-shadow: 5px 5px 0 var(--crimson); padding: 0.45rem 0.7rem; background: var(--paper)">
  <div class="label-teal" style="font-size: 0.9rem">{{ $t('tirageGaussien.formula') }} <span class="text-xs opacity-60">— Box-Muller</span></div>
  <div style="font-family: 'Fira Code', monospace; font-size: 0.8rem; text-align: center; margin-top: 0.25rem; line-height: 1.4">√(−2·<span style="color: var(--teal)">ln</span> u<sub>1</sub>)·<span style="color: var(--crimson)">cos</span>(2π·u<sub>2</sub>)·σ</div>
</div>

<!-- la valeur courante de x (= celle qui change en bas de la démo), en gros -->
<div v-pre class="panel panel-ink" style="position: absolute; left: 74.03%; top: 33%; width: 224px; padding: 0.45rem 0.7rem; text-align: center">
  <div style="font-family: 'Fira Code', monospace; font-size: 1.1rem; line-height: 1.1; display: flex; align-items: center; justify-content: center; gap: 0.4rem">x = <span style="font-family: 'Anton', sans-serif; font-size: 2.1rem; color: var(--crimson); line-height: 1" data-text="$hasLast ? $x : '?'"></span></div>
</div>

</div>

<!-- la boss, bas-droite, tournée vers la démo -->
<div style="position: absolute; right: 0.75rem; bottom: 0; width: 225px; text-align: center">
  <div style="margin-bottom: 0.1rem; position: relative; z-index: 1; transform: rotate(-5deg)">
    <bgpt-sfx text-key="common.mathBoss" color="ink" size="1.4rem" />
  </div>
  <!-- retournée pour regarder vers la démo (à sa gauche) -->
  <img :src="$asset('/klowd-boss-math-2.png')" style="width: 225px; display: block; margin: 0 auto; transform: scaleX(-1)" />
</div>

<!--
- Slide BOSS DES MATHS pour le TIRAGE GAUSSIEN (utilisé en 5b/5c, jamais expliqué).
- Analogie unique = jeu de fléchettes, qui explique À LA FOIS la cloche ET la formule :
    rng() = du PLAT (uniforme) ; sur une cible 2D ça devient une cloche.
    u2 → angle (2π·u2, le cos = la direction) ; u1 → distance (√(−2·ln u1) = le rayon,
    petite distance fréquente / grande rare) ; l'ombre x = rayon·cos·σ est gaussienne.
- C'est EXACTEMENT Box-Muller (04-parameters.ts:122) — on reproduit la vraie formule.
- Anneaux FIXES en valeur (0.1/0.2/0.3) → en montant σ le nuage S'ÉTALE par rapport
  aux anneaux (sinon, tout scalé pareil, on ne verrait rien bouger).
- Histogramme = projection des ombres sur l'axe x → la cloche apparaît au fil des tirs.
- σ par défaut 0.08 = nos poids ; valeurs lues minuscules (≈ ±0.1), comme en vrai.
- Conversion en Datastar (web component <bgpt-tirage>) : l'état (les tirs) vit dans
  le composant ; la slide ne porte que des signaux + lit les stats par l'event `bgpt-tir`.
-->

<style scoped>
/* Le thème impose `p { margin: 16px }`, ce qui bat `.mb-0` → le DERNIER paragraphe
   d'un cartouche garde ~16-25px de marge basse, d'où un vide en bas du panneau teal
   (et une fausse « marge » avec le cartouche amber). On reprend la main : marge basse
   à zéro (l'espacement haut du thème reste, donc l'aération entre lignes est gardée). */
.panel p {
  margin-bottom: 0;
}
</style>
