---
layout: image-blur
image: /comic-klowd.jpg
float: /comic-klowd.jpg
floatWidth: 337px
floatLeft: 64%
---

# {{ $t('singularite.title') }}

{{ $t('singularite.subtitle') }}

<!-- Miroir de « L'homme des Carpates » (1c), inversé gauche/droite : ici l'image
     est à DROITE (imageLeft défaut = false), les cartouches à GAUCHE. Lettrage
     graffiti (Sfx / Bangers), cases qui remplissent la moitié gauche. -->
<!-- cartouche pleine largeur, en HAUT : la « boss des maths » occupe le coin
     bas-gauche en dessous (cf. bloc image en bas de page). -->
<div class="flex flex-col gap-3 mt-3 mr-6">

<div class="panel panel-amber" style="padding: 0.7rem 1.1rem" v-click>
<bgpt-sfx text-key="singularite.azur" color="amber" size="1.5rem" class="inline-block" />
<ul class="text-sm" style="list-style: disc; padding-left: 1.2rem; margin: 0.4rem 0 0">
<li v-html="$t('singularite.butler')"></li>
<li>{{ $t('singularite.psychosis') }}</li>
<li>{{ $t('singularite.discovery') }}</li>
</ul>
</div>


</div>

<!-- pousse tout le bloc (titre + cartouche) vers le HAUT — le layout image-blur
     centre verticalement, ce spacer libère le bas pour la « boss des maths ». -->
<div style="flex: 1 1 auto" />

<!-- « La boss des maths » (la même qu'en 1b, à droite) mais ici en BAS À GAUCHE :
     on retire le scaleX(-1) de 1b (donc l'inverse / le miroir) pour qu'elle
     regarde vers la droite, c.-à-d. vers le centre de la slide. -->
<div style="position: absolute; left: 13%; bottom: 0; width: 192px; text-align: center" v-click>
  <div style="margin-bottom: 0.15rem; position: relative; z-index: 1; top: 5%; transform: rotate(-5deg)">
    <bgpt-sfx text-key="common.mathBoss" color="ink" size="1.4rem" />
  </div>
  <img :src="$asset('/klowd-boss-math-2.png')" style="width: 185px; display: block; margin: 0 auto" />
</div>
