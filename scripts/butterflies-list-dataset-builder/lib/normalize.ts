// Normalisation des noms de papillons :
//  - lowercase
//  - drop le contenu entre parenthèses (disambiguation Wikipedia, sous-genres…)
//  - split sur virgules/points-virgules → entrées multiples
//  - NORMALISE les apostrophes (', ‘, ’, ʼ, `) vers UNE forme canonique propre à
//    la langue et les GARDE (« l'orme » → « l’orme ») — c'est un caractère à part
//    entière des noms. La forme canonique est paramétrable :
//      • français → ’ (typographique, classique en FR)
//      • anglais  → ' (apostrophe droite, classique en EN : « baird's »)
//  - remplace l'autre ponctuation (. ; : ! ? ") par un espace
//  - ne garde que a-z, accents français, les deux apostrophes ' et ’, espace, tiret
//  - collapse espaces multiples, trim
//  - rejette les entrées trop courtes (<2) ou trop longues (>100)

const FRENCH_ACCENTS = "àâäæçèéêëîïôöùûüÿœñ";
// On autorise les DEUX formes d'apostrophe dans le charset ; seule la forme
// canonique choisie apparaîtra réellement après normalisation.
const ALLOWED_REGEX = new RegExp(`[^a-z${FRENCH_ACCENTS}'’ \\-]`, "g");
const APOSTROPHE_VARIANTS_REGEX = /['‘’ʼ`´]/g; // toutes les variantes (dont ´ acute) → forme canonique
const OTHER_PUNCT_REGEX = /[.;:!?"]/g; // vraie ponctuation → espace
const PARENS_REGEX = /\s*\([^)]*\)\s*/g;
const MULTI_SPACE_REGEX = /\s+/g;

/**
 * `apostrophe` = forme canonique vers laquelle unifier (’ pour FR, ' pour EN).
 * `splitOnOr` = aussi découper sur le mot « or » (noms alternatifs anglais :
 * « monarch or milkweed » → 2 noms). ⚠️ ANGLAIS uniquement : en français « or »
 * est une couleur. On ne découpe JAMAIS sur « and » (« heart and dart » est un
 * vrai nom unique).
 */
export function normalize(raw: string, apostrophe = "’", splitOnOr = false): string[] {
  // 1) drop parenthetical content
  let s = raw.replace(PARENS_REGEX, " ");
  // 2) lowercase
  s = s.toLowerCase();
  // 3) split on commas/semicolons/slashes (+ « or » si demandé)
  let parts = s.split(/[,;/]/);
  if (splitOnOr) parts = parts.flatMap((p) => p.split(/\bor\b/));
  return parts
    .map((part) => {
      // apostrophes : on les UNIFIE vers la forme canonique et on les conserve
      let q = part.replace(APOSTROPHE_VARIANTS_REGEX, apostrophe);
      q = q.replace(OTHER_PUNCT_REGEX, " ");
      q = q.replace(ALLOWED_REGEX, " ");
      // Une apostrophe n'est valide qu'ENTRE deux lettres (« l’orme », « baird's »).
      // Sinon (en tête, en fin, ou isolée) c'est un guillemet du source
      // (''Himerarctia docis'') → on l'efface.
      q = q.replace(/(?<!\p{L})['’]+|['’]+(?!\p{L})/gu, " ");
      q = q.replace(MULTI_SPACE_REGEX, " ").trim();
      // strip leading/trailing hyphens
      q = q.replace(/^-+|-+$/g, "").trim();
      // Couper à un « f » ISOLÉ = abréviation de forma (rang infra-spécifique)
      // dans un nom scientifique parasite (« … f l epiphanes »). On garde la
      // partie AVANT. Aucun vrai nom vernaculaire n'a un « f » seul (validé).
      const words = q.split(" ");
      const fIdx = words.indexOf("f");
      if (fIdx >= 0) q = words.slice(0, fIdx).join(" ").trim();
      return q;
    })
    .filter((p) => p.length >= 2 && p.length <= 100);
}

export function normalizeMany(lines: Iterable<string>, apostrophe = "’"): Set<string> {
  const out = new Set<string>();
  for (const line of lines) {
    for (const n of normalize(line, apostrophe)) out.add(n);
  }
  return out;
}

// ════════════════════════════════════════════════════════════════════════
// FILTRE ANTI-DÉCHET (prose Wikipédia qui a fui : descriptions, titres de
// livres, noms d'auteurs, fragments de phrases…)
// ════════════════════════════════════════════════════════════════════════

/**
 * Mots-marqueurs de PROSE : ils n'apparaissent JAMAIS dans un vrai nom de
 * papillon, mais trahissent une phrase/description/citation. Validé en dry-run :
 * n'élimine que du déchet. ⚠️ À n'appliquer qu'au FRANÇAIS — en anglais ces mots
 * sont légitimes (« common blue », « mother of pearl »…).
 */
export const PROSE_MARKERS_FR: ReadonlySet<string> = new Set([
  "qui",
  "aussi",
  "parfois",
  "orthographié",
  "désigne",
  "référence",
  "allusion",
  "pdf",
  "dictionary",
  "common",
  "names",
  "of",
  "agricultural",
  "organisms",
  "thesaurus",
  "vernaculaires",
  "populations",
  "espèce",
  "espèces",
  "risque",
  "confusion",
  "guide",
  "système",
  "badges",
  "concentration",
  "nazis",
  "plante",
  "plantes",
  "larvaire",
  "site",
  "français",
  "histoire",
  "naturelle",
  "dictionnaire",
  "sciences",
  "vertèbres",
  "pour",
  "avec",
  "nomen",
  "meyer",
]);

/** Nombre de mots max d'un vrai nom. Validé : aucun vrai papillon FR > 7 mots. */
export const MAX_WORDS = 7;

const LONE_CONSONANT = /^[bcdfghjklmnpqrstvwxz]$/;

/**
 * Raison de rejet d'un nom DÉJÀ normalisé, ou `null` s'il faut le garder.
 *   - `"mots>N"`             : trop de mots (= phrase/titre/description).
 *   - `"lettres-isolées"`    : deux consonnes ISOLÉES consécutives (« p d duidae »,
 *                              « du p n ») = débris de citation/abréviation. Un vrai
 *                              motif alaire n'a qu'UNE lettre isolée (« c noir »).
 *   - `"url"`                : fragment d'URL (« www cbif gc ca ») = lien web qui
 *                              a fui (les points sont devenus des espaces).
 *   - `"marqueur:X"`         : contient le mot de prose `X` (jamais dans un nom).
 * `markers` vide ⇒ marqueurs ignorés (cas anglais/latin).
 *
 * NB : le COMPTE de mots se fait sur les ESPACES uniquement — un mot composé à
 * tiret (« sud-américaine », « robert-le-diable ») compte pour UN mot. La
 * détection de marqueurs, elle, découpe aussi sur tiret/apostrophe pour attraper
 * « sous-espèce » → « espèce ».
 */
export function rejectReason(
  name: string,
  markers: ReadonlySet<string> = new Set(),
  maxWords = MAX_WORDS,
): string | null {
  const words = name.split(" ").filter(Boolean);
  if (words.length > maxWords) return `mots>${maxWords}`;
  if (words.some((w) => w === "www" || w === "http" || w === "https")) return "url";
  for (let i = 0; i + 1 < words.length; i++) {
    if (LONE_CONSONANT.test(words[i]!) && LONE_CONSONANT.test(words[i + 1]!)) {
      return "lettres-isolées";
    }
  }
  // ≥ 3 lettres isolées au total = débris de diacritiques étrangers effacés
  // (« Trần Khắc Quyền » → « tr n kh c quy n »). Un vrai nom FR n'en a qu'une ou
  // deux au plus (motifs alaires « à c d’or », « à l double »).
  if (words.filter((w) => /^\p{L}$/u.test(w)).length >= 3) return "lettres-isolées";
  const hit = name
    .split(/[ \-’']/)
    .filter(Boolean)
    .find((t) => markers.has(t));
  return hit ? `marqueur:${hit}` : null;
}

const ELISION_VOWEL = /^[aàâäeéèêëiîïoôöuùûüyœæh]/;

/**
 * Re-colle un article élidé ORPHELIN : un « d » ou « l » isolé suivi d'un mot à
 * voyelle (ou h muet) → « d’ »/« l’ » : « l aurore » → « l’aurore », « argus d
 * eschscholtz » → « argus d’eschscholtz ». (L'apostrophe avait été perdue —
 * remplacée par une espace — au scraping.)
 *
 * EXCEPTION : jamais après « à ». Là, le d/l est un MOTIF ALAIRE (« à l double »,
 * « à l entier »), pas un article. ⚠️ FRANÇAIS uniquement (l'anglais n'élide pas).
 */
export function reglueFrenchElision(name: string): string {
  const w = name.split(" ");
  const out: string[] = [];
  for (let i = 0; i < w.length; i++) {
    const cur = w[i]!;
    if (
      (cur === "d" || cur === "l") &&
      i + 1 < w.length &&
      ELISION_VOWEL.test(w[i + 1]!) &&
      w[i - 1] !== "à"
    ) {
      out.push(`${cur}’${w[i + 1]}`);
      i++;
    } else {
      out.push(cur);
    }
  }
  return out.join(" ");
}

/**
 * Fusionne « de de » consécutifs en un seul « de ». Vient de « X de De Y » (la
 * particule « De » d'un nom d'auteur, ex. « moiré de De Lesse ») → après
 * lowercase « de de ». ⚠️ On ne touche QU'À « de » : les répétitions latines
 * (« victoriae victoriae », sous-espèce nominale) sont VALIDES et préservées.
 */
export function collapseRepeatedDe(name: string): string {
  const out: string[] = [];
  for (const word of name.split(" ")) {
    if (word === "de" && out[out.length - 1] === "de") continue;
    out.push(word);
  }
  return out.join(" ");
}

/**
 * Retire l'ARTICLE DÉFINI/INDÉFINI de tête : les guides naturalistes listent
 * souvent les noms vernaculaires avec leur article (« la Belle-Dame »,
 * « l'Acidalie disparate »), mais d'autres sources donnent la forme nue. Garder
 * les deux pollue le corpus de doublons et apprend au modèle « le/la » comme
 * préfixe parasite. On uniformise vers la forme NUE (comme microgpt) ; le Set de
 * dédup fusionne alors « l'acidalie disparate » et « acidalie disparate ».
 *
 * ⚠️ On ne touche QU'À l'article de TÊTE — « de la », « du » INTERNES (« piéride
 * du chou ») sont des connecteurs essentiels, préservés. À appliquer APRÈS
 * reglueFrenchElision (qui reconstruit un éventuel « l’ » orphelin).
 */
export function stripLeadingArticle(name: string): string {
  return name.replace(/^(le |la |les |un |une )/, "").replace(/^l’/, "");
}
