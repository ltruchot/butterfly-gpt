<template>
  <!-- Slide à IMAGE DE FOND plein écran (ratio préservé, `cover`). Pas de voile :
       on profite à fond du peps de l'image. Les titres sont des SFX à contour
       encré (lisibles seuls) ou des panneaux à fond propre.
       Usage : `layout: image-bg` + `image: /x.jpg`. -->
  <div class="imgbg-root h-full w-full relative" :style="bgStyle">
    <div class="imgbg-content absolute inset-0 flex flex-col justify-end items-center px-12 pb-12">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { withBase } from "../lib/asset.js";

const props = defineProps({
  image: { type: String, required: false },
});

const bgStyle = computed(() =>
  props.image
    ? {
        backgroundImage: `url("${withBase(props.image)}")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundColor: "var(--ink)",
      }
    : { backgroundColor: "var(--ink)" },
);
</script>
