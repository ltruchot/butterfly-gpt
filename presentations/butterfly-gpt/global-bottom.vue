<!-- Numéro de slide discret, rendu sur CHAQUE slide (sauf la cover). Slidev
     monte automatiquement `global-bottom.vue` au-dessus de chaque page. -->
<template>
  <div v-if="$slidev.nav.currentPage > 1" class="slide-no">
    {{ $slidev.nav.currentPage }}
  </div>
</template>

<style scoped>
.slide-no {
  position: absolute;
  right: 0.55rem;
  bottom: 0.4rem;
  z-index: 20;
  font-family: "Fira Code", monospace;
  font-size: 0.66rem;
  color: var(--ink, #15202b);
  opacity: 0.3;
  pointer-events: none;
  user-select: none;
}
</style>
