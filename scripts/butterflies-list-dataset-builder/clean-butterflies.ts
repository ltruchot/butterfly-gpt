#!/usr/bin/env node
// Nettoie data/butterflies/*.txt :
//  - dédup case-insensitive en gardant la version la plus "propre"
//  - retire des fichiers EN/FR toute entrée qui correspond (case-insensitive)
//    à un nom scientifique présent dans latin.txt
//  - retire les entrées au format binôme latin (deux mots Capitalisés)
//
// Usage: node scripts/clean-butterflies.ts

import { readFile, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const OUT_DIR = resolve(ROOT, "data/butterflies");

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

// Score une entrée pour choisir la "meilleure" parmi plusieurs casses :
// pénalise les UPPERCASE et all-lowercase, favorise Title Case.
function score(s: string): number {
  if (s.length === 0) return -1000;
  const hasUpper = /[A-Z]/.test(s);
  const hasLower = /[a-z]/.test(s);
  const startsUpper = /^[A-Z]/.test(s);
  let sc = 0;
  if (startsUpper) sc += 2;
  if (hasUpper && hasLower) sc += 1;
  // pénalise weird quotes
  if (s.includes("'") || s.includes("'") || s.includes("`")) sc -= 1;
  return sc;
}

// Dédup case-insensitive : pour chaque clé lowercase, garde la meilleure forme.
function caseDedup(lines: string[]): string[] {
  const best = new Map<string, string>();
  for (const s of lines) {
    const k = s.toLowerCase();
    const cur = best.get(k);
    if (!cur || score(s) > score(cur)) best.set(k, s);
  }
  return [...best.values()];
}

// Détecte un format de binôme latin : "Genus species" ou "Genus species subsp".
// Caractères latins seulement, premier mot capitalisé.
function looksLikeBinomial(s: string): boolean {
  return /^[A-Z][a-zïëäöüç]+(?: [a-zïëäöüç]+){1,2}$/.test(s);
}

async function main(): Promise<void> {
  const latin = await readLines("latin.txt");
  const en = await readLines("english.txt");
  const fr = await readLines("french.txt");
  log(`before: latin=${latin.length} en=${en.length} fr=${fr.length}`);

  // 1) Dédup case-insensitive pour latin (mais garde versions capitalisées qui
  //    distinguent en latin "Genus species")
  const latinClean = caseDedup(latin);
  const latinLower = new Set(latinClean.map((s) => s.toLowerCase()));

  // 2) Nettoie EN
  let enClean = caseDedup(en);
  const enBefore = enClean.length;
  enClean = enClean.filter((s) => {
    if (latinLower.has(s.toLowerCase())) return false;
    if (looksLikeBinomial(s)) return false;
    return true;
  });
  log(`en: ${enBefore} -> ${enClean.length} (after latin-cross-dedup + binomial filter)`);

  // 3) Nettoie FR
  let frClean = caseDedup(fr);
  const frBefore = frClean.length;
  frClean = frClean.filter((s) => {
    if (latinLower.has(s.toLowerCase())) return false;
    if (looksLikeBinomial(s)) return false;
    return true;
  });
  log(`fr: ${frBefore} -> ${frClean.length} (after latin-cross-dedup + binomial filter)`);

  // 4) Tri alpha
  const collator = new Intl.Collator("fr", { sensitivity: "base" });
  latinClean.sort((a, b) => collator.compare(a, b));
  enClean.sort((a, b) => collator.compare(a, b));
  frClean.sort((a, b) => collator.compare(a, b));

  await writeFile(resolve(OUT_DIR, "latin.txt"), latinClean.join("\n") + "\n", "utf8");
  await writeFile(resolve(OUT_DIR, "english.txt"), enClean.join("\n") + "\n", "utf8");
  await writeFile(resolve(OUT_DIR, "french.txt"), frClean.join("\n") + "\n", "utf8");

  log(`after: latin=${latinClean.length} en=${enClean.length} fr=${frClean.length}`);
}

main().catch((err) => {
  log(`FATAL: ${err.stack || err}`);
  process.exit(1);
});
