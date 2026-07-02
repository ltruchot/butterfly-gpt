#!/usr/bin/env node
// Enrichit data/butterflies/french.raw.txt depuis l'API iNaturalist.
// L'endpoint /v1/taxa?taxon_id=47157 (Lepidoptera) avec locale=fr retourne
// le champ preferred_common_name en français quand il existe. ~76 % des
// taxons renvoient un nom FR — beaucoup plus riche que Wikidata/Wikipedia.
//
// iNaturalist paginate par 200, limite ~10 pages publiques. Mais l'endpoint
// accepte un paramètre `id_above` pour parcourir l'arbre des IDs sans limite.
//
// Usage: node scripts/enrich-french-inat.ts

import { readFile, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const OUT_DIR = resolve(ROOT, "data/butterflies");
const USER_AGENT =
  "butterfly-data-collection/1.0 (https://www.linkedin.com/in/lo%C3%AFc-truchot-93924497/)";
const LEPIDOPTERA_ID = 47157;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
function log(msg: string): void {
  process.stderr.write(`[${new Date().toISOString().slice(11, 19)}] ${msg}\n`);
}

interface InatTaxon {
  id: number;
  name: string;
  rank: string;
  preferred_common_name?: string;
  english_common_name?: string;
}

interface InatResponse {
  total_results: number;
  page: number;
  per_page: number;
  results: InatTaxon[];
}

function isLatinBinomial(s: string): boolean {
  return /^[A-Z][a-z]+\s[a-z]+(?:\s[a-z]+)?$/.test(s);
}

async function fetchPage(idAbove: number, retries = 5): Promise<InatTaxon[]> {
  const url = new URL("https://api.inaturalist.org/v1/taxa");
  url.searchParams.set("taxon_id", String(LEPIDOPTERA_ID));
  url.searchParams.set("rank", "species");
  url.searchParams.set("per_page", "200");
  url.searchParams.set("locale", "fr");
  url.searchParams.set("order", "asc");
  url.searchParams.set("order_by", "id");
  if (idAbove > 0) url.searchParams.set("id_above", String(idAbove));

  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url.toString(), {
        headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      });
      if (res.status === 429 || res.status === 503) {
        await sleep((i + 1) * 5000);
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as InatResponse;
      return data.results;
    } catch (e) {
      log(`  [inat retry] ${(e as Error).message}`);
      await sleep((i + 1) * 2000);
    }
  }
  throw new Error("fetchPage retries exhausted");
}

async function main(): Promise<void> {
  const frRaw = new Set(
    (await readFile(resolve(OUT_DIR, "french.raw.txt"), "utf8"))
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean),
  );
  log(`existing FR=${frRaw.size}`);

  let idAbove = 0;
  let pages = 0;
  let added = 0;
  let totalTaxa = 0;
  const seenIds = new Set<number>();

  // Sauvegarde incrémentale tous les SAVE_EVERY pages au cas où le process
  // serait interrompu.
  const SAVE_EVERY = 50;
  async function persist(): Promise<void> {
    const sorted = [...frRaw].sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" }));
    await writeFile(resolve(OUT_DIR, "french.raw.txt"), sorted.join("\n") + "\n", "utf8");
  }

  while (true) {
    const results = await fetchPage(idAbove);
    if (results.length === 0) break;
    pages++;
    let pageAdded = 0;
    let maxId = idAbove;
    for (const r of results) {
      if (seenIds.has(r.id)) continue;
      seenIds.add(r.id);
      totalTaxa++;
      if (r.id > maxId) maxId = r.id;
      const fr = r.preferred_common_name?.trim();
      if (!fr) continue;
      if (fr === r.name) continue;
      if (isLatinBinomial(fr)) continue;
      if (!frRaw.has(fr)) {
        frRaw.add(fr);
        added++;
        pageAdded++;
      }
    }
    log(
      `[inat] page=${pages} idAbove=${idAbove}→${maxId} taxa=${results.length} +${pageAdded} | added_total=${added} | fr_total=${frRaw.size}`,
    );
    if (maxId === idAbove) {
      log(`[inat] stuck on idAbove ${idAbove}, stopping`);
      break;
    }
    idAbove = maxId;
    if (pages % SAVE_EVERY === 0) {
      await persist();
      log(`[inat] checkpoint saved at page ${pages}`);
    }
    await sleep(400); // ~2.5 req/s
  }

  log(`[inat] scanned ${totalTaxa} taxa, +${added} FR names | fr_total=${frRaw.size}`);

  const sorted = [...frRaw].sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" }));
  await writeFile(resolve(OUT_DIR, "french.raw.txt"), sorted.join("\n") + "\n", "utf8");
  log(`✓ french.raw.txt: ${sorted.length} lines`);
}

main().catch((err) => {
  log(`FATAL: ${err.stack || err}`);
  process.exit(1);
});
