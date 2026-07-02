---
layout: default
---

# {{ $t('parametersDef.title') }}

<div class="rule-ink w-24 my-2" />

<p class="text-sm mb-2" style="color: var(--slate)" v-html="$t('parametersDef.intro')"></p>

<div class="grid grid-cols-[1.2fr_0.8fr] gap-6 items-start">

<div>

<div class="panel panel-crimson" v-click>
  <bgpt-sfx text-key="parametersDef.sfxDimensions" color="white" size="1.5rem" />
  <ul class="text-sm mt-1 mb-0">
  <li v-html="$t('parametersDef.dimToken')"></li>
  <li v-html="$t('parametersDef.dimPosition')"></li>
  <li v-html="$t('parametersDef.dimDirections')"></li>
  </ul>
</div>

<div class="mt-2 grid gap-3" style="grid-template-columns: 1fr auto; align-items: center">

<div class="panel panel-amber" style="margin: 0" v-click>
  <bgpt-sfx text-key="parametersDef.sfxGalaxy" color="amber" size="1.5rem" />
  <ul class="text-sm mt-1 mb-0">
  <li><strong>Microgpt</strong> = <strong>4192 params</strong></li>
  <li v-html="$t('parametersDef.galGpt4')"></li>
  <li>{{ $t('parametersDef.galMilkyway') }}</li>
  <li>{{ $t('parametersDef.galBrain') }}</li>
  </ul>
</div>

<bgpt-plate src="/daveg-etoiles-end.jpg" max-height="20vh" v-click />

</div>

</div>

<div>

<div class="panel panel-teal" v-click>
    <bgpt-sfx text="Matrix" color="ink" size="1.5rem" />

<div class="text-xs mt-2" style="font-family: 'Fira Code', monospace; line-height: 1.45">
<div>Embeddings: <span style="color: var(--teal); font-weight: 700">tokenEmb + positionEmb</span></div>
<div>Attention: <span style="color: var(--crimson); font-weight: 700">attn_wq/wk/wv/wo</span> <span class="opacity-70">{{ $t('parametersDef.matContext') }}</span></div>
<div>Perceptron:<span style="color: var(--amber); font-weight: 700">mlp_fc1/mlp_fc2</span> <span class="opacity-70">{{ $t('parametersDef.matDecide') }}</span></div>
<div>Projection: <span style="color: var(--slate); font-weight: 700">outputProj</span> <span class="opacity-70">{{ $t('parametersDef.matScores') }}</span></div>
</div>
</div>

<div class="panel mt-2 panel-slate" style="padding: 0; height: 217px; overflow: hidden" v-click>
  <bgpt-param-cloud decor height="100%"></bgpt-param-cloud>
</div>

</div>

</div>

<!--
- Présente la STRUCTURE figée (avant entraînement) + répond aux « pourquoi » du néophyte.
- Couleurs des rôles = ParamCloud3D / Architecture : emb=teal, attn=crimson, mlp=amber, sortie=slate.
- On ne détaille PAS archi/autograd/training ici (sections dédiées).
- Échelle : 4 192 ici vs GPT-4 ≈ 1 760 000 000 000 = « mille sept cent soixante MILLIARDS »
  (pas « trilliard », pas « 1760 millions »). ≈ 440 millions de fois microgpt.
-->
