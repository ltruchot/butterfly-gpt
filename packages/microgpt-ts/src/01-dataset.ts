// ======================================================================
// 01 - Dataset : le carburant
// ======================================================================
// ~5 904 noms de papillons (data/butterflies/french.refined.txt)
// charger, découper, mélanger
// mélange à graine fixe : reproductible, et sans lui les premiers pas
// d'entraînement ne verraient que des noms en « a »

// import namespace voulu : module aussi chargé côté navigateur, où le stub
// Vite de node:fs lève à l'accès du binding, ici l'accès n'a lieu qu'à l'appel
import * as nodeFs from "node:fs";

/** graine du mélange, 42 : « Let there be order among chaos » (microgpt.py:12) */
export const SEED = 42;

// URL ancrée sur ce module, pas sur process.cwd() (cwd varie selon le lanceur)
const PATH = new URL("../../../data/butterflies/french.refined.txt", import.meta.url);

/** le fichier source en une chaîne brute, les démos montrent « brut » puis « nettoyé » */
export const loadRawDataset = (): string => nodeFs.readFileSync(PATH, "utf8");

/**
 * cleanLines : découpe en lignes, trim, jette les vides
 * (microgpt.py:19 : [line.strip() for line in open(path) if line.strip()])
 */
export const cleanLines = (raw: string): readonly string[] =>
  raw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

// randomSeed : tirage reproductible, même graine donne même suite de nombres dans [0,1[
// JS n'a pas de random.seed → mulberry32, quelques lignes, zéro dépendance
const randomSeed = (seed: number): (() => number) => {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/**
 * randomShuffle : Fisher-Yates seedé, sur une copie
 * toutes les permutations équiprobables (le random.shuffle de microgpt.py)
 */
export const randomShuffle = <T>(arr: readonly T[], seed: number): T[] => {
  const rng = randomSeed(seed);
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

/**
 * getAllDocs : tout le corpus nettoyé, ordre du fichier
 * une fonction, pas une const : zéro lecture disque à l'import (navigateur oblige)
 */
export const getAllDocs = (): readonly string[] => cleanLines(loadRawDataset());
