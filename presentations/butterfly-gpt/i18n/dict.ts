// ═══════════════════════════════════════════════════════════════════════════
// Accès au wording — helpers PURS (zéro Vue, zéro DOM sauf domLang).
// ═══════════════════════════════════════════════════════════════════════════
// La DONNÉE vit dans fr.ts / en.ts (recopiée verbatim des anciennes pages). Ici,
// seulement de quoi la lire : choisir la langue, résoudre une clé, lire la langue
// active côté navigateur, et la locale Intl pour le formatage des nombres.
import { en } from "./en.ts";
import { fr, type Dict } from "./fr.ts";

export type Lang = "fr" | "en";
export type { Dict };

// Renvoie le dictionnaire d'une langue (utilisable hors Vue — p.ex. dans la
// logique des web components qui vivent hors réactivité Vue).
export const pick = (lang: Lang): Dict => (lang === "en" ? en : fr);

// Résout un chemin pointé ("cover.title") dans le dico d'une langue. Si la clé
// manque, renvoie le chemin lui-même (une clé oubliée saute aux yeux à l'écran).
export const resolve = (lang: Lang, path: string): string => {
  let cur: unknown = pick(lang);
  for (const seg of path.split(".")) {
    if (cur && typeof cur === "object") cur = (cur as Record<string, unknown>)[seg];
    else return path;
  }
  return typeof cur === "string" ? cur : path;
};

// Lit la langue active depuis l'attribut <html lang> (posé par setLang). Permet
// au code NON-Vue (web components + logique des démos) de connaître la langue
// sans dépendre de la ref. En test (pas de document) ou si non posé → défaut FR.
export const domLang = (): Lang => {
  if (typeof document === "undefined") return "fr";
  return document.documentElement.lang === "en" ? "en" : "fr";
};

// Locale Intl pour le formatage des nombres (virgule FR vs point EN).
export const locale = (lang: Lang): string => (lang === "en" ? "en-US" : "fr-FR");
