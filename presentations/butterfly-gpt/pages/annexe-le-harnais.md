---
layout: default
---

# {{ $t('annexeLeHarnais.title') }}

<div class="rule-ink w-24 my-3" />

<p class="text-sm opacity-80 mt-0 mb-3" v-html="$t('annexeLeHarnais.lead')"></p>

<div class="grid grid-cols-2 gap-6 items-start">

<div class="panel" style="border-color: var(--teal); box-shadow: 8px 8px 0 var(--teal)">
  <bgpt-sfx text-key="annexeLeHarnais.sfxEverything" color="ink" size="1.6rem" />
  <p class="text-sm mt-2 mb-1" v-html="$t('annexeLeHarnais.everythingP1')"></p>
  <p class="text-sm mb-0 opacity-80" v-html="$t('annexeLeHarnais.everythingP2')"></p>
</div>

<div class="panel" style="border-color: var(--crimson); box-shadow: 8px 8px 0 var(--crimson)">
  <bgpt-sfx text-key="annexeLeHarnais.sfxNothing" color="white" size="1.5rem" />
  <p class="text-sm mt-2 mb-1" v-html="$t('annexeLeHarnais.nothingP1')"></p>

<div class="text-sm" style="line-height: 1.5">

- 🔧 <span v-html="$t('annexeLeHarnais.tools')"></span>
- 🔁 <span v-html="$t('annexeLeHarnais.loop')"></span>
- 🧠 <span v-html="$t('annexeLeHarnais.context')"></span>
- 🛡️ <span v-html="$t('annexeLeHarnais.guardrails')"></span>

</div>
</div>

</div>
