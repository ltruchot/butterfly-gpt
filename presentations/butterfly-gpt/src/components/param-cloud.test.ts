import { expect, test } from "vite-plus/test";
import { collect, famOf } from "./param-cloud.logic.ts";

test("famOf : classe chaque matrice dans la bonne famille", () => {
  expect(famOf("attn_wq")).toBe("attn");
  expect(famOf("mlp_fc1")).toBe("mlp");
  expect(famOf("outputProj")).toBe("out");
  expect(famOf("tokenEmb")).toBe("emb"); // tout le reste = embeddings
});

test("collect : un VRAI modèle Karpathy a bien 4192 paramètres", () => {
  const { total } = collect(1);
  expect(total).toBe(4192);
});

test("collect : déterministe par graine (même graine → mêmes valeurs)", () => {
  expect(collect(7).byFam.emb).toEqual(collect(7).byFam.emb);
});
