---
layout: default
---

# {{ $t('paramCloud.title') }}

<div class="rule-ink w-24 my-3" />

<div class="grid grid-cols-[1fr_1.5fr] gap-6 mt-1 items-start">

<div>

<div class="panel panel-teal" v-click="2">
  <p class="text-sm mt-0 mb-0" v-html="$t('paramCloud.gaussPanel')"></p>
</div>

<div class="panel mt-3 panel-amber" v-click="3">
  <bgpt-sfx text-key="paramCloud.sfxAll" color="amber" size="1.1rem" />
  <p class="text-sm mt-1 mb-0" v-html="$t('paramCloud.chancePanel')"></p>
</div>

<p class="text-sm opacity-70 mt-3 mb-0" v-html="$t('paramCloud.hint')"></p>

</div>

<div>

<!-- Nuage 3D : la scène Three.js est le web component <bgpt-param-cloud>, les
     contrôles sont des boutons Datastar (signaux seed/grouped → data-attr). -->
<div v-click="1">
<div v-pre class="cloud" data-signals="{seed: 1, grouped: false}">
  <bgpt-param-cloud data-attr:seed="$seed" data-attr:grouped="$grouped"></bgpt-param-cloud>
  <div class="ctrl">
    <button class="btn" data-on:click="$seed++" data-text="window.bgpt.t('paramCloud.newDraw')"></button>
    <button class="btn btn-amber" data-on:click="$grouped = !$grouped" data-text="$grouped ? window.bgpt.t('paramCloud.mix') : window.bgpt.t('paramCloud.groupByRole')"></button>
    <span class="tag" data-text="window.bgpt.t('paramCloud.paramsCount')"></span>
  </div>
  <div class="legend">
    <span><i style="background: #0f5e5a"></i>embeddings</span>
    <span><i style="background: #b5223a"></i>attention</span>
    <span><i style="background: #e8a33d"></i>MLP</span>
    <span><i style="background: #2b3a42"></i><span data-text="window.bgpt.t('paramCloud.legendOutput')"></span></span>
  </div>
</div>
</div>

</div>

</div>
