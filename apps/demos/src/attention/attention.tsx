import type { FC } from "hono/jsx";
import { VectorRow } from "../views/VectorRow.tsx";
import type { Phase, SessionSnapshot } from "./session.ts";

// ════════════════════════════════════════════════════════════════════════
// <Attention> — démo /attention
// ════════════════════════════════════════════════════════════════════════
// UNE des briques de la section « Architecture » de microgpt (au même titre
// qu'embeddings, rmsnorm, MLP). En une tête : la requête q du token courant
// mesure son affinité (produit scalaire) avec la clé k de chaque position, on
// met à l'échelle (/√d), softmax (poids), puis somme des valeurs v pondérée.

// Variante locale : 2 décimales (les scores q·k restent lisibles en table
// large), là où le standard des démos (views/fmt.ts) en affiche 3.
const fmt = (n: number): string => n.toFixed(2);
const pct = (n: number): string => `${(n * 100).toFixed(0)}%`;

const rank = (p: Phase): number =>
  p === "initial" ? 0 : p === "scores" ? 1 : p === "weights" ? 2 : 3;

const nextLabel = (p: Phase): string => {
  if (p === "initial") return "1 · Affinités q·k (mises à l'échelle /√d)";
  if (p === "scores") return "2 · Softmax → poids d'attention";
  if (p === "weights") return "3 · Somme des valeurs pondérée";
  return "Terminé";
};

const phaseDescription = (s: SessionSnapshot): string => {
  const top = s.letters[s.dominant] ?? "?";
  if (s.phase === "initial")
    return "Le token courant a une requête q ; chaque lettre passée offre une clé k et une valeur v.";
  if (s.phase === "scores")
    return `Affinité = produit scalaire q·k, divisé par √${s.headDim}. Plus q et k pointent dans le même sens, plus le score est grand.`;
  if (s.phase === "weights")
    return `softmax transforme les scores en poids (somme = 1). Ici « ${top} » récolte le plus d'attention.`;
  return `Sortie = Σ (poids × valeur). On récupère surtout la valeur de « ${top} », la position la plus pertinente.`;
};

export const App: FC<{ state: SessionSnapshot }> = ({ state }) => {
  const r = rank(state.phase);
  const done = state.phase === "output";

  return (
    <main id="app" data-init="@get('/attention/subscribe')" data-preserve-attr="data-init">
      <header>
        <h1>7 · Attention</h1>
        <p class="graph-block-subtitle">
          Le mécanisme qui fait qu'un token « regarde » les autres. Métaphore de la recherche :{" "}
          <strong>requête</strong> (ce que je cherche), <strong>clé</strong> (ce que je propose),{" "}
          <strong>valeur</strong> (ce que je donne si on me choisit). Voir{" "}
          <code>07-attention.ts</code>.
        </p>
      </header>

      <aside class="legend" data-testid="legend" aria-label="Légende attention">
        <div class="legend-intro">
          <h3>Trois temps</h3>
          <ul class="legend-pipeline">
            <li>
              <strong>affinité</strong> — <code>q·k</code> (produit scalaire) mesure la ressemblance
              ; divisé par <code>√d</code> pour ne pas exploser avec la dimension.
            </li>
            <li>
              <strong>poids</strong> — <code>softmax</code> des affinités → des poids positifs qui
              somment à 1 (une vraie répartition d'attention).
            </li>
            <li>
              <strong>sortie</strong> — somme des valeurs <code>v</code> pondérée par les poids : on
              puise surtout chez les positions jugées pertinentes.
            </li>
          </ul>
          <p class="legend-paragraph">
            Causalité : on ne regarde que les positions DÉJÀ vues (jamais le futur). Et le vrai
            modèle fait ça en <code>nHead</code> têtes parallèles, chacune sur une tranche du
            vecteur.
          </p>
        </div>
      </aside>

      <section class="graph-block" data-testid="attention-block">
        <header class="graph-block-header">
          <h2>Le token courant regarde « azur »</h2>
          <p class="graph-block-step" data-testid="phase">
            {phaseDescription(state)}
          </p>
        </header>

        <table class="param-matrix emb-matrix" data-testid="qkv">
          <tbody>
            <VectorRow label="q (requête du token courant)" values={state.q} highlight fmt={fmt} />
            {state.keys.map((k, i) => (
              <VectorRow label={`k['${state.letters[i]}'] (clé)`} values={k} fmt={fmt} />
            ))}
            {state.values.map((v, i) => (
              <VectorRow label={`v['${state.letters[i]}'] (valeur)`} values={v} fmt={fmt} />
            ))}
          </tbody>
        </table>

        {r >= 1 && (
          <table class="param-matrix emb-matrix" data-testid="attn-table">
            <tbody>
              <tr>
                <th class="emb-row-label">position</th>
                {state.letters.map((ch, i) => (
                  <td class={`param-cell ${r >= 2 && i === state.dominant ? "is-highlight" : ""}`}>
                    <span class="data">{ch}</span>
                  </td>
                ))}
              </tr>
              <tr>
                <th class="emb-row-label">score = q·k / √d</th>
                {state.scaledScores.map((s) => (
                  <td class="param-cell">
                    <span class="data">{fmt(s)}</span>
                  </td>
                ))}
              </tr>
              {r >= 2 && (
                <tr>
                  <th class="emb-row-label">poids (softmax)</th>
                  {state.weights.map((w, i) => (
                    <td class={`param-cell ${i === state.dominant ? "is-highlight" : ""}`}>
                      <span class="data">{pct(w)}</span>
                    </td>
                  ))}
                </tr>
              )}
            </tbody>
          </table>
        )}

        {r >= 3 && (
          <table class="param-matrix emb-matrix" data-testid="output">
            <tbody>
              <VectorRow label="sortie = Σ poids · v" values={state.output} highlight fmt={fmt} />
            </tbody>
          </table>
        )}

        <footer class="graph-block-controls">
          <button
            type="button"
            data-testid="next"
            data-on:click="@post('/attention/next')"
            disabled={done}
          >
            {nextLabel(state.phase)}
          </button>
          <button type="button" data-testid="reset" data-on:click="@post('/attention/reset')">
            ↻ Reset
          </button>
        </footer>
      </section>
    </main>
  );
};
