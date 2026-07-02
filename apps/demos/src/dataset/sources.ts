// Sources « brutes » émulées : un mélange de noms qu'on aurait grattés
// sur Wikipédia FR + iNaturalist avec leurs imperfections habituelles
// (majuscules incohérentes, doublons inter-sources, espaces parasites,
// lignes vides issues du parsing). Sert UNIQUEMENT à la démo Datastar
// du module `dataset` — ce n'est pas la matière première du training,
// qui est dans `data/butterflies/french.refined.txt` (déjà nettoyé).

export const RAW_COLLECTED: readonly string[] = [
  "Abraxas grossulariata", // Wikipedia
  "abraxas grossulariata", // iNaturalist (doublon de casse)
  "Abraxas sylvata",
  "abraxas sylvata ", // espace de bord
  "ABRAXAS SYLVATA", // criée en majuscules
  "Abromiade chaulée",
  "abromiade chaulée",
  "  abromiade chaulée  ", // espace de bord + doublon
  "Abromiade de la molinie",
  "abromiade de la molinie",
  "", // ligne vide (résidu de parsing)
  "Abromiade du millet",
  "ABROMIADE DU MILLET", // doublon criée
  "Acherontia atropos", // sphinx tête-de-mort
  "acherontia atropos",
  "Acherontie",
  "Acidalie ochracée",
  "acidalie ochracée",
  "Acidalie virginale",
  "Aglais io", // paon-du-jour
  "aglais io",
  "Aglais urticae", // petite tortue
  "aglais urticae",
  "Apatura iris", // grand mars changeant
  "apatura iris",
  "Apatura Ilia", // mars changeant
  "Argus bleu",
  "Argus bleu",
  "ARGUS BLEU",
  "", // autre vide
  "Azuré commun",
  "azuré commun",
  "Azuré des nerpruns",
  "Belle-dame",
  "belle-dame",
];

/**
 * Nettoyage minimal sur l'échantillon brut : trim, lower, dedup, filter.
 * NB : on ne TRIE PAS — le tri n'est pas une étape de curation, c'est une
 * étape distincte (le user a explicitement demandé « mais pas sort »).
 */
export const cleanCollected = (raw: readonly string[]): readonly string[] => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const entry of raw) {
    const normalized = entry.trim().toLowerCase();
    if (normalized.length === 0) continue;
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    out.push(normalized);
  }
  return out;
};
