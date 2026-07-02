#!/usr/bin/env node
// Produit les fichiers refined à partir des raw :
//   data/butterflies/{latin,english,french}.raw.txt
//     → data/butterflies/{latin,english,french}.refined.txt
//
// Charset autorisé : [a-zàâäæçèéêëîïôöùûüÿœñ’ \-]  (lowercase only ; ’ = apostrophe).
//
// Pour le latin, on plafonne à 10 000 entrées :
//   - on garde uniquement les taxons présents dans latin.aligned.raw.txt
//     (= ceux qui ont au moins un nom vernaculaire EN dans GBIF)
//   - puis si encore > 10 000, on prend les 10 000 premiers alphabétiquement
//
// Usage: node scripts/normalize-butterflies.ts

import { readFile, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  collapseRepeatedDe,
  normalize,
  PROSE_MARKERS_FR,
  rejectReason,
  reglueFrenchElision,
  stripLeadingArticle,
} from "./lib/normalize.ts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const OUT_DIR = resolve(ROOT, "data/butterflies");
const LATIN_CAP = 10_000;

function log(msg: string): void {
  process.stderr.write(`${msg}\n`);
}

async function readLines(filename: string): Promise<string[]> {
  const text = await readFile(resolve(OUT_DIR, filename), "utf8");
  return text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

// Normalise + FILTRE le déchet. `apostrophe` = forme canonique de la langue
// (’ pour FR, ' pour EN/latin). `markers` = mots de prose à rejeter (FR seulement ;
// vide pour EN/latin, où ces mots sont légitimes). Renvoie les noms gardés ET la
// table des entrées écartées par le refinement (nom → raison, dédupliquée — on
// ne compte PAS les doublons naturels, juste les rejets du filtre).
// `transform` = passe optionnelle appliquée à chaque nom normalisé AVANT le rejet
// (ex. re-coller les articles élidés en français). `splitOnOr` = découper aussi
// sur « or » (noms alternatifs anglais), cf. normalize().
// `extraReject` = rejet supplémentaire spécifique à la langue (ex. fuites latines
// en FR), renvoyant une raison ou null.
function refine(
  lines: Iterable<string>,
  apostrophe: string,
  markers: ReadonlySet<string>,
  transform: (s: string) => string = (s) => s,
  splitOnOr = false,
  extraReject: (s: string) => string | null = () => null,
): { kept: Set<string>; discarded: Map<string, string> } {
  const kept = new Set<string>();
  const discarded = new Map<string, string>();
  for (const line of lines) {
    // POINTS dans la ligne raw = jamais un nom vernaculaire. Deux formes, qu'on
    // repère AVANT normalize() (qui change le point en espace et efface le signal) :
    //   • binôme ABRÉGÉ : initiale de genre + point + espace (« Y. cagnagella »,
    //     « N. donaldtrumpi ») — à NE PAS confondre avec les motifs alaires
    //     « V d'or »/« C noir » (sans point) ;
    //   • URL / fichier / citation : un point COLLÉ entre deux lettres
    //     (« tpittaway.tripod.com », « inpn.mnhn.fr », « index.php », « P.C. »).
    const raw = line.trim();
    const dotReason = /^\p{L}\.\s/u.test(raw)
      ? "abréviation"
      : /\p{L}\.\p{L}/u.test(raw)
        ? "url"
        : null;
    for (const n of normalize(line, apostrophe, splitOnOr)) {
      const name = transform(n);
      const reason = dotReason ?? rejectReason(name, markers) ?? extraReject(name);
      if (reason) discarded.set(name, reason);
      else kept.add(name);
    }
  }
  return { kept, discarded };
}

// Log VERBEUX de ce que le refinement a écarté — pour que l'humain sache à quoi
// s'en tenir (et repère un éventuel faux positif).
function logDiscards(lang: string, discarded: Map<string, string>): void {
  if (discarded.size === 0) {
    log(`  ${lang}: aucun rejet de refinement`);
    return;
  }
  const byReason = new Map<string, number>();
  for (const r of discarded.values()) byReason.set(r, (byReason.get(r) ?? 0) + 1);
  const recap = [...byReason]
    .sort((a, b) => b[1] - a[1])
    .map(([r, c]) => `${r}=${c}`)
    .join(", ");
  log(`  ${lang}: ${discarded.size} entrées écartées par le refinement (${recap}) :`);
  for (const [name, reason] of [...discarded].sort((a, b) => b[0].length - a[0].length)) {
    log(`      ✗ [${reason}] ${name}`);
  }
}

async function writeRefined(filename: string, items: string[]): Promise<void> {
  const path = resolve(OUT_DIR, filename);
  await writeFile(path, items.join("\n") + "\n", "utf8");
  log(`✓ ${filename}: ${items.length} lines`);
}

async function main(): Promise<void> {
  const collator = new Intl.Collator("fr", { sensitivity: "base" });

  // ── English (apostrophe droite ' ; PAS de marqueurs FR : « common blue »,
  //    « mother of pearl » sont légitimes → seul le plafond de mots filtre) ──
  const enRaw = await readLines("english.raw.txt");
  const en = refine(enRaw, "'", new Set(), (s) => s, true); // splitOnOr = noms alternatifs
  logDiscards("english", en.discarded);
  const enRefined = [...en.kept].sort((a, b) => collator.compare(a, b));
  await writeRefined("english.refined.txt", enRefined);

  // ── French (apostrophe typographique ’ + marqueurs de prose + anti-fuite latine) ──
  // Fuite latine = un binôme scientifique « genre espèce » qui a atterri dans le
  // FR. Signal SÛR : multi-mots + AUCUN signal français (ni « de/la/… » ni
  // apostrophe) + présent dans le corpus latin. On ne touche PAS aux mono-mots
  // (« sphinx », « procris » sont à la fois des noms FR ET des genres latins).
  // On NORMALISE le latin (pas juste lowercase) pour que les binômes abrégés
  // (« Y. cagnagella » → « y cagnagella ») matchent la forme normalisée du FR.
  const latinNames = new Set((await readLines("latin.raw.txt")).flatMap((l) => normalize(l, "'")));
  const FR_CONNECTORS = new Set([
    "de",
    "du",
    "des",
    "la",
    "le",
    "les",
    "à",
    "au",
    "aux",
    "en",
    "et",
    "sur",
    "sous",
    "ou",
  ]);
  const frSignal = (s: string): boolean =>
    s.includes("’") || s.split(/[ -]/).some((w) => FR_CONNECTORS.has(w));
  // Mot répété consécutif (hors « de ») = sous-espèce nominale latine
  // (« steneles steneles », « hydarus hydarus ») — jamais dans un nom FR.
  const hasRepeatedWord = (s: string): boolean => {
    const w = s.split(" ");
    for (let i = 0; i + 1 < w.length; i++) if (w[i] === w[i + 1] && w[i] !== "de") return true;
    return false;
  };
  const latinLeak = (s: string): string | null =>
    s.includes(" ") && !frSignal(s) && (latinNames.has(s) || hasRepeatedWord(s)) ? "latin" : null;

  const frRaw = await readLines("french.raw.txt");
  const fr = refine(
    frRaw,
    "’",
    PROSE_MARKERS_FR,
    (s) => stripLeadingArticle(collapseRepeatedDe(reglueFrenchElision(s))),
    false,
    latinLeak,
  );
  logDiscards("french", fr.discarded);
  const frRefined = [...fr.kept].sort((a, b) => collator.compare(a, b));
  await writeRefined("french.refined.txt", frRefined);

  // ── Latin (cap 10k aligné EN ; pas de marqueurs FR) ──────────────────
  let latinAligned: string[];
  try {
    latinAligned = await readLines("latin.aligned.raw.txt");
    log(`latin.aligned.raw.txt: ${latinAligned.length} taxa with EN vernacular`);
  } catch {
    log(`latin.aligned.raw.txt missing — falling back to latin.raw.txt (no cap)`);
    latinAligned = await readLines("latin.raw.txt");
  }
  const latin = refine(latinAligned, "'", new Set());
  logDiscards("latin", latin.discarded);
  const latinNorm = [...latin.kept].sort((a, b) => collator.compare(a, b));
  const latinCapped = latinNorm.slice(0, LATIN_CAP);
  log(
    `latin: aligned=${latinAligned.length} → normalized=${latinNorm.length} → capped=${latinCapped.length}`,
  );
  await writeRefined("latin.refined.txt", latinCapped);

  // ── Sanity: vérifie qu'aucun caractère interdit n'a survécu ──────────
  const forbidden = /[^a-zàâäæçèéêëîïôöùûüÿœñ'’ -]/;
  for (const [name, list] of [
    ["english", enRefined],
    ["french", frRefined],
    ["latin", latinCapped],
  ] as const) {
    const bad = list.filter((s) => forbidden.test(s));
    if (bad.length > 0) {
      log(`⚠ ${name}: ${bad.length} entries with forbidden chars (e.g. "${bad[0]}")`);
    } else {
      log(`✓ ${name}: charset clean`);
    }
  }
}

main().catch((err) => {
  log(`FATAL: ${err.stack || err}`);
  process.exit(1);
});
