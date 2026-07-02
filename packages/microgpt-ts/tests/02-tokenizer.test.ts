import { expect, test } from "vite-plus/test";
import { getAllDocs } from "../src/01-dataset.ts";
import { makeTokenizer } from "../src/02-tokenizer.ts";

// On instancie le tokenizer sur le corpus complet, comme le runner
const { BOS, decode, encode, uchars, vocabSize } = makeTokenizer(getAllDocs());

test("uchars: non vide, sans doublons, et ordonné en strates pédagogiques", () => {
  expect(uchars.length).toBeGreaterThan(0);
  expect(new Set(uchars).size).toBe(uchars.length);

  // Convention pédagogique : 0=espace, 1–26=a–z, puis accents, puis ponctuation
  expect(uchars[0]).toBe(" ");
  expect(uchars[1]).toBe("a");
  // Toutes les lettres a–z présentes dans le corpus doivent former un
  // préfixe contigu à partir de l'id 1, dans l'ordre alphabétique
  const lowers = uchars.filter((c) => /^[a-z]$/.test(c));
  expect(lowers).toEqual([...lowers].sort());
  for (let i = 0; i < lowers.length; i++) {
    expect(uchars[1 + i]).toBe(lowers[i]);
  }
  // tout ce qui vient après les lettres ASCII doit être soit un caractère
  // latin étendu (accent / ligature), soit de la ponctuation : jamais une
  // lettre a–z
  for (let i = 1 + lowers.length; i < uchars.length; i++) {
    expect(/^[a-z]$/.test(uchars[i]!)).toBe(false);
  }
});

test("BOS: id sentinelle = uchars.length", () => {
  expect(BOS).toBe(uchars.length);
});

test("vocabSize: uchars.length + 1 (pour BOS)", () => {
  expect(vocabSize).toBe(uchars.length + 1);
});

test("encode: convertit chaque caractère en son id (position dans uchars)", () => {
  const s = uchars[0]! + uchars[1]! + uchars[2]!;
  expect(encode(s)).toEqual([0, 1, 2]);
});

test("encode/decode: bijection (roundtrip) sur des chaînes du corpus", () => {
  const samples = ["abraxas", uchars.slice(0, 5).join(""), uchars[uchars.length - 1]!];
  for (const s of samples) {
    expect(decode(encode(s))).toBe(s);
  }
});

test("decode: ignore BOS et les ids hors plage", () => {
  const ids = [0, BOS, 1, vocabSize + 100, 2];
  expect(decode(ids)).toBe(uchars[0]! + uchars[1]! + uchars[2]!);
});
