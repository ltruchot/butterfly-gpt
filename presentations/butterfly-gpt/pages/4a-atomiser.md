---
layout: default
---

# {{ $t('atomiser.title') }}

<div class="rule-ink w-24 my-3" />

<div class="grid gap-5" style="grid-template-columns: 1fr 1fr; align-items: center">

<div>

<div class="panel panel-amber" v-click="2">

  <bgpt-sfx text-key="atomiser.vocab" color="amber" size="1.5rem" />

<ul style="line-height: 1.45">
<li v-html="$t('atomiser.li1')"></li>
<li v-html="$t('atomiser.li2')"></li>
<li v-html="$t('atomiser.li3')"></li>
<li v-html="$t('atomiser.li4')"></li>
</ul>

</div>

<div class="panel mt-3 panel-teal" v-click="3">

  Token <bgpt-sfx text="B . O . S" color="teal" size="1.2rem" class="inline-block" /> (Beginning Of Sequence) <span v-html="$t('atomiser.bosSpan')"></span>

</div>

</div>

<div class="text-center">
  <bgpt-plate src="/comic-atomiser.jpg" max-height="52vh" v-click="1" />
</div>

</div>
