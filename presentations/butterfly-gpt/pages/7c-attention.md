---
layout: default
---

# ATTENTION

<div class="rule-ink w-24 my-3" />

<div class="grid gap-5" style="grid-template-columns: 0.87fr 1.13fr; align-items: start">

<div>

<div class="panel panel-teal" v-click="1">
  <bgpt-sfx text-key="attention.mindfulnessSfx" color="white" size="1.2rem" />
  <ul class="text-xs" style="list-style-position: inset; padding-left: 0; margin: 0;">
    <li class="mb-3" v-click="2" v-html="$t('attention.query')"></li>
    <li v-click="3" v-html="$t('attention.keys')"></li>
    <li class="mb-3" v-click="3" v-html="$t('attention.weights')"></li>
    <li v-click="4" v-html="$t('attention.values')"></li>
    <li class="mb-3" v-click="4" v-html="$t('attention.context')"></li>
    <li v-click="5" v-html="$t('attention.residual')"></li>
  </ul>
</div>

</div>

<div>

<div class="panel panel-amber" v-click="6">
  <bgpt-sfx text-key="attention.headsSfx" color="amber" size="1.2rem" />
  <p class="text-xs mt-1 mb-1" v-html="$t('attention.splitP')"></p>
  <div style="display: flex; align-items: center; gap: 0.5rem; margin: 0.3rem 0">
    <span style="font-family: 'Fira Code', monospace; font-weight: 700; color: var(--crimson); font-size: 0.72rem">vecQ</span>
    <div style="display: flex; gap: 0.16rem; align-items: center">
      <span class="hcell" style="background: #e3f1ec"></span>
      <span class="hcell" style="background: #e3f1ec"></span>
      <span class="hcell" style="background: #e3f1ec"></span>
      <span style="width: 2px; height: 16px; background: var(--ink); margin: 0 0.15rem"></span>
      <span class="hcell" style="background: #fdecd2"></span>
      <span class="hcell" style="background: #fdecd2"></span>
      <span class="hcell" style="background: #fdecd2"></span>
    </div>
  </div>
  <div style="display: flex; font-size: 0.62rem; font-family: 'Fira Code', monospace; margin-left: 2.7rem">
    <span style="color: var(--teal); font-weight: 700">{{ $t('attention.head0') }}</span>
    <span style="color: var(--amber); font-weight: 700; margin-left: 1.55rem">{{ $t('attention.head1') }}</span>
  </div>
  <p class="text-xs mt-1 mb-0" v-html="$t('attention.headsNote')"></p>
</div>

<div class="mt-3" style="display: flex; gap: 0.8rem; align-items: stretch" v-click="7">
  <div class="panel panel-crimson" style="flex: 1; padding: 0.5rem 1rem; display: flex; flex-direction: column; justify-content: center">
    <bgpt-sfx text="KV cache" color="white" size="1.05rem" style="margin-bottom: 0" />
    <p class="text-xs mt-1 mb-0" style="line-height: 1.3" v-html="$t('attention.kvNote')"></p>
  </div>
  <div style="flex-shrink: 0; display: flex">
    <bgpt-plate src="/comic-pleine-conscience.jpg" max-height="13vh" />
  </div>
</div>

</div>

</div>

<style scoped>
.hcell { width: 18px; height: 16px; border: 1.5px solid var(--ink); border-radius: 3px; display: inline-block }
</style>

<!--
« Roi − homme + femme ≈ reine » (word2vec, ~2013) : dans un espace APPRIS, la
direction d'un vecteur porte du SENS — découverte empirique antérieure au
Transformer. C'est la même intuition qui rend q·k pertinent : alignement = sens.

Note orale — comment interpréter q·k :

1. q·k(z) > q·k(a) NE veut PAS dire « z est précédé de z plutôt que de a ».
   L'attention mesure : pour prédire la lettre SUIVANTE, le token courant (z)
   puise plus dans z que dans a — une PERTINENCE DE CONTEXTE, pas un comptage
   de qui-précède-qui.

2. La query est celle de z (lettre courante), qui regarde EN ARRIÈRE vers a et z
   (lui-même). Poids fort sur z = « pour deviner ma suite, je m'appuie surtout
   sur la dernière lettre » (un effet de récence, par ex.).

3. La statistique « quelle lettre SUIT » vit AILLEURS : la projection finale
   (outputProj → scores → softmax sur le vocabulaire, étape ④ du pipeline).
   L'attention ne sort pas de probabilités de lettres ; elle rassemble du contexte.

La mécanique pas-à-pas (q·k, softmax, somme pondérée, têtes, concat, matO,
résidu) est déroulée dans la slide suivante, sur le VRAI code exécuté.
-->
