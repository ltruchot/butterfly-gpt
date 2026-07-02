// ═══════════════════════════════════════════════════════════════════════════
// Logique pure de la « dérivée partielle » : l'aire d'un parterre = L × H.
// ═══════════════════════════════════════════════════════════════════════════
// POURQUOI (intuition) : l'aire d'un rectangle est une MULTIPLICATION, aire =
// largeur × hauteur. Une dérivée PARTIELLE, c'est la vitesse de l'aire quand on
// ne pousse QU'UN côté à la fois (l'autre figé). Élargir d'un poil ajoute une
// fine bande dont la surface vaut la HAUTEUR → ∂aire/∂largeur = hauteur. Et
// symétriquement ∂aire/∂hauteur = largeur. La dérivée d'une entrée = l'AUTRE.
//
// On isole ici TOUTE la géométrie et le calcul (zéro DOM, hors i18n) pour pouvoir
// les tester seuls ; le composant ne fait que brancher les curseurs et dessiner.
// Les fonctions d'affichage prennent une `lang` (défaut `domLang()` au runtime).
import { domLang, type Lang, locale } from "../../i18n/dict.ts";

// ── Repère pixels (cf. DeriveePapillon / interlude /derivee d'apps/demos) ─────
export const VIEW_W = 560;
export const VIEW_H = 188;
export const PAD_L = 70;
export const PAD_R = 30;
export const PAD_T = 20;
export const PAD_B = 28;
export const STRIP = 13; // épaisseur de la bande marginale, en pixels

// bornes des deux côtés (en « unités-jardin »)
export const L_MAX = 9;
export const H_MIN = 1;
export const H_MAX = 6;

// échelle : pixels par unité, calée sur les bornes max
export const SX = (VIEW_W - PAD_L - PAD_R) / L_MAX;
export const SY = (VIEW_H - PAD_T - PAD_B) / H_MAX;
export const baseY = VIEW_H - PAD_B; // le sol

export type Cote = "L" | "H";

// Formate un nombre : 1 décimale par défaut (« 5,0 »/« 5.0 »), pour des cotes
// lisibles le long des curseurs.
export const fmt = (n: number, lang: Lang = domLang(), dec = 1): string =>
  n.toLocaleString(locale(lang), { maximumFractionDigits: dec, minimumFractionDigits: dec });

// ── Géométrie du rectangle (ancré en bas-gauche, monte vers le haut) ──────────
export const rectWOf = (L: number): number => L * SX;
export const rectHOf = (H: number): number => H * SY;
export const rectYOf = (H: number): number => baseY - rectHOf(H);

// ── Lecture pédagogique ───────────────────────────────────────────────────────
// L'aire elle-même (le produit) …
export const aireOf = (L: number, H: number): number => L * H;

// … et le libellé de la dérivée partielle ACTIVE : la dérivée d'un côté = l'AUTRE.
const PARTIAL_TXT: Record<Lang, { l: (h: string) => string; h: (l: string) => string }> = {
  fr: {
    l: (h) => `∂aire/∂largeur = hauteur = ${h}`,
    h: (l) => `∂aire/∂hauteur = largeur = ${l}`,
  },
  en: {
    l: (h) => `∂area/∂width = height = ${h}`,
    h: (l) => `∂area/∂height = width = ${l}`,
  },
};

export const partialLabel = (active: Cote, L: number, H: number, lang: Lang = domLang()): string =>
  active === "L" ? PARTIAL_TXT[lang].l(fmt(H, lang)) : PARTIAL_TXT[lang].h(fmt(L, lang));

// ── Accesseurs d'AFFICHAGE pour le markup Datastar (tolèrent des valeurs string,
//    car Datastar passe la valeur d'un <input range> en chaîne). ────────────────
export const lStr = (L: number | string): string => fmt(Number(L));
export const hStr = (H: number | string): string => fmt(Number(H));
export const aireStr = (L: number | string, H: number | string): string =>
  fmt(aireOf(Number(L), Number(H)));
export const partialLabelOf = (active: string, L: number | string, H: number | string): string =>
  partialLabel(active === "H" ? "H" : "L", Number(L), Number(H));
