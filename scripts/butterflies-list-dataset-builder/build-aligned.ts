#!/usr/bin/env node
// Construit l'index pairs.tsv (latin ⇄ EN, latin ⇄ FR) à partir du backbone
// GBIF, et écrit data/butterflies/latin.aligned.raw.txt (= taxons Lepidoptera
// avec au moins un nom vernaculaire anglais). C'est la base du cap à ~10k.
//
// Usage: node scripts/build-aligned.ts

import { writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createInterface } from "node:readline";
import { spawn } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const OUT_DIR = resolve(ROOT, "data/butterflies");
const ZIP = resolve(ROOT, ".cache/backbone.zip");

function log(msg: string): void {
  process.stderr.write(`[${new Date().toISOString().slice(11, 19)}] ${msg}\n`);
}

function unzipStream(member: string): NodeJS.ReadableStream {
  const c = spawn("unzip", ["-p", ZIP, member], {
    stdio: ["ignore", "pipe", "inherit"],
  });
  return c.stdout;
}

async function buildTaxonMap(): Promise<Map<string, string>> {
  log("[Taxon] streaming Taxon.tsv (Lepidoptera + ACCEPTED)…");
  const map = new Map<string, string>();
  const rl = createInterface({
    input: unzipStream("Taxon.tsv"),
    crlfDelay: Infinity,
  });
  let header: string[] | null = null;
  let cTaxonID = -1;
  let cCanon = -1;
  let cOrder = -1;
  let cStatus = -1;
  let n = 0;
  for await (const line of rl) {
    n++;
    const cols = line.split("\t");
    if (!header) {
      header = cols;
      cTaxonID = header.indexOf("taxonID");
      cCanon = header.indexOf("canonicalName");
      cOrder = header.indexOf("order");
      cStatus = header.indexOf("taxonomicStatus");
      continue;
    }
    if (cols[cOrder] !== "Lepidoptera") continue;
    const status = cols[cStatus];
    if (status && status !== "accepted") continue;
    const tid = cols[cTaxonID];
    const cn = cols[cCanon];
    if (tid && cn) map.set(tid, cn);
    if (n % 1_000_000 === 0) log(`[Taxon] ${n} lines processed | lepi_accepted=${map.size}`);
  }
  log(`[Taxon] done: ${map.size} Lepidoptera accepted taxa`);
  return map;
}

async function buildPairs(taxonMap: Map<string, string>): Promise<{
  enPairs: Map<string, Set<string>>;
  frPairs: Map<string, Set<string>>;
}> {
  log("[Vernacular] streaming VernacularName.tsv…");
  const enPairs = new Map<string, Set<string>>();
  const frPairs = new Map<string, Set<string>>();
  const rl = createInterface({
    input: unzipStream("VernacularName.tsv"),
    crlfDelay: Infinity,
  });
  let header: string[] | null = null;
  let cTaxonID = -1;
  let cName = -1;
  let cLang = -1;
  let n = 0;
  for await (const line of rl) {
    n++;
    const cols = line.split("\t");
    if (!header) {
      header = cols;
      cTaxonID = header.indexOf("taxonID");
      cName = header.indexOf("vernacularName");
      cLang = header.indexOf("language");
      continue;
    }
    const tid = cols[cTaxonID];
    const canon = taxonMap.get(tid);
    if (!canon) continue;
    const name = cols[cName]?.trim();
    if (!name) continue;
    const lang = (cols[cLang] || "").toLowerCase();
    if (lang === "en" || lang === "eng") {
      let set = enPairs.get(canon);
      if (!set) {
        set = new Set();
        enPairs.set(canon, set);
      }
      set.add(name);
    } else if (lang === "fr" || lang === "fra" || lang === "fre") {
      let set = frPairs.get(canon);
      if (!set) {
        set = new Set();
        frPairs.set(canon, set);
      }
      set.add(name);
    }
    if (n % 200_000 === 0)
      log(`[Vernacular] ${n} lines processed | en_taxa=${enPairs.size} fr_taxa=${frPairs.size}`);
  }
  log(`[Vernacular] done: en_taxa=${enPairs.size} fr_taxa=${frPairs.size}`);
  return { enPairs, frPairs };
}

async function main(): Promise<void> {
  if (!existsSync(ZIP)) {
    throw new Error(
      `Missing ${ZIP}. Run: curl -L -o ${ZIP} https://hosted-datasets.gbif.org/datasets/backbone/current/backbone.zip`,
    );
  }

  const taxonMap = await buildTaxonMap();
  const { enPairs, frPairs } = await buildPairs(taxonMap);

  // pairs.tsv: latin TAB en1|en2|... TAB fr1|fr2|...
  const allLatins = new Set([...enPairs.keys(), ...frPairs.keys()]);
  const sortedLatins = [...allLatins].sort();
  const pairsLines = ["latin\tenglish\tfrench"];
  for (const lat of sortedLatins) {
    const en = enPairs.get(lat);
    const fr = frPairs.get(lat);
    pairsLines.push(`${lat}\t${en ? [...en].join("|") : ""}\t${fr ? [...fr].join("|") : ""}`);
  }
  await writeFile(resolve(OUT_DIR, "pairs.tsv"), pairsLines.join("\n") + "\n", "utf8");
  log(`✓ pairs.tsv: ${sortedLatins.length} latin taxa with vernacular`);

  // latin.aligned.raw.txt = taxa with ≥1 EN vernacular (potential candidates
  // for the 10k well-known subset)
  const latinAligned = [...enPairs.keys()].sort();
  await writeFile(
    resolve(OUT_DIR, "latin.aligned.raw.txt"),
    latinAligned.join("\n") + "\n",
    "utf8",
  );
  log(`✓ latin.aligned.raw.txt: ${latinAligned.length} taxa with EN vernacular`);
}

main().catch((err) => {
  log(`FATAL: ${err.stack || err}`);
  process.exit(1);
});
