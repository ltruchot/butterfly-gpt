// ═══════════════════════════════════════════════════════════════════════════
// État RÉACTIF de la langue courante + passerelle vers le monde non-Vue.
// ═══════════════════════════════════════════════════════════════════════════
// `lang` est une ref Vue : tout template qui lit `$t(...)` (qui lit `lang.value`)
// se re-rend automatiquement au changement de langue.
//
// Les web components <bgpt-*> vivent HORS de la réactivité Vue : ils ne peuvent
// pas observer la ref. On leur fournit donc `getLang()` (lecture ponctuelle) et
// on émet un événement `window` `bgpt:langchange` à chaque bascule, qu'ils
// écoutent pour se re-rendre.
import { ref } from "vue";
import type { Lang } from "./dict.ts";

export type { Lang };

const STORAGE_KEY = "bgpt-lang";

// La langue active. Défaut FR (deck officiel) ; la vraie valeur est fixée par le
// routeur (segment d'URL /fr|/en) au premier rendu, cf. setup/main.ts.
export const lang = ref<Lang>("fr");

// Lecture ponctuelle pour le code non réactif (logique des web components).
export const getLang = (): Lang => lang.value;

// Langue mémorisée d'une visite précédente (ou null). Sert de défaut quand
// l'URL n'a pas de segment de langue.
export const storedLang = (): Lang | null => {
  if (typeof localStorage === "undefined") return null;
  const v = localStorage.getItem(STORAGE_KEY);
  return v === "fr" || v === "en" ? v : null;
};

// Bascule la langue : met à jour la ref (→ re-rend les templates Vue),
// l'attribut <html lang>, le localStorage, et prévient le monde non-Vue.
export const setLang = (l: Lang): void => {
  if (lang.value !== l) lang.value = l;
  if (typeof document !== "undefined") document.documentElement.lang = l;
  if (typeof localStorage !== "undefined") localStorage.setItem(STORAGE_KEY, l);
  if (typeof window !== "undefined")
    window.dispatchEvent(new CustomEvent<Lang>("bgpt:langchange", { detail: l }));
};
