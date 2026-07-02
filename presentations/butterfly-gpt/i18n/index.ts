// ═══════════════════════════════════════════════════════════════════════════
// Point d'entrée i18n : le helper `$t` global + son enregistrement.
// ═══════════════════════════════════════════════════════════════════════════
// `t("cover.title")` résout un chemin pointé dans le dictionnaire de la langue
// COURANTE. Comme il lit `lang.value` (une ref), tout appel `$t(...)` dans un
// template est suivi par Vue : changer la langue re-rend les `{{ $t() }}` et les
// `v-html="$t()"` sans rien recâbler.
import { resolve } from "./dict.ts";
import { lang } from "./lang.ts";

export * from "./lang.ts";
export { pick, resolve, domLang } from "./dict.ts";

// Résout un chemin "a.b.c" dans le dico de la langue COURANTE. Lit `lang.value`
// (ref) → tout `{{ $t(...) }}` est réactif : changer la langue re-rend.
export const t = (path: string): string => resolve(lang.value, path);

// Expose `$t` à TOUS les templates (pages markdown comprises, où l'on ne peut pas
// importer de fonction). Même mécanisme que `$asset` dans setup/main.ts.
export const registerI18n = (app: {
  config: { globalProperties: Record<string, unknown> };
}): void => {
  app.config.globalProperties.$t = t;
};
