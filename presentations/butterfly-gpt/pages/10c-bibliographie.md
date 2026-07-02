---
layout: default
---

# {{ $t('bibliographie.title') }}

<div class="rule-ink w-24 my-3" />

<div class="text-sm" v-html="$t('bibliographie.slidesOnline')"></div>

<div class="grid grid-cols-3 gap-6 mt-2">

<div class="panel panel-crimson">
  <bgpt-sfx text-key="bibliographie.sfxSource" color="amber" size="1.5rem" />
  <div class="text-sm mt-2" style="line-height: 1.7" v-html="$t('bibliographie.source')"></div>
</div>

<div class="panel panel-ink">
  <bgpt-sfx text-key="bibliographie.sfxPodcasts" color="white" size="1.5rem" />
  <div class="text-sm mt-2" style="line-height: 1.7" v-html="$t('bibliographie.podcasts')"></div>
</div>

<div class="panel panel-teal">
  <bgpt-sfx text-key="bibliographie.sfxCuisine" color="white" size="1.5rem" />
  <div class="text-sm mt-2" style="line-height: 1.7" v-html="$t('bibliographie.cuisine')"></div>
</div>

</div>

<div class="mt-3" style="font-size: 0.6rem; line-height: 1.45; color: var(--slate)" v-html="$t('bibliographie.licence')"></div>
