---
layout: default
---

# {{ $t('merci.title') }}

<div class="rule-ink w-24 my-3" />

<div class="grid grid-cols-2 gap-6 mt-2">

<div class="panel panel-crimson">
  <bgpt-sfx text-key="merci.sfxSponsors" color="amber" size="1.5rem" />
  <div class="text-sm mt-2" style="line-height: 1.7" v-html="$t('merci.sponsors')"></div>
</div>

<div class="panel panel-teal">
  <bgpt-sfx text-key="merci.sfxLoved" color="white" size="1.5rem" />
  <div class="text-sm mt-2" style="line-height: 1.7" v-html="$t('merci.loved')"></div>
</div>

<div class="panel panel-amber">
  <bgpt-sfx text-key="merci.sfxMachines" color="ink" size="1.5rem" />
  <div class="text-sm mt-2" style="line-height: 1.7" v-html="$t('merci.machines')"></div>
</div>

<div class="panel panel-ink">
  <bgpt-sfx text-key="merci.sfxInspirations" color="white" size="1.5rem" />
  <div class="text-sm mt-2" style="line-height: 1.7" v-html="$t('merci.inspirations')"></div>
</div>

</div>
