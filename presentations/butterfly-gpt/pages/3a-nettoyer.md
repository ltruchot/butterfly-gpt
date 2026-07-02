---
layout: default
---

# {{ $t('nettoyer.title') }}

<div class="rule-ink w-24 my-3" />

<div class="grid gap-5" style="grid-template-columns: 1fr 1fr; align-items: center">

<div class="text-center">
  <bgpt-plate src="/comic-nettoyer.jpg" max-height="56vh" v-click />
</div>

<div>

<div class="panel panel-amber" v-click>

  <bgpt-sfx text-key="nettoyer.fuel" color="amber" size="1.1rem" />

<ul style="line-height: 1.5">
<li v-html="$t('nettoyer.li1')"></li>
<li v-html="$t('nettoyer.li2')"></li>
<li v-html="$t('nettoyer.li3')"></li>
</ul>

</div>

<div class="panel mt-3 panel-teal" v-click v-html="$t('nettoyer.always')"></div>

</div>

</div>

<!--
Garbage in, garbage out.
-->
