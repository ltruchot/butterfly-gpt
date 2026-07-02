---
layout: default
---

# {{ $t('passeAvant.title') }}

<div class="rule-ink w-24 my-3" />

<p class="text-base" style="color: var(--slate)">
{{ $t('passeAvant.lead') }}
</p>

<div class="grid grid-cols-2 gap-5 mt-4">

<div class="panel panel-teal" v-click>
  <bgpt-sfx text="Prediction" color="ink" size="1.5rem" />
    <ul>
      <li v-html="$t('passeAvant.predAdd')"></li>
      <li v-html="$t('passeAvant.predAttn')"></li>
      <li v-html="$t('passeAvant.predPerceptron')"></li>
      <li v-html="$t('passeAvant.predLoss')"></li>
    </ul>
</div>

<div class="panel panel-amber" v-click>
  <bgpt-sfx text-key="passeAvant.sfxBlame" color="amber" size="1.5rem" />
  <ul>
   <li>{{ $t('passeAvant.blameNotes') }}</li>
   <li v-html="$t('passeAvant.blameGradients')"></li>
  </ul>

</div>

</div>


<!--
- La passe avant = on calcule le résultat, brique par brique, de gauche à droite.
- Bonus crucial : chaque brique note SA dérivée locale (∂) en marge, pour plus tard.
- Le résultat final est UN seul nombre : l'erreur (la « surprise »), la cross-entropy.
- Slide charnière : pose le décor avant dérivée → dérivée partielle → code (6e).
-->
