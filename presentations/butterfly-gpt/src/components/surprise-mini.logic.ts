// ═══════════════════════════════════════════════════════════════════════════
// Logique pure de la mini-démo « surprise » : −ln(proba) note la surprise.
// ═══════════════════════════════════════════════════════════════════════════
// POURQUOI (intuition) : à l'entraînement, le LLM est « puni » d'autant plus
// fort qu'il a donné une PETITE probabilité à la bonne issue. La punition vaut
// −ln(p) : si p→1 (il était sûr et juste) la surprise tombe à 0 ; si p→0 (sûr et
// FAUX) elle explose. C'est exactement le coût (cross-entropy, cf. 10-loss.ts).
//
// On isole ici TOUT le calcul (zéro DOM, zéro dépendance hors i18n) pour pouvoir
// le tester seul ; le composant ne fait ensuite que brancher un curseur.
//
// i18n : les fonctions d'affichage prennent une `lang` avec défaut `domLang()`
// (lue sur <html lang> au runtime) → appelées sans argument depuis les
// accesseurs Datastar, elles suivent la langue de la page ; appelées AVEC une
// langue, elles restent pures et testables dans les deux langues.
import { domLang, type Lang, locale } from "../../i18n/dict.ts";

// Formate un nombre : toujours 2 décimales (« 0,25 »/« 0.25 », « 3,00 »/« 3.00 »)
// — pour que la formule affichée reste stable et lisible.
export const fmt = (n: number, lang: Lang = domLang()): string =>
  n.toLocaleString(locale(lang), { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// La proba (entre 0 et 1) déduite du pourcentage du curseur (1..100).
export const probaOf = (pct: number): number => pct / 100;

// La « surprise » = −ln(p), ARRONDIE à 2 décimales : on compare les seuils sur
// la valeur réellement affichée pour que les mots collent toujours au nombre
// montré (ex. « 3,00 » → « très surpris », jamais « surpris »).
export const surpriseOf = (pct: number): number => {
  const s = Math.round(-Math.log(probaOf(pct)) * 100) / 100;
  // p=1 donne −ln(1) = −0 ; on normalise en +0 pour afficher « 0,00 » proprement.
  return s === 0 ? 0 : s;
};

// Réaction pédagogique (texte + émoji) selon le niveau de surprise affiché :
// forte (≥3), moyenne (≥1), poker face (≥0,6), faible (≥0,5), nulle (<0,5).
export type Reaction = { readonly emoji: string; readonly text: string };

// Textes bilingues co-localisés avec leurs seuils (couplés à la logique).
const REACTION_TXT: Record<Lang, Record<"veryHigh" | "high" | "poker" | "low" | "none", string>> = {
  fr: {
    veryHigh: "je suis très surpris !",
    high: "je suis surpris !",
    poker: "poker face.",
    low: "je m'y attendais.",
    none: "Zéro surprise.",
  },
  en: {
    veryHigh: "I'm very surprised!",
    high: "I'm surprised!",
    poker: "poker face.",
    low: "I expected that.",
    none: "Zero surprise.",
  },
};

export const reactionOf = (pct: number, lang: Lang = domLang()): Reaction => {
  const s = surpriseOf(pct);
  const txt = REACTION_TXT[lang];
  if (s >= 3) return { emoji: "🤯", text: txt.veryHigh };
  if (s >= 1) return { emoji: "😮", text: txt.high };
  if (s >= 0.6) return { emoji: "😐", text: txt.poker };
  if (s >= 0.5) return { emoji: "🙂", text: txt.low };
  return { emoji: "😎", text: txt.none };
};

// ── Accesseurs d'AFFICHAGE (chaînes prêtes à poser dans un `data-text`) ────────
// Appelés depuis le markup Datastar de la slide, p.ex.
//   <span data-text="window.bgpt.sm.surpriseStr($pct)"></span>
// Le signal `$pct` peut arriver en chaîne (valeur d'un <input range>) → on le
// repasse en nombre avant calcul.
const toNum = (pct: number | string): number => Number(pct);
export const probaStr = (pct: number | string): string => fmt(probaOf(toNum(pct)));
export const surpriseStr = (pct: number | string): string => {
  const s = surpriseOf(toNum(pct));
  return fmt(s === 0 ? 0 : s);
};
export const reactionText = (pct: number | string): string => reactionOf(toNum(pct)).text;
export const reactionEmoji = (pct: number | string): string => reactionOf(toNum(pct)).emoji;
