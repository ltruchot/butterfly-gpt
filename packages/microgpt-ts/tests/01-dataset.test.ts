import { expect, test } from "vite-plus/test";
import { cleanLines, getAllDocs, loadRawDataset, SEED, randomShuffle } from "../src/01-dataset.ts";

test("loadRawDataset: lit un texte non vide depuis le disque", () => {
  const raw = loadRawDataset();
  expect(typeof raw).toBe("string");
  expect(raw.length).toBeGreaterThan(1000);
});

test("cleanLines: trim, dédupe-pas, écarte les lignes vides", () => {
  const raw = "  abc\n\n  def  \n\n\n";
  expect(cleanLines(raw)).toEqual(["abc", "def"]);
});

test("randomShuffle: déterministe, même graine → même résultat", () => {
  const input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const a = randomShuffle(input, 42);
  const b = randomShuffle(input, 42);
  expect(a).toEqual(b);
});

test("randomShuffle: graine différente → résultat différent", () => {
  const input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  expect(randomShuffle(input, 1)).not.toEqual(randomShuffle(input, 2));
});

test("randomShuffle: ne mute pas l'entrée", () => {
  const input = [1, 2, 3];
  const inputCopy = [...input];
  randomShuffle(input, SEED);
  expect(input).toEqual(inputCopy);
});

test("randomShuffle: même longueur, même multiset", () => {
  const input = [1, 2, 3, 4, 5];
  const out = randomShuffle(input, 7);
  expect(out.length).toBe(input.length);
  const cmp = (a: number, b: number) => a - b;
  expect([...out].sort(cmp)).toEqual([...input].sort(cmp));
});

test("getAllDocs: contient les noms du fichier, non vides", () => {
  const allDocs = getAllDocs();
  expect(allDocs.length).toBeGreaterThan(1000);
  for (const doc of allDocs) {
    expect(doc.length).toBeGreaterThan(0);
  }
});

test("getAllDocs: le mélange seedé est reproductible et conserve le multiset", () => {
  // Même graine → même ordre (passerelle du random.seed(42)+shuffle de Python)
  const allDocs = getAllDocs();
  const a = randomShuffle(allDocs, SEED);
  const b = randomShuffle(allDocs, SEED);
  expect(a).toEqual(b);
  expect([...a].sort()).toEqual([...allDocs].sort());
});
