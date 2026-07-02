<template>
  <!-- Écran-titre (design v1) : fond sombre dégradé pétrole + trame halftone
       discrète, bloc-titre Anton en bas-gauche. AJOUT : la planche du comic
       posée au CENTRE, à sa taille naturelle (vraie <img>, jamais agrandie →
       aucune déformation).
       Copie conforme de butterfly-gpt/layouts/cover.vue (la source de vérité),
       SEUL delta : pas de <LangSwitch /> — la vitrine n'est pas bilingue. -->
  <div class="cover-root h-full w-full relative">
    <div class="cover-veil absolute inset-0" />
    <div class="cover-halftone absolute inset-0 halftone opacity-15" />
    <div v-if="image" class="cover-plate-wrap absolute inset-0 flex items-center justify-center">
      <div class="cover-plate ink-border-lg">
        <img :src="withBase(image)" alt="" />
      </div>
    </div>
    <div class="cover-content absolute inset-0 flex flex-col justify-end px-14 pt-14 pb-12">
      <div class="cover-title ink-border-lg">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { withBase } from "../lib/asset.js";

defineProps({
  image: { type: String, required: false },
});
</script>

<style scoped>
.cover-root {
  background-color: var(--slate);
}
.cover-veil {
  /* fond sombre dégradé pétrole (comme v1) */
  background: linear-gradient(160deg, #2b3a42 0%, #0f5e5a 52%, rgba(20, 17, 15, 0.95) 100%);
}
.cover-plate-wrap {
  /* on remonte la planche pour que le bandeau-titre ne coupe pas le lettrage
     « by Dave Gibbons » en bas du flanc gauche de la planche */
  padding-bottom: 8rem;
  z-index: 1;
}
.cover-plate {
  background: var(--ink);
  line-height: 0;
}
.cover-plate img {
  display: block;
  width: auto;
  height: auto;
  max-width: 100%;
  max-height: 56vh; /* plafond de sécurité ; sinon taille naturelle */
}
.cover-content {
  z-index: 2;
}
.cover-title {
  background: var(--teal);
  color: var(--paper);
  padding: 1.1rem 1.4rem;
  max-width: 34rem;
}
.cover-title :deep(h1) {
  font-family: "Anton", sans-serif;
  text-transform: uppercase;
  color: var(--paper);
  font-size: 3rem;
  line-height: 1;
  margin: 0;
}
.cover-title :deep(p) {
  color: var(--amber);
  font-family: "Anton", sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  font-size: 1.3rem;
  margin: 0.5rem 0 0;
  opacity: 1;
}
</style>
