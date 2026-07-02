import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";

import { App as Autograd } from "./autograd/autograd.tsx";
import { commands as autogradCommands } from "./autograd/commands.ts";
import { queries as autogradQueries } from "./autograd/queries.ts";
import { getSnapshot as getAutogradSnapshot } from "./autograd/session.ts";

import { commands as deriveeCommands } from "./derivee/commands.ts";
import { App as Derivee } from "./derivee/derivee.tsx";
import { queries as deriveeQueries } from "./derivee/queries.ts";
import { getSnapshot as getDeriveeSnapshot } from "./derivee/session.ts";

import { commands as produitScalaireCommands } from "./produit-scalaire/commands.ts";
import { App as ProduitScalaire } from "./produit-scalaire/produit-scalaire.tsx";
import { queries as produitScalaireQueries } from "./produit-scalaire/queries.ts";
import { getSnapshot as getProduitScalaireSnapshot } from "./produit-scalaire/session.ts";

import { commands as logarithmeCommands } from "./logarithme/commands.ts";
import { App as Logarithme } from "./logarithme/logarithme.tsx";
import { queries as logarithmeQueries } from "./logarithme/queries.ts";
import { getSnapshot as getLogarithmeSnapshot } from "./logarithme/session.ts";

import { commands as datasetCommands } from "./dataset/commands.ts";
import { App as Dataset } from "./dataset/dataset.tsx";
import { queries as datasetQueries } from "./dataset/queries.ts";
import { getSnapshot as getDatasetSnapshot } from "./dataset/session.ts";

import { commands as embeddingsCommands } from "./embeddings/commands.ts";
import { App as Embeddings } from "./embeddings/embeddings.tsx";
import { queries as embeddingsQueries } from "./embeddings/queries.ts";
import { getSnapshot as getEmbeddingsSnapshot } from "./embeddings/session.ts";

import { commands as rmsnormCommands } from "./rmsnorm/commands.ts";
import { queries as rmsnormQueries } from "./rmsnorm/queries.ts";
import { App as Rmsnorm } from "./rmsnorm/rmsnorm.tsx";
import { getSnapshot as getRmsnormSnapshot } from "./rmsnorm/session.ts";

import { commands as attentionCommands } from "./attention/commands.ts";
import { App as Attention } from "./attention/attention.tsx";
import { queries as attentionQueries } from "./attention/queries.ts";
import { getSnapshot as getAttentionSnapshot } from "./attention/session.ts";

import { commands as forwardCommands } from "./forward/commands.ts";
import { App as Forward } from "./forward/forward.tsx";
import { queries as forwardQueries } from "./forward/queries.ts";
import { getSnapshot as getForwardSnapshot } from "./forward/session.ts";

import { commands as lossCommands } from "./loss/commands.ts";
import { App as Loss } from "./loss/loss.tsx";
import { queries as lossQueries } from "./loss/queries.ts";
import { getSnapshot as getLossSnapshot } from "./loss/session.ts";

import { commands as inferenceCommands } from "./inference/commands.ts";
import { App as Inference } from "./inference/inference.tsx";
import { queries as inferenceQueries } from "./inference/queries.ts";
import { getSnapshot as getInferenceSnapshot } from "./inference/session.ts";

import { commands as trainCommands } from "./train/commands.ts";
import { queries as trainQueries } from "./train/queries.ts";
import { getSnapshot as getTrainSnapshot } from "./train/session.ts";
import { App as Train } from "./train/train.tsx";

import { commands as mlpCommands } from "./mlp/commands.ts";
import { App as Mlp } from "./mlp/mlp.tsx";
import { queries as mlpQueries } from "./mlp/queries.ts";
import { getSnapshot as getMlpSnapshot } from "./mlp/session.ts";

import { commands as parametersCommands } from "./parameters/commands.ts";
import { App as Parameters } from "./parameters/parameters.tsx";
import { queries as parametersQueries } from "./parameters/queries.ts";
import { getSnapshot as getParametersSnapshot } from "./parameters/session.ts";

import { commands as tokenizerCommands } from "./tokenizer/commands.ts";
import { queries as tokenizerQueries } from "./tokenizer/queries.ts";
import { getSnapshot as getTokenizerSnapshot } from "./tokenizer/session.ts";
import { App as Tokenizer } from "./tokenizer/tokenizer.tsx";

import { BaseLayout } from "./views/layout.tsx";

const app = new Hono();

// Assets statiques (chemins absolus à la racine pour rester partageables
// entre toutes les démos sous `apps/demos`).
app.use("/datastar.js", serveStatic({ path: "./public/datastar.js" }));
app.use("/favicon.svg", serveStatic({ path: "./public/favicon.svg" }));

// Racine → première étape (les utilisateurs arrivent toujours sur Dataset).
app.get("/", (c) => c.redirect("/dataset", 302));

// 1 · Dataset
app.get("/dataset", (c) =>
  c.html(
    <BaseLayout title="Dataset" currentStep="dataset">
      <Dataset state={getDatasetSnapshot()} />
    </BaseLayout>,
  ),
);
app.route("/dataset", datasetCommands);
app.route("/dataset", datasetQueries);

// 2 · Tokenizer
app.get("/tokenizer", (c) =>
  c.html(
    <BaseLayout title="Tokenizer" currentStep="tokenizer">
      <Tokenizer state={getTokenizerSnapshot()} />
    </BaseLayout>,
  ),
);
app.route("/tokenizer", tokenizerCommands);
app.route("/tokenizer", tokenizerQueries);

// ∂ · Interlude math — La dérivée (le skieur dans le brouillard),
// le prérequis d'Autograd juste en dessous.
app.get("/derivee", (c) =>
  c.html(
    <BaseLayout title="La dérivée" currentStep="derivee">
      <Derivee state={getDeriveeSnapshot()} />
    </BaseLayout>,
  ),
);
app.route("/derivee", deriveeCommands);
app.route("/derivee", deriveeQueries);

// 3 · Autograd (existante, conservée)
app.get("/autograd", (c) =>
  c.html(
    <BaseLayout title="Autograd" currentStep="autograd">
      <Autograd state={getAutogradSnapshot()} />
    </BaseLayout>,
  ),
);
app.route("/autograd", autogradCommands);
app.route("/autograd", autogradQueries);

// 4 · Parameters
app.get("/parameters", (c) =>
  c.html(
    <BaseLayout title="Parameters" currentStep="parameters">
      <Parameters state={getParametersSnapshot()} />
    </BaseLayout>,
  ),
);
app.route("/parameters", parametersCommands);
app.route("/parameters", parametersQueries);

// 5 · Embeddings
app.get("/embeddings", (c) =>
  c.html(
    <BaseLayout title="Embeddings" currentStep="embeddings">
      <Embeddings state={getEmbeddingsSnapshot()} />
    </BaseLayout>,
  ),
);
app.route("/embeddings", embeddingsCommands);
app.route("/embeddings", embeddingsQueries);

// 6 · RMSNorm
app.get("/rmsnorm", (c) =>
  c.html(
    <BaseLayout title="RMSNorm" currentStep="rmsnorm">
      <Rmsnorm state={getRmsnormSnapshot()} />
    </BaseLayout>,
  ),
);
app.route("/rmsnorm", rmsnormCommands);
app.route("/rmsnorm", rmsnormQueries);

// a·b · Interlude math — Le produit scalaire, le geste de base de
// l'Attention juste en dessous (mesurer l'accord entre deux vecteurs).
app.get("/produit-scalaire", (c) =>
  c.html(
    <BaseLayout title="Le produit scalaire" currentStep="produit-scalaire">
      <ProduitScalaire state={getProduitScalaireSnapshot()} />
    </BaseLayout>,
  ),
);
app.route("/produit-scalaire", produitScalaireCommands);
app.route("/produit-scalaire", produitScalaireQueries);

// 7 · Attention
app.get("/attention", (c) =>
  c.html(
    <BaseLayout title="Attention" currentStep="attention">
      <Attention state={getAttentionSnapshot()} />
    </BaseLayout>,
  ),
);
app.route("/attention", attentionCommands);
app.route("/attention", attentionQueries);

// 8 · MLP
app.get("/mlp", (c) =>
  c.html(
    <BaseLayout title="MLP" currentStep="mlp">
      <Mlp state={getMlpSnapshot()} />
    </BaseLayout>,
  ),
);
app.route("/mlp", mlpCommands);
app.route("/mlp", mlpQueries);

// 9 · Forward (assemblage « Architecture »)
app.get("/forward", (c) =>
  c.html(
    <BaseLayout title="Forward" currentStep="forward">
      <Forward state={getForwardSnapshot()} />
    </BaseLayout>,
  ),
);
app.route("/forward", forwardCommands);
app.route("/forward", forwardQueries);

// ln · Interlude math — Le logarithme, la brique du −ln(p) de la Loss
// juste en dessous.
app.get("/logarithme", (c) =>
  c.html(
    <BaseLayout title="Le logarithme (ln)" currentStep="logarithme">
      <Logarithme state={getLogarithmeSnapshot()} />
    </BaseLayout>,
  ),
);
app.route("/logarithme", logarithmeCommands);
app.route("/logarithme", logarithmeQueries);

// 10 · Loss
app.get("/loss", (c) =>
  c.html(
    <BaseLayout title="Loss" currentStep="loss">
      <Loss state={getLossSnapshot()} />
    </BaseLayout>,
  ),
);
app.route("/loss", lossCommands);
app.route("/loss", lossQueries);

// 12 · Training loop
app.get("/train", (c) =>
  c.html(
    <BaseLayout title="Training loop" currentStep="train">
      <Train state={getTrainSnapshot()} />
    </BaseLayout>,
  ),
);
app.route("/train", trainCommands);
app.route("/train", trainQueries);

// 13 · Inference
app.get("/inference", (c) =>
  c.html(
    <BaseLayout title="Inference" currentStep="inference">
      <Inference state={getInferenceSnapshot()} />
    </BaseLayout>,
  ),
);
app.route("/inference", inferenceCommands);
app.route("/inference", inferenceQueries);

export default app;
