---
layout: image-blur
image: /true_andrej.png
float: /true_andrej.png
floatWidth: 320px
floatLeft: 33%
imageLeft: true
---

# Sage

{{ $t('carpates.subtitle') }}

<!-- Planche BD : une grande case en haut (le parcours), deux cases dessous.
     Titres en lettrage graffiti (Sfx / Bangers). Les cases remplissent la
     moitié droite (peu de marge), le portrait flottant reste à gauche. -->
<div class="flex flex-col gap-3 mt-3 -mx-[1.6rem]">

<!-- Case du haut : le parcours -->
<div class="panel panel-amber" style="padding: 0.7rem 1.1rem" v-click>
<bgpt-sfx text="GENIUS" color="amber" size="1.4rem" class="inline-block" />
<div class="mt-1" v-html="$t('carpates.journey')"></div>
</div>

<!-- Deux cases en dessous -->


<div class="panel panel-teal" style="padding: 0.7rem 1.1rem" v-click>
<bgpt-sfx text="EUREKA" color="ink" size="1.4rem" class="inline-block" />
<ul class="mt-1">

<li>micrograd · <strong>microgpt</strong> · nanoChat</li>
<li>LLM101n</li>
</ul>



</div>

</div>
