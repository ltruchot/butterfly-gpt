---
layout: default
---

# {{ $t('annexeEnVrai.title') }}

<div class="rule-ink w-24 my-3" />

<p class="text-sm opacity-80 mt-0 mb-2" v-html="$t('annexeEnVrai.lead')"></p>

<div class="panel mb-3 panel-amber">
  <div class="label-teal" style="font-size: 0.95rem; display: inline-block; margin-right: 0.5rem">{{ $t('annexeEnVrai.labelSimpler') }}</div>
  <span class="text-sm" v-html="$t('annexeEnVrai.amberNote')"></span>
</div>

<div class="grid grid-cols-2 gap-5 items-start text-sm">

<div class="panel panel-teal">
  <bgpt-sfx text-key="annexeEnVrai.sfxBuild" color="ink" size="1.05rem" />

- <strong style="color: var(--teal)">Data</strong> — <span v-html="$t('annexeEnVrai.data')"></span>
- <strong style="color: var(--teal)">Tokenizer</strong> — <span v-html="$t('annexeEnVrai.tokenizer')"></span>
- <strong style="color: var(--teal)">Autograd</strong> — <span v-html="$t('annexeEnVrai.autograd')"></span>
- <strong style="color: var(--teal)">Architecture</strong> — <span v-html="$t('annexeEnVrai.architecture')"></span>

</div>

<div class="panel panel-crimson">
  <bgpt-sfx text-key="annexeEnVrai.sfxScale" color="white" size="1.05rem" />

- <strong style="color: var(--crimson)">Training</strong> — <span v-html="$t('annexeEnVrai.training')"></span>
- <strong style="color: var(--crimson)">Optimization</strong> — <span v-html="$t('annexeEnVrai.optimization')"></span>
- <strong style="color: var(--crimson)">Post-training</strong> — <span v-html="$t('annexeEnVrai.postTraining')"></span>
- <strong style="color: var(--crimson)">Inference</strong> — <span v-html="$t('annexeEnVrai.inference')"></span>

</div>

</div>
