---
layout: default
---

# {{ $t('passeArriere.title') }}

<div class="rule-ink w-24 my-3" />

<p class="text-base" style="color: var(--slate)" v-html="$t('passeArriere.lead')"></p>

<div class="grid grid-cols-3 gap-4 mt-4">

<div class="panel panel-crimson" v-click>
  <div class="label-crimson" style="font-size: 1.1rem">{{ $t('passeArriere.p1Label') }}</div>
  <ul class="text-sm mt-1 mb-0">
    <li v-html="$t('passeArriere.p1a')"></li>
    <li v-html="$t('passeArriere.p1b')"></li>
    <li v-html="$t('passeArriere.p1c')"></li>
  </ul>
</div>

<div class="panel panel-teal" v-click>
  <div class="label-teal" style="font-size: 1.1rem">{{ $t('passeArriere.p2Label') }}</div>
    <ul class="text-sm mt-1 mb-0">
    <li v-html="$t('passeArriere.p2a')"></li>
    <li v-html="$t('passeArriere.p2b')"></li>
        <li v-html="$t('passeArriere.p2c')"></li>
  </ul>
</div>

<div class="panel panel-amber" v-click>
  <div class="label-crimson" style="font-size: 1.1rem">{{ $t('passeArriere.p3Label') }}</div>
  <ul class="text-sm mt-1 mb-0">
  <li v-html="$t('passeArriere.p3a')"></li>
  <li v-html="$t('passeArriere.p3b')"></li>
  </ul>
</div>

</div>


<!--
- La passe arrière = on part de l'erreur (blâme 1) et on remonte le graphe.
- On RÉUTILISE les dérivées locales notées à l'aller : aucun recalcul.
- Deux gestes : × le long du chemin (chaîne, 6h) ; + aux carrefours (accumulation, 6i).
- Chaque paramètre récupère son gradient → l'optimiseur (Adam) sait comment le bouger.
- Slide charnière : pose le décor avant chaîne (6h) → accumulation (6i) → code (6j).
-->
