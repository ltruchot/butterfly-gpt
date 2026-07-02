import { defineConfig } from "vite-plus";

export default defineConfig({
  pack: {
    // Les entrées de build, notamment :
    //   index     → le barrel complet (`microgpt-ts`)
    //   dataset   → SEULEMENT 01-dataset.ts, exposé en `microgpt-ts/dataset`.
    //   tokenizer → SEULEMENT 02-tokenizer.ts, exposé en `microgpt-ts/tokenizer`.
    //   autograd  → SEULEMENT 03-autograd.ts, exposé en `microgpt-ts/autograd`.
    // Pourquoi des sous-exports étroits ? Les slides « exécuteur de code » du deck
    // butterfly-gpt importent du vrai code de prod côté NAVIGATEUR. Passer par le
    // barrel tirerait tout le graphe (dont 01-dataset → `node:fs`) à l'import →
    // crash navigateur. 01-dataset n'a plus d'IO au top-level (cf. `getAllDocs()`),
    // 02-tokenizer est une fabrique PURE (cf. `makeTokenizer(docs)`) et 03-autograd
    // est purement fonctionnel (aucune IO, uniquement `Math`), donc les importer
    // seuls est sûr côté navigateur.
    // `exports: true` régénère le champ `exports` du package.json à partir de
    // ces entrées → génère `.`, `./dataset`, `./tokenizer`, `./autograd`, etc.
    //
    // Les entrées « modèle » (04-parameters → 13-sample) sont ajoutées au fil des
    // slides du deck qui en exécutent le vrai code côté navigateur. Chacune est
    // PURE (aucune IO) : leurs imports transitifs ne touchent jamais 01-dataset,
    // donc les importer seules ne tire pas `node:fs`. (Le seul module à éviter au
    // navigateur reste le barrel `index`, qui ré-exporte 01-dataset.)
    entry: {
      index: "src/index.ts",
      dataset: "src/01-dataset.ts",
      tokenizer: "src/02-tokenizer.ts",
      autograd: "src/03-autograd.ts",
      parameters: "src/04-parameters.ts",
      embeddings: "src/05-embeddings.ts",
      rmsnorm: "src/06-rmsnorm.ts",
      attention: "src/07-attention.ts",
      mlp: "src/08-mlp.ts",
      model: "src/09-model.ts",
      loss: "src/10-loss.ts",
      adam: "src/11-adam.ts",
      train: "src/12-train.ts",
      sample: "src/13-sample.ts",
    },
    // NOTE (workaround WSL) : `dts.tsgo` (génération des types via le binaire
    // natif @typescript/native-preview) échoue ici en `spawn EBUSY` quand il
    // est lancé par `vp pack`, alors que le binaire tourne très bien en direct.
    // On bascule donc sur le générateur de dts standard (basé sur typescript),
    // sans spawn natif. À repasser à `{ tsgo: true }` si l'env le permet.
    dts: true,
    exports: true,
  },
  lint: {
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  fmt: {},
});
