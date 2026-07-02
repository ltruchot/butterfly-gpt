#!/usr/bin/env node
// Enrichit data/butterflies/french.raw.txt depuis deux sources :
//   1) Wikipedia EN → langlinks vers FR. Pour chaque nom EN, demande à
//      l'API Wikipedia EN si l'article a une version FR. Capte ~250 noms.
//   2) Wikidata SPARQL : tous les taxons Lepidoptera qui ont un article
//      FR-Wikipedia (~6 800 candidats — beaucoup plus riche).
//      Le titre de l'article FR est souvent le nom vernaculaire ; on rejette
//      les titres qui sont des binômes latins.
//
// Usage: node scripts/enrich-french.ts

import { readFile, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const OUT_DIR = resolve(ROOT, "data/butterflies");
const USER_AGENT =
  "butterfly-data-collection/1.0 (https://www.linkedin.com/in/lo%C3%AFc-truchot-93924497/)";
const WIKIDATA_LEPIDOPTERA_QID = "Q28319";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
function log(msg: string): void {
  process.stderr.write(`[${new Date().toISOString().slice(11, 19)}] ${msg}\n`);
}

// ──────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────

function isLatinBinomial(s: string): boolean {
  // "Genus species" éventuellement avec sous-espèce — caractères ASCII purs
  return /^[A-Z][a-z]+\s[a-z]+(?:\s[a-z]+)?$/.test(s);
}

function stripDisambig(s: string): string {
  return s.replace(/\s*\([^)]*\)\s*$/, "").trim();
}

// ──────────────────────────────────────────────────────────────────────
// Source 1: Wikipedia EN → langlinks FR
// ──────────────────────────────────────────────────────────────────────

interface WikiResponse {
  query: {
    pages: Record<
      string,
      {
        title: string;
        missing?: string;
        langlinks?: Array<{ lang: string; "*": string }>;
      }
    >;
    normalized?: Array<{ from: string; to: string }>;
    redirects?: Array<{ from: string; to: string }>;
  };
}

async function fetchLanglinksBatch(titles: string[], retries = 4): Promise<Map<string, string>> {
  const url = new URL("https://en.wikipedia.org/w/api.php");
  url.searchParams.set("action", "query");
  url.searchParams.set("format", "json");
  url.searchParams.set("prop", "langlinks");
  url.searchParams.set("lllang", "fr");
  url.searchParams.set("lllimit", "max");
  url.searchParams.set("redirects", "1");
  url.searchParams.set("titles", titles.join("|"));

  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url.toString(), {
        headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      });
      if (res.status === 429 || res.status === 503) {
        await sleep((i + 1) * 4000);
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as WikiResponse;

      const aliasChain = new Map<string, string>();
      for (const r of data.query.normalized ?? []) aliasChain.set(r.from, r.to);
      for (const r of data.query.redirects ?? []) aliasChain.set(r.from, r.to);
      function resolveTitle(t: string): string {
        let cur = t;
        const seen = new Set<string>();
        while (aliasChain.has(cur) && !seen.has(cur)) {
          seen.add(cur);
          cur = aliasChain.get(cur)!;
        }
        return cur;
      }

      const pagesByTitle = new Map<string, { langlinks?: Array<{ lang: string; "*": string }> }>();
      for (const pid of Object.keys(data.query.pages)) {
        pagesByTitle.set(data.query.pages[pid].title, data.query.pages[pid]);
      }
      const out = new Map<string, string>();
      for (const original of titles) {
        const resolved = resolveTitle(original);
        const page = pagesByTitle.get(resolved);
        if (!page || !page.langlinks) continue;
        const fr = page.langlinks.find((l) => l.lang === "fr");
        if (fr) out.set(original, fr["*"]);
      }
      return out;
    } catch (e) {
      log(`  [wp retry] ${(e as Error).message}`);
      await sleep((i + 1) * 2000);
    }
  }
  throw new Error("fetchLanglinksBatch retries exhausted");
}

async function enrichFromEnLanglinks(frRaw: Set<string>): Promise<number> {
  const enRaw = (await readFile(resolve(OUT_DIR, "english.raw.txt"), "utf8"))
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  log(`[wp-langlinks] ${enRaw.length} English names to query`);

  const BATCH = 50;
  let added = 0;
  for (let i = 0; i < enRaw.length; i += BATCH) {
    const batch = enRaw.slice(i, i + BATCH);
    try {
      const langlinks = await fetchLanglinksBatch(batch);
      for (const [, fr] of langlinks) {
        const cleaned = stripDisambig(fr);
        if (!cleaned || isLatinBinomial(cleaned)) continue;
        if (!frRaw.has(cleaned)) {
          frRaw.add(cleaned);
          added++;
        }
      }
      if (i % 1000 === 0 || i + BATCH >= enRaw.length) {
        log(
          `[wp-langlinks] ${i + batch.length}/${enRaw.length} | added=${added} | fr_total=${frRaw.size}`,
        );
      }
    } catch (e) {
      log(`[wp-langlinks] batch ${i} failed: ${(e as Error).message}`);
    }
    await sleep(150);
  }
  return added;
}

// ──────────────────────────────────────────────────────────────────────
// Source 2: Wikidata SPARQL → FR Wikipedia article titles
// ──────────────────────────────────────────────────────────────────────

interface SparqlBinding {
  [k: string]: { value: string };
}
interface SparqlJson {
  results: { bindings: SparqlBinding[] };
}

async function sparql(query: string, retries = 4): Promise<SparqlBinding[]> {
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
        await sleep((i + 1) * 5000);
        continue;
      }
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`SPARQL ${res.status}: ${txt.slice(0, 200)}`);
      }
      const data = (await res.json()) as SparqlJson;
      return data.results.bindings;
    } catch (e) {
      log(`  [sparql retry] ${(e as Error).message}`);
      await sleep((i + 1) * 3000);
    }
  }
  throw new Error("sparql retries exhausted");
}

async function enrichFromFrWikipedia(frRaw: Set<string>): Promise<number> {
  // Get all Lepidoptera families to chunk queries
  log(`[wikidata] listing Lepidoptera families…`);
  const famBindings = await sparql(`
    SELECT DISTINCT ?family WHERE {
      ?family wdt:P171* wd:${WIKIDATA_LEPIDOPTERA_QID} .
      ?family wdt:P105 wd:Q35409 .
    }
  `);
  const families = famBindings.map((b) => b.family.value.split("/").pop() ?? b.family.value);
  log(`[wikidata] ${families.length} families`);

  let added = 0;
  for (let i = 0; i < families.length; i++) {
    const fam = families[i];
    const query = `
      SELECT DISTINCT ?taxon ?taxonName ?article WHERE {
        ?taxon wdt:P171* wd:${fam} .
        ?taxon wdt:P225 ?taxonName .
        ?frWiki schema:about ?taxon ;
                schema:inLanguage "fr" ;
                schema:isPartOf <https://fr.wikipedia.org/> .
        ?frWiki schema:name ?article .
      }
    `;
    try {
      const bindings = await sparql(query);
      let famAdded = 0;
      for (const b of bindings) {
        const sci = b.taxonName?.value;
        const article = b.article?.value;
        if (!article || !sci) continue;
        const cleaned = stripDisambig(article);
        if (!cleaned) continue;
        // Drop if it's just the scientific name as article title
        if (cleaned === sci) continue;
        if (isLatinBinomial(cleaned)) continue;
        if (!frRaw.has(cleaned)) {
          frRaw.add(cleaned);
          famAdded++;
          added++;
        }
      }
      log(
        `[wikidata] ${i + 1}/${families.length} ${fam} bindings=${bindings.length} +${famAdded} | added_total=${added} | fr_total=${frRaw.size}`,
      );
    } catch (e) {
      log(`[wikidata] ${i + 1}/${families.length} ${fam} FAILED: ${(e as Error).message}`);
    }
    await sleep(250);
  }
  return added;
}

// ──────────────────────────────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const frRaw = new Set(
    (await readFile(resolve(OUT_DIR, "french.raw.txt"), "utf8"))
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean),
  );
  log(`existing FR=${frRaw.size}`);

  const addedFromWp = await enrichFromEnLanglinks(frRaw);
  log(`[wp-langlinks] +${addedFromWp} → fr=${frRaw.size}`);

  const addedFromWd = await enrichFromFrWikipedia(frRaw);
  log(`[wikidata-fr-articles] +${addedFromWd} → fr=${frRaw.size}`);

  const sorted = [...frRaw].sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" }));
  await writeFile(resolve(OUT_DIR, "french.raw.txt"), sorted.join("\n") + "\n", "utf8");
  log(`✓ french.raw.txt: ${sorted.length} lines`);
}

main().catch((err) => {
  log(`FATAL: ${err.stack || err}`);
  process.exit(1);
});
