import type { FC } from "hono/jsx";
import { fmt } from "../views/fmt.ts";
import { VectorRow } from "../views/VectorRow.tsx";
import type { Phase, SessionSnapshot } from "./session.ts";

// ════════════════════════════════════════════════════════════════════════
// <Forward> — démo /forward (assemblage de la section « Architecture »)
// ════════════════════════════════════════════════════════════════════════
// Un passage avant complet, étage par étage, en suivant le corps de gpt() :
// embed → (rmsnorm) → attention + résiduel → (rmsnorm) → MLP + résiduel →
// projection finale → scores (un par token candidat).

const rank = (p: Phase): number =>
  p === "initial" ? 0 : p === "embed" ? 1 : p === "attn" ? 2 : p === "mlp" ? 3 : 4;

const nextLabel = (p: Phase): string => {
  if (p === "initial") return "1 · Embedding (+ normalisation)";
  if (p === "embed") return "2 · Attention (+ résiduel)";
  if (p === "attn") return "3 · MLP (+ résiduel)";
  if (p === "mlp") return "4 · Projection finale → scores";
  return "Terminé";
};

const phaseDescription = (s: SessionSnapshot): string => {
  if (s.phase === "initial")
    return `On fait passer le token « ${s.tokenChar} » (position ${s.pos}) à travers tout le modèle.`;
  if (s.phase === "embed")
    return "x = tokenEmb[token] + positionEmb[pos], puis rmsnorm. Le vecteur d'entrée du bloc.";
  if (s.phase === "attn")
    return "Bloc attention, puis x = x + sortie (connexion résiduelle : on AJOUTE, on ne remplace pas).";
  if (s.phase === "mlp")
    return "Bloc MLP (sur x normalisé), puis de nouveau x = x + sortie (résiduel).";
  return `Projection outputProj → ${s.scores.length} scores (un par token). Le plus grand désigne la lettre prédite : « ${s.argmaxChar} ».`;
};

export const App: FC<{ state: SessionSnapshot }> = ({ state }) => {
  const r = rank(state.phase);
  const done = state.phase === "scores";

  return (
    <main id="app" data-init="@get('/forward/subscribe')" data-preserve-attr="data-init">
      <header>
        <h1>9 · Forward (assemblage « Architecture »)</h1>
        <p class="graph-block-subtitle">
          La section « Architecture » de microgpt, mise bout à bout : un token entre, traverse
          embedding → attention → MLP (avec connexions résiduelles), et ressort en{" "}
          <code>scores</code> (un par lettre candidate). Voir <code>09-model.ts</code> (
          <code>gpt</code>).
        </p>
      </header>

      <aside class="legend" data-testid="legend" aria-label="Légende forward">
        <div class="legend-intro">
          <h3>
            L'enchaînement (identique à <code>gpt()</code>)
          </h3>
          <ul class="legend-pipeline">
            <li>
              <strong>embedding</strong> — token + position (cf. embeddings), puis{" "}
              <code>rmsnorm</code>.
            </li>
            <li>
              <strong>attention + résiduel</strong> — le bloc attention, puis{" "}
              <code>x = x + sortie</code>.
            </li>
            <li>
              <strong>MLP + résiduel</strong> — le bloc MLP, puis <code>x = x + sortie</code>.
            </li>
            <li>
              <strong>scores</strong> — <code>outputProj</code> projette x vers{" "}
              <code>vocabSize</code> scores.
            </li>
          </ul>
          <p class="legend-paragraph">
            Les <strong>connexions résiduelles</strong> (le <code>+ x</code>) offrent au gradient
            une « voie express » : c'est ce qui rend les réseaux profonds entraînables.
          </p>
        </div>
      </aside>

      <section class="graph-block" data-testid="forward-block">
        <header class="graph-block-header">
          <h2>
            Token « <code>{state.tokenChar}</code> » → … → scores
          </h2>
          <p class="graph-block-step" data-testid="phase">
            {phaseDescription(state)}
          </p>
        </header>

        <table class="param-matrix emb-matrix" data-testid="stages">
          <tbody>
            {r >= 1 && <VectorRow label="x après embedding (+norm)" values={state.xEmbed} />}
            {r >= 2 && <VectorRow label="x après attention (+résiduel)" values={state.xAttn} />}
            {r >= 3 && <VectorRow label="x après MLP (+résiduel)" values={state.xMlp} highlight />}
          </tbody>
        </table>

        {r >= 4 && (
          <div class="param-flat" data-testid="scores">
            <div class="param-matrix-label">
              scores (taille {state.scores.length}) — lettre prédite :{" "}
              <strong>« {state.argmaxChar} »</strong>
            </div>
            {/* Garde-fou : la session vérifie que ces scores, recalculés étage
                par étage, sont EXACTEMENT ceux du vrai gpt() (09-model). */}
            <div class="param-matrix-label" data-testid="matches-gpt">
              {state.matchesGpt
                ? "✓ identique à gpt() — mêmes scores que le vrai passage avant"
                : "✗ divergent de gpt() — ces scores ne correspondent pas au vrai passage avant"}
            </div>
            <div class="param-flat-row">
              {state.scores.map((l, i) => (
                <span class={`param-flat-cell ${i === state.argmax ? "is-highlight" : ""}`}>
                  <span class="param-flat-idx">[{i}]</span>
                  <span class="data">{fmt(l)}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        <footer class="graph-block-controls">
          <button
            type="button"
            data-testid="next"
            data-on:click="@post('/forward/next')"
            disabled={done}
          >
            {nextLabel(state.phase)}
          </button>
          <button type="button" data-testid="reset" data-on:click="@post('/forward/reset')">
            ↻ Reset
          </button>
        </footer>
      </section>
    </main>
  );
};
