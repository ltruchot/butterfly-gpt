---
layout: default
---

# {{ $t('neurones.title') }}

<div class="rule-ink w-24 my-3" />

<div class="text-lg flex items-center gap-3" v-click="1">
{{ $t('neurones.lead') }} <bgpt-sfx text="Alien!" color="crimson" size="2.2rem" />
</div>

<div class="panel" style="max-width: 52rem; margin-top: 3.15rem; margin-bottom: 3.6rem" v-click="2" v-html="$t('neurones.aiPanel')"></div>

<div class="flex items-center gap-7" style="margin-top: 1.35rem">

<bgpt-plate src="/comic-papillon-sourcil.jpg" max-height="30vh" v-click="3" />

<div style="line-height: 1.6">

<div style="font-family:'Anton',sans-serif; text-transform:uppercase; font-size:1.7rem" v-click="4">
<span style="color:var(--amber)">G</span>enerative
<span style="font-family:'Poppins',sans-serif; text-transform:none; font-size:0.95rem; opacity:0.55">  {{ $t('neurones.gen') }}</span>
</div>

<div style="padding-left:2.5rem; font-family:'Anton',sans-serif; text-transform:uppercase; font-size:1.7rem" v-click="5">
<span style="color:var(--amber)">P</span>re-Trained
<span style="font-family:'Poppins',sans-serif; text-transform:none; font-size:0.95rem; opacity:0.55">  {{ $t('neurones.pretrain') }}</span>
</div>

<div style="padding-left:5rem; font-family:'Anton',sans-serif; text-transform:uppercase; font-size:1.7rem" v-click="6">
<span style="color:var(--amber)">T</span>ransformer
<span style="font-family:'Poppins',sans-serif; text-transform:none; font-size:0.95rem; opacity:0.55">  {{ $t('neurones.transform') }}</span>
</div>

</div>

</div>

<!--
Note pour moi : les mots qui me viennent sont eux aussi générés un par un.
Je suis spectateur de ma propre voix — seule l'intention est en moi, le reste
vient tout seul. Vous êtes mon prompt.
-->
