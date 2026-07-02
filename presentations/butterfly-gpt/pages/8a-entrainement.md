---
layout: image-blur
image: /entrainement.png
float: /entrainement.png
floatWidth: 250px
floatLeft: 73%
---

# {{ $t('entrainement.title') }}

<div class="panel panel-teal" v-click>

<p class="text-sm mt-0 mb-1" v-html="$t('entrainement.zip')"></p>

<div class="label-crimson" style="font-size: 1rem; margin-top: 0.6rem">{{ $t('entrainement.moves') }}</div>

<div class="text-sm mt-1" style="line-height: 1.7">
  <div v-html="$t('entrainement.s1')"></div>
  <div v-html="$t('entrainement.s2')"></div>
  <div v-html="$t('entrainement.s3')"></div>
  <div v-html="$t('entrainement.s4')"></div>
  <div v-html="$t('entrainement.s5')"></div>
</div>

</div>
