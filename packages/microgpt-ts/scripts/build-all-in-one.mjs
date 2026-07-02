// Génère `src/microgpt-all-in-one.ts` : une version « tout-en-un » du cœur de
// microgpt-ts (les 13 modules numérotés + le runner), SANS commentaires et SANS
// condenser/changer le code — juste l'inline des modules dans l'ordre
// topologique. Fichier inerte (ni barrel, ni exports, ni tests) TANT QU'ON NE
// L'IMPORTE PAS : il inclut le runner top-level, donc l'importer/exécuter
// déclenche un entraînement. Il sert seulement à
// COMPTER LES LIGNES et à avoir une vue d'ensemble. Régénérer : `node
// packages/microgpt-ts/scripts/build-all-in-one.mjs` puis `vp check --fix`.

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const srcDir = join(dirname(fileURLToPath(import.meta.url)), "..", "src");

// Ordre topologique (aucun fichier ne dépend d'un fichier listé après lui).
const order = [
  "03-autograd",
  "04-parameters",
  "01-dataset",
  "02-tokenizer",
  "05-embeddings",
  "06-rmsnorm",
  "07-attention",
  "08-mlp",
  "09-model",
  "10-loss",
  "11-adam",
  "12-train",
  "13-sample",
  "microgpt",
];

// Bannière ASCII « BUTTERFLY GPT » (fonte blocs maison, 5 lignes).
const FONT = {
  B: ["██████ ", "██  ██ ", "█████  ", "██  ██ ", "██████ "],
  U: ["██  ██ ", "██  ██ ", "██  ██ ", "██  ██ ", " ████  "],
  T: ["██████ ", "  ██   ", "  ██   ", "  ██   ", "  ██   "],
  E: ["██████ ", "██     ", "█████  ", "██     ", "██████ "],
  R: ["█████  ", "██  ██ ", "█████  ", "██  ██ ", "██  ██ "],
  F: ["██████ ", "██     ", "█████  ", "██     ", "██     "],
  L: ["██     ", "██     ", "██     ", "██     ", "██████ "],
  Y: ["██  ██ ", " ████  ", "  ██   ", "  ██   ", "  ██   "],
  G: [" ████  ", "██     ", "██ ███ ", "██  ██ ", " ████  "],
  P: ["█████  ", "██  ██ ", "█████  ", "██     ", "██     "],
  " ": ["     ", "     ", "     ", "     ", "     "],
};

function banner(word) {
  const lines = [];
  for (let r = 0; r < 5; r++) {
    let line = "";
    for (const c of word) line += FONT[c][r];
    lines.push(("// " + line).replace(/\s+$/, ""));
  }
  return lines.join("\n");
}

// Doublon identique (mulberry32) défini dans 04-parameters ET 01-dataset.
// 04-parameters vient en premier → on retire la copie de 01-dataset.
const RANDOM_SEED_BLOCK =
  /const randomSeed = \(seed: number\): \(\(\) => number\) => \{[\s\S]*?\n\};\n?/;

const nodeImports = new Set();
const parts = [];

for (const name of order) {
  let src = readFileSync(join(srcDir, name + ".ts"), "utf8");

  // 1. Retirer les commentaires blocs /* ... */ (et JSDoc /** ... */).
  src = src.replace(/\/\*[\s\S]*?\*\//g, "");
  // 2. Retirer les commentaires de ligne // ... (vérifié : aucun // dans une
  //    chaîne/regex de ce code, donc sans risque).
  src = src.replace(/[ \t]*\/\/.*$/gm, "");
  // 3. Collecter puis retirer les imports Node (réémis en tête, dédupliqués).
  src = src.replace(/^import .* from "node:[^"]*";?[ \t]*$/gm, (m) => {
    nodeImports.add(m.trim());
    return "";
  });
  // 4. Retirer les imports relatifs internes (tout est dans le même fichier).
  src = src.replace(/^import .* from "\.\/[^"]*";?[ \t]*$/gm, "");
  // NB : on GARDE le mot-clé `export` — le retirer transforme les symboles
  // publics non référencés par le runner (ComputationGraph, backwardSteps,
  // step, headDim…) en variables « inutilisées » → erreurs no-unused-vars.
  // Garder `export` est aussi la modification minimale du code d'origine.

  // Dédup randomSeed : uniquement dans 01-dataset.
  if (name === "01-dataset") {
    src = src.replace(RANDOM_SEED_BLOCK, "");
  }

  parts.push(src);
}

let out =
  banner("BUTTERFLY GPT") +
  "\n\n" +
  [...nodeImports].sort((a, b) => a.localeCompare(b)).join("\n") +
  "\n\n" +
  parts.join("\n\n");
// Réduire les rafales de lignes vides laissées par le retrait des commentaires.
out = out
  .replace(/\n{3,}/g, "\n\n")
  .replace(/^\n+/, "")
  .replace(/\n+$/, "\n");

const target = join(srcDir, "microgpt-all-in-one.ts");
writeFileSync(target, out, "utf8");
console.log("écrit:", target);
console.log("lignes:", out.split("\n").length);
