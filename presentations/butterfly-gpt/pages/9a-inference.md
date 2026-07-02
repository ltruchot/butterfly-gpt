---
layout: default
---

# {{ $t('inferenceA.title') }}

<div class="rule-ink w-24 my-3" />

<div class="text-sm" style="color: var(--slate)" v-html="$t('inferenceA.intro')"></div>

<div class="grid grid-cols-[1fr_1fr] gap-6 mt-1 items-start">

<div>

<div class="panel panel-teal" v-click>
  <bgpt-sfx text-key="inferenceA.sfxGenerator" color="ink" size="1.6rem" />
  <p class="text-sm mt-1 mb-1" v-html="$t('inferenceA.genFrozen')"></p>

  <div class="text-xs mt-2" style="font-family: 'Fira Code', monospace; line-height: 1.5" v-html="$t('inferenceA.startStop')"></div>
</div>

</div>

<div>

<div class="panel panel-amber" v-click>
  <bgpt-sfx text-key="inferenceA.sfxTemperature" color="amber" size="1.6rem" />
  <p class="text-sm mt-1 mb-1" v-html="$t('inferenceA.tempDesc')"></p>
  <div class="text-xs" style="line-height: 1.6" v-html="$t('inferenceA.tempScale')"></div>
</div>

</div>

</div>

<div class="panel mt-3 panel-ink" style="padding: 0.6rem 1rem" v-click>
  <p class="text-sm mt-0 mb-0" v-html="$t('inferenceA.conclusion')"></p>
</div>
