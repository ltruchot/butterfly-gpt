---
layout: default
---

# Architecture

<div class="rule-ink w-24 my-3" />

<div class="grid grid-cols-[1.05fr_0.92fr_auto] gap-5 mt-1 items-center">

<div>

<div class="panel panel-teal" v-click="2">
  <bgpt-sfx text-key="pipeline.puritySfx" color="white" size="1.3rem" />
  <p class="text-sm mt-1 mb-1" v-html="$t('pipeline.modelPure')"></p>
  <div class="text-xs" style="font-family: 'Fira Code', monospace; color: var(--teal)">{{ $t('pipeline.gptSig') }}</div>
  <div class="text-xs mb-1" style="font-family: 'Fira Code', monospace; color: var(--teal); padding-left: 1.6rem">→ {<strong style="color: var(--crimson)">scores</strong>, cache}</div>
  <p class="text-xs opacity-70 mt-0 mb-0" v-html="$t('pipeline.scoresNote')"></p>
</div>

<div class="panel mt-3 panel-amber" v-click="3">
  <bgpt-sfx text-key="pipeline.cacheSfx" color="amber" size="1.3rem" />
  <ul class="text-sm mt-1 mb-0" style="padding-left: 1.1rem">
    <li v-html="$t('pipeline.cacheLi1')"></li>
    <li>{{ $t('pipeline.cacheLi2') }}</li>
  </ul>
</div>

</div>

<div>

<div class="panel panel-crimson" v-click="4">
  <div style="margin-bottom: 0.4rem"><bgpt-sfx text="pipeline" color="crimson" size="1.5rem" /><br /><em>{{ $t('pipeline.journey') }}</em></div>

<div class="text-sm" style="display: flex; flex-direction: column; gap: 0.12rem; font-family: 'Fira Code', monospace">
  <div style="background: #0f5e5a; color: var(--paper); padding: 0.28rem 0.5rem; border: 2px solid var(--ink); border-radius: 3px">
    <div style="font-weight: 700">{{ $t('pipeline.box1Title') }}</div>
    <div class="text-xs opacity-80" style="line-height: 1.2">{{ $t('pipeline.box1Sub') }}</div>
  </div>
  <div class="text-center opacity-50" style="line-height: 1">↓</div>
  <div style="background: #b5223a; color: var(--paper); padding: 0.28rem 0.5rem; border: 2px solid var(--ink); border-radius: 3px">
    <div style="font-weight: 700">{{ $t('pipeline.box2Title') }}</div>
    <div class="text-xs opacity-80" style="line-height: 1.2">{{ $t('pipeline.box2Sub') }}</div>
  </div>
  <div class="text-center opacity-50" style="line-height: 1">↓</div>
  <div style="background: #e8a33d; color: var(--ink); padding: 0.28rem 0.5rem; border: 2px solid var(--ink); border-radius: 3px">
    <div style="font-weight: 700">③ Perceptron (MLP)</div>
    <div class="text-xs opacity-70" style="line-height: 1.2">{{ $t('pipeline.box3Sub') }}</div>
  </div>
  <div class="text-center opacity-50" style="line-height: 1">↓</div>
  <div style="background: #2b3a42; color: var(--paper); padding: 0.28rem 0.5rem; border: 2px solid var(--ink); border-radius: 3px">
    <div style="font-weight: 700">{{ $t('pipeline.box4Title') }}</div>
    <div class="text-xs opacity-80" style="line-height: 1.2">{{ $t('pipeline.box4Sub') }}</div>
  </div>
</div>
</div>

</div>

<div class="text-center">
  <bgpt-plate src="/comic-lune-tokyo.jpg" max-height="46vh" v-click="1" />
</div>

</div>

<!-- STASH — ancien panneau « Un bloc, répété » (remplacé par « Le cache »).
     Le contenu attention/MLP/résiduel/normalisation est désormais détaillé
     dans 7c-attention / 7d-rms / 7e-residuels-rmsnorm / 7f-mlp. Conservé ici au cas où
     on voudrait une slide « le bloc transformer empilable » :

<div class="panel mt-3 panel-amber">
  <div class="label-teal" style="font-size: 1rem">Un bloc, répété</div>
  <p class="text-sm mt-1 mb-0"><strong>Attention</strong> (regarder le passé) puis <strong>MLP</strong> (réfléchir) — chacun avec sa <strong>normalisation</strong> et son <strong>résiduel</strong>. On pourrait empiler ce bloc ; ici, <strong>un seul</strong> suffit.</p>
</div>
-->

<!--
Note orale — le cache est une OPTIMISATION, pas un besoin. Ce qu'il garde : la
clé/valeur (K/V) de chaque lettre déjà vue, pour que l'attention les reconsulte
sans les recalculer. Sans lui, prédire la lettre N obligerait à recalculer ces
fiches pour toutes les lettres précédentes à chaque pas (coût quadratique).

Subtilité séquentiel / parallèle : à l'entraînement le mot est connu d'avance,
donc on PEUT abandonner le cache et traiter toutes les positions d'un coup, en
parallèle (un masque causal cache le futur) — c'est ce que font les implés de
production. Notre microgpt reste séquentiel (cache en entraînement ET en
génération) pour rester lisible ; mêmes nombres au final.
-->
