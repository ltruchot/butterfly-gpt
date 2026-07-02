#!/usr/bin/env node
// Collecte des noms de papillons (Lepidoptera) depuis GBIF + Wikidata.
// Génère data/butterflies/{latin,english,french}.txt
//
// Stratégie :
//   - GBIF (latin) : liste les ~130 familles Lepidoptera puis parcourt chaque
//     famille en parallèle (8 workers). Évite le deep-offset lent (>20k).
//   - Wikidata (en/fr) : SPARQL chunké par famille (~150 familles).
//
// Usage: node scripts/fetch-butterflies.ts

import { writeFile, mkdir, appendFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const OUT_DIR = resolve(ROOT, "data/butterflies");
const LOG_FILE = resolve(ROOT, "data/butterflies/.fetch.log");

const GBIF_LEPIDOPTERA_KEY = 797;
const WIKIDATA_LEPIDOPTERA_QID = "Q28319";
const WIKIDATA_RANK_FAMILY_QID = "Q35409";
const USER_AGENT =
  "butterfly-data-collection/1.0 (https://www.linkedin.com/in/lo%C3%AFc-truchot-93924497/)";
const GBIF_PARALLELISM = 8;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

let logQueue: Promise<void> = Promise.resolve();
function log(msg: string): void {
  const line = `[${new Date().toISOString().slice(11, 19)}] ${msg}`;
  process.stderr.write(line + "\n");
  logQueue = logQueue.then(() => appendFile(LOG_FILE, line + "\n")).catch(() => {});
}

async function fetchJson<T>(url: string, retries = 6): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      });
      if (res.status === 429 || res.status === 502 || res.status === 503) {
        const wait = (i + 1) * 3000;
        log(`  [retry] HTTP ${res.status}, wait ${wait}ms`);
        await sleep(wait);
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
      return (await res.json()) as T;
    } catch (e) {
      lastErr = e;
      const wait = (i + 1) * 2000;
      log(`  [retry] ${(e as Error).message}, wait ${wait}ms`);
      await sleep(wait);
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("fetchJson failed");
}

// ──────────────────────────────────────────────────────────────────────
// GBIF
// ──────────────────────────────────────────────────────────────────────

interface GbifTaxon {
  key: number;
  canonicalName?: string;
  rank: string;
  taxonomicStatus?: string;
}
interface GbifSearch {
  endOfRecords: boolean;
  results: GbifTaxon[];
}

async function listLepidopteraFamilies(): Promise<GbifTaxon[]> {
  const families: GbifTaxon[] = [];
  let offset = 0;
  while (true) {
    const url =
      `https://api.gbif.org/v1/species/search` +
      `?highertaxonKey=${GBIF_LEPIDOPTERA_KEY}` +
      `&status=ACCEPTED&rank=FAMILY&limit=1000&offset=${offset}`;
    const data = await fetchJson<GbifSearch>(url);
    if (!data.results?.length) break;
    families.push(...data.results);
    if (data.endOfRecords) break;
    offset += 1000;
  }
  return families;
}

async function walkFamily(family: GbifTaxon, latin: Set<string>): Promise<number> {
  let added = 0;
  for (const rank of ["SPECIES", "GENUS"] as const) {
    let offset = 0;
    while (true) {
      const url =
        `https://api.gbif.org/v1/species/search` +
        `?highertaxonKey=${family.key}` +
        `&status=ACCEPTED&rank=${rank}&limit=1000&offset=${offset}`;
      let data: GbifSearch;
      try {
        data = await fetchJson<GbifSearch>(url);
      } catch (e) {
        log(
          `  [walk] ${family.canonicalName} ${rank} offset=${offset} FAILED: ${(e as Error).message}`,
        );
        break;
      }
      if (!data.results?.length) break;
      for (const r of data.results) {
        if (r.canonicalName) {
          const sizeBefore = latin.size;
          latin.add(r.canonicalName);
          if (latin.size > sizeBefore) added++;
        }
      }
      if (data.endOfRecords) break;
      offset += 1000;
      // safeguard: even huge families like Erebidae (~22k) and Geometridae
      // (~24k) stay in the fast-pagination zone below ~30k
      if (offset > 40000) {
        log(`  [walk] ${family.canonicalName} ${rank} hit safety cap at offset=${offset}`);
        break;
      }
    }
  }
  return added;
}

async function gbifCollect(): Promise<Set<string>> {
  const latin = new Set<string>();
  log(`[GBIF] listing Lepidoptera families…`);
  const families = await listLepidopteraFamilies();
  for (const f of families) if (f.canonicalName) latin.add(f.canonicalName);
  log(`[GBIF] ${families.length} families found (latin=${latin.size})`);

  let processed = 0;
  let cursor = 0;
  const startedAt = Date.now();
  async function worker(wid: number): Promise<void> {
    while (cursor < families.length) {
      const idx = cursor++;
      const fam = families[idx];
      const added = await walkFamily(fam, latin);
      processed++;
      const elapsed = ((Date.now() - startedAt) / 1000).toFixed(0);
      const eta =
        processed > 0
          ? Math.round(
              (((Date.now() - startedAt) / processed) * (families.length - processed)) / 1000,
            )
          : 0;
      log(
        `[w${wid}] ${processed}/${families.length} ${fam.canonicalName ?? fam.key} +${added} | latin=${latin.size} | t=${elapsed}s eta=${eta}s`,
      );
    }
  }
  await Promise.all(Array.from({ length: GBIF_PARALLELISM }, (_, i) => worker(i)));
  return latin;
}

// ──────────────────────────────────────────────────────────────────────
// Wikidata SPARQL
// ──────────────────────────────────────────────────────────────────────

interface SparqlBinding {
  [k: string]: { value: string; type: string; "xml:lang"?: string };
}
interface SparqlJson {
  results: { bindings: SparqlBinding[] };
}

async function sparql(query: string, retries = 4): Promise<SparqlBinding[]> {
  let lastErr: unknown;
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch("https://query.wikidata.org/sparql", {
        method: "POST",
        headers: {
          "User-Agent": USER_AGENT,
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/sparql-results+json",
        },
        body: "query=" + encodeURIComponent(query),
      });
      if (res.status === 429 || res.status === 503) {
        const wait = (i + 1) * 5000;
        log(`  [sparql retry] HTTP ${res.status}, wait ${wait}ms`);
        await sleep(wait);
        continue;
      }
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`SPARQL ${res.status}: ${txt.slice(0, 200)}`);
      }
      const data = (await res.json()) as SparqlJson;
      return data.results.bindings;
    } catch (e) {
      lastErr = e;
      const wait = (i + 1) * 3000;
      log(`  [sparql retry] ${(e as Error).message}, wait ${wait}ms`);
      await sleep(wait);
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("sparql failed");
}

function qidFromUri(uri: string): string {
  return uri.split("/").pop() ?? uri;
}

async function wikidataCollect(latin: Set<string>): Promise<{ en: Set<string>; fr: Set<string> }> {
  const en = new Set<string>();
  const fr = new Set<string>();

  log(`[Wikidata] listing Lepidoptera families…`);
  const famBindings = await sparql(`
    SELECT DISTINCT ?family WHERE {
      ?family wdt:P171* wd:${WIKIDATA_LEPIDOPTERA_QID} .
      ?family wdt:P105 wd:${WIKIDATA_RANK_FAMILY_QID} .
    }
  `);
  const families = famBindings.map((b) => qidFromUri(b.family.value));
  log(`[Wikidata] ${families.length} families`);

  for (let i = 0; i < families.length; i++) {
    const fam = families[i];
    const query = `
      SELECT DISTINCT ?taxon ?taxonName ?nameEN ?nameFR WHERE {
        ?taxon wdt:P171* wd:${fam} .
        ?taxon wdt:P225 ?taxonName .
        OPTIONAL { ?taxon rdfs:label ?nameEN . FILTER(LANG(?nameEN) = "en") }
        OPTIONAL { ?taxon rdfs:label ?nameFR . FILTER(LANG(?nameFR) = "fr") }
      }
    `;
    try {
      const bindings = await sparql(query);
      let aE = 0;
      let aF = 0;
      for (const b of bindings) {
        const sci = b.taxonName?.value;
        if (!sci) continue;
        latin.add(sci);
        const ne = b.nameEN?.value;
        const nf = b.nameFR?.value;
        if (ne && ne !== sci && !/^Q\d+$/.test(ne) && !ne.startsWith("http")) {
          en.add(ne);
          aE++;
        }
        if (nf && nf !== sci && !/^Q\d+$/.test(nf) && !nf.startsWith("http")) {
          fr.add(nf);
          aF++;
        }
      }
      log(
        `[Wikidata] ${i + 1}/${families.length} ${fam} taxa=${bindings.length} +en=${aE} +fr=${aF} | en=${en.size} fr=${fr.size}`,
      );
    } catch (e) {
      log(`[Wikidata] ${i + 1}/${families.length} ${fam} FAILED: ${(e as Error).message}`);
    }
    await sleep(250);
  }
  return { en, fr };
}

// ──────────────────────────────────────────────────────────────────────
// Sortie
// ──────────────────────────────────────────────────────────────────────

function clean(s: string): string {
  return s.replace(/\s+/g, " ").trim();
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
  log(`✓ ${path}  (${sorted.length} lignes)`);
}

// ──────────────────────────────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(LOG_FILE, ""); // truncate log
  const started = Date.now();

  log(`=== fetch-butterflies start ===`);

  // 1) GBIF par famille (parallèle)
  const latin = await gbifCollect();
  await writeList("latin.txt", latin);
  log(`[stage1] GBIF latin=${latin.size}`);

  // 2) Wikidata vernaculars (enrichit aussi latin)
  const { en, fr } = await wikidataCollect(latin);
  await writeList("english.txt", en);
  await writeList("french.txt", fr);
  await writeList("latin.txt", latin); // ré-écrit avec les binômes Wikidata

  const dur = ((Date.now() - started) / 1000).toFixed(1);
  log(`=== done in ${dur}s ===`);
  await logQueue;
}

main().catch(async (err) => {
  log(`FATAL: ${err.stack || err}`);
  await logQueue;
  process.exit(1);
});
