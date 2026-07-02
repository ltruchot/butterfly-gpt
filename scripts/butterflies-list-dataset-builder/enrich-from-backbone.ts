#!/usr/bin/env node
// Enrichit data/butterflies/{latin,english,french}.txt avec les données du
// GBIF Backbone Taxonomy local (.cache/backbone.zip).
// - Streame Taxon.tsv pour récupérer TOUTES les taxonID Lepidoptera + leurs
//   canonicalName.
// - Streame VernacularName.tsv pour récupérer les noms vernaculaires (en/fr)
//   associés à ces taxonID.
// - Fusionne avec les listes existantes et ré-écrit les fichiers.
//
// Usage: node scripts/enrich-from-backbone.ts

import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline";
import { spawn } from "node:child_process";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const OUT_DIR = resolve(ROOT, "data/butterflies");
const ZIP = resolve(ROOT, ".cache/backbone.zip");

function log(msg: string): void {
  process.stderr.write(`[${new Date().toISOString().slice(11, 19)}] ${msg}\n`);
}

function unzipStream(member: string): NodeJS.ReadableStream {
  const child = spawn("unzip", ["-p", ZIP, member], { stdio: ["ignore", "pipe", "inherit"] });
  return child.stdout;
}

function clean(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

async function readExistingList(filename: string): Promise<Set<string>> {
  const path = resolve(OUT_DIR, filename);
  if (!existsSync(path)) return new Set();
  const text = await readFile(path, "utf8");
  const out = new Set<string>();
  for (const line of text.split("\n")) {
    const c = clean(line);
    if (c) out.add(c);
  }
  return out;
}

async function writeList(filename: string, items: Set<string>): Promise<void> {
  const cleaned = new Set<string>();
  for (const item of items) {
    const c = clean(item);
    if (c.length > 0 && c.length < 200) cleaned.add(c);
  }
  const sorted = [...cleaned].sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" }));
  const path = resolve(OUT_DIR, filename);
  await writeFile(path, sorted.join("\n") + "\n", "utf8");
  log(`✓ ${filename}  (${sorted.length} lignes)`);
}

async function streamLepidopteraTaxonIDs(): Promise<{
  ids: Set<string>;
  latinNames: Set<string>;
}> {
  log("[Taxon] stream Taxon.tsv …");
  const ids = new Set<string>();
  const latinNames = new Set<string>();
  const stream = unzipStream("Taxon.tsv");
  const rl = createInterface({ input: stream, crlfDelay: Infinity });

  let header: string[] | null = null;
  let colTaxonID = -1;
  let colCanonical = -1;
  let colOrder = -1;
  let colStatus = -1;
  let n = 0;

  for await (const line of rl) {
    n++;
    if (n % 500_000 === 0) log(`[Taxon] processed ${n} lines | lepi_ids=${ids.size}`);
    const cols = line.split("\t");
    if (!header) {
      header = cols;
      colTaxonID = header.indexOf("taxonID");
      colCanonical = header.indexOf("canonicalName");
      colOrder = header.indexOf("order");
      colStatus = header.indexOf("taxonomicStatus");
      continue;
    }
    if (cols[colOrder] !== "Lepidoptera") continue;
    const status = cols[colStatus];
    if (status && status !== "accepted" && status !== "ACCEPTED") continue;
    const tid = cols[colTaxonID];
    if (tid) ids.add(tid);
    const cn = cols[colCanonical];
    if (cn) latinNames.add(cn);
  }
  log(`[Taxon] done: ${n} lines, lepi_ids=${ids.size}, latin_names=${latinNames.size}`);
  return { ids, latinNames };
}

async function streamVernacularNames(
  lepiIds: Set<string>,
): Promise<{ en: Set<string>; fr: Set<string> }> {
  log("[Vernacular] stream VernacularName.tsv …");
  const en = new Set<string>();
  const fr = new Set<string>();
  const stream = unzipStream("VernacularName.tsv");
  const rl = createInterface({ input: stream, crlfDelay: Infinity });

  let header: string[] | null = null;
  let colTaxonID = -1;
  let colName = -1;
  let colLang = -1;
  let n = 0;

  for await (const line of rl) {
    n++;
    if (n % 500_000 === 0) log(`[Vernacular] processed ${n} lines | en=${en.size} fr=${fr.size}`);
    const cols = line.split("\t");
    if (!header) {
      header = cols;
      colTaxonID = header.indexOf("taxonID");
      colName = header.indexOf("vernacularName");
      colLang = header.indexOf("language");
      continue;
    }
    const tid = cols[colTaxonID];
    if (!lepiIds.has(tid)) continue;
    const name = cols[colName];
    if (!name) continue;
    const lang = (cols[colLang] || "").toLowerCase();
    // Accept 2-letter ISO and 3-letter variants
    if (lang === "en" || lang === "eng") en.add(name);
    else if (lang === "fr" || lang === "fra" || lang === "fre") fr.add(name);
  }
  log(`[Vernacular] done: ${n} lines | en=${en.size} fr=${fr.size}`);
  return { en, fr };
}

async function main(): Promise<void> {
  if (!existsSync(ZIP)) {
    throw new Error(
      `Missing ${ZIP}. Download with: curl -L -o ${ZIP} https://hosted-datasets.gbif.org/datasets/backbone/current/backbone.zip`,
    );
  }

  const existingLatin = await readExistingList("latin.txt");
  const existingEn = await readExistingList("english.txt");
  const existingFr = await readExistingList("french.txt");
  log(`existing: latin=${existingLatin.size} en=${existingEn.size} fr=${existingFr.size}`);

  const { ids, latinNames } = await streamLepidopteraTaxonIDs();
  // Merge latin
  for (const n of latinNames) existingLatin.add(n);

  const { en, fr } = await streamVernacularNames(ids);
  // Merge vernaculars (skip if equal to a binomial latin name)
  for (const n of en) if (!existingLatin.has(n)) existingEn.add(n);
  for (const n of fr) if (!existingLatin.has(n)) existingFr.add(n);

  await writeList("latin.txt", existingLatin);
  await writeList("english.txt", existingEn);
  await writeList("french.txt", existingFr);
}

main().catch((err) => {
  log(`FATAL: ${err.stack || err}`);
  process.exit(1);
});
