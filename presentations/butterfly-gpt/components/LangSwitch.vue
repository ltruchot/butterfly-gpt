<template>
  <!-- Sélecteur de langue de la page d'accueil. Bascule la langue EN DIRECT
       (la ref `lang` re-rend les templates) ET met l'URL en miroir
       (/fr/<n> ⇄ /en/<n>) pour que le lien partagé ouvre la bonne langue. -->
  <div class="lang-switch">
    <button type="button" :class="{ active: lang === 'fr' }" @click="choose('fr')">FR</button>
    <span class="sep">/</span>
    <button type="button" :class="{ active: lang === 'en' }" @click="choose('en')">EN</button>
  </div>
</template>

<script setup lang="ts">
import { useNav } from "@slidev/client";
import { lang, setLang, type Lang } from "../i18n/lang.ts";

// `useNav` est l'API publique Slidev (déjà résolue) : on récupère le numéro de
// slide courant ET le routeur, sans dépendre directement de vue-router.
const { currentSlideNo, router } = useNav();

function choose(l: Lang): void {
  setLang(l);
  // Navigation directe vers /<lang>/<no> : l'URL passe en miroir en un seul saut.
  void router.replace(`/${l}/${currentSlideNo.value}`);
}
</script>

<style scoped>
.lang-switch {
  position: absolute;
  top: 1rem;
  right: 1.2rem;
  z-index: 4;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-family: "Poppins", sans-serif;
  font-weight: 700;
  font-size: 0.85rem;
}
.lang-switch button {
  color: var(--paper);
  opacity: 0.55;
  padding: 0.1rem 0.35rem;
  border-radius: 0.25rem;
  transition: opacity 0.15s;
}
.lang-switch button:hover {
  opacity: 0.85;
}
.lang-switch button.active {
  opacity: 1;
  color: var(--amber);
}
.lang-switch .sep {
  color: var(--paper);
  opacity: 0.4;
}
</style>
