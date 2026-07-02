<template>
  <!-- Reprend l'« effet blur » du thème (dynamic-image) mais contrôlable :
       moitié gauche = texte sur papier, moitié droite = image FLOUTÉE (blur 3px),
       et une copie NETTE flottante (`float`) au centre, qui CHEVAUCHE le cartouche
       de texte (z au-dessus) + ombre portée. `floatWidth` règle sa taille (par
       défaut 337px ≈ 25% de moins que le thème, pour ne pas pixelliser une petite
       planche). Usage : `layout: image-blur` + `image:` (+ `float:` net, souvent
       la même image). -->
  <div class="ib-root h-full w-full relative grid grid-cols-2">
    <template v-if="imageLeft">
      <div class="ib-bg" :style="bgStyle" />
      <div class="ib-text slidev-layout flex flex-col justify-center"><slot /></div>
    </template>
    <template v-else>
      <div class="ib-text slidev-layout flex flex-col justify-center"><slot /></div>
      <div class="ib-bg" :style="bgStyle" />
    </template>
    <img
      v-if="float"
      :src="withBase(float)"
      alt=""
      class="ib-float"
      :style="{ width: floatWidth, left: floatLeft }"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { withBase } from "../lib/asset.js";

const props = defineProps({
  image: { type: String, required: false }, // fond flouté
  float: { type: String, required: false }, // copie nette flottante (souvent = image)
  floatWidth: { type: String, default: "337px" },
  // position horizontale du centre de la planche (CSS `left`). 50% = centre slide ;
  // plus grand = plus à droite, plus petit = plus à gauche.
  floatLeft: { type: String, default: "50%" },
  // false (défaut) : texte à gauche, flou à droite (ex. Singularité).
  // true : flou à gauche, texte à droite (ex. Mentor, miroir).
  imageLeft: { type: Boolean, default: false },
});

const bgStyle = computed(() =>
  props.image
    ? {
        backgroundImage: `url("${withBase(props.image)}")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }
    : {},
);
</script>

<style scoped>
.ib-text {
  background: var(--paper);
  z-index: 1;
}
.ib-bg {
  filter: blur(3px);
}
.ib-float {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 5;
  border: 3px solid var(--ink);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.7);
}
</style>
