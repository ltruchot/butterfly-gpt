import type { FC } from "hono/jsx";
import { fmt } from "../views/fmt.ts";
import type { Phase, SessionSnapshot } from "./session.ts";

// ════════════════════════════════════════════════════════════════════════
// <Loss> — démo /loss (section 10)
// ════════════════════════════════════════════════════════════════════════
// La cross-entropy : softmax(scores) → proba de la BONNE lettre → -log(proba).
// Un seul nombre qui dit « à quel point tu t'es trompé » ; la descente de
// gradient ne cherche qu'à le faire baisser.

const pct = (n: number): string => `${(n * 100).toFixed(0)}%`;

const rank = (p: Phase): number =>
  p === "initial" ? 0 : p === "probs" ? 1 : p === "target" ? 2 : 3;

const nextLabel = (p: Phase): string => {
  if (p === "initial") return "1 · Softmax (scores → probabilités)";
  if (p === "probs") return "2 · Isoler la proba de la bonne lettre";
  if (p === "target") return "3 · Coût = -log(proba)";
  return "Terminé";
};

const phaseDescription = (s: SessionSnapshot): string => {
  const target = s.candidates[s.targetIndex] ?? "?";
  if (s.phase === "initial")
    return `Le modèle a lu « ${s.context} » et propose des scores bruts (les « logits » chez Karpathy) pour la lettre suivante.`;
  if (s.phase === "probs")
    return "softmax transforme les scores en probabilités (positives, somme = 1).";
  if (s.phase === "target")
    return `La vraie lettre suivante est « ${target} ». On regarde la proba que le modèle lui a donnée.`;
  return `loss = -log(proba de « ${target} ») = ${fmt(s.loss)}. Plus la bonne lettre est probable, plus la loss est petite.`;
};

// Barème -log : montre la « punition » selon la confiance dans la bonne réponse.
const SCALE: readonly number[] = [0.99, 0.9, 0.7, 0.5, 0.3, 0.1, 0.01];

export const App: FC<{ state: SessionSnapshot }> = ({ state }) => {
  const r = rank(state.phase);
  const done = state.phase === "loss";

  return (
    <main id="app" data-init="@get('/loss/subscribe')" data-preserve-attr="data-init">
      <header>
        <h1>10 · Loss (cross-entropy)</h1>
        <p class="graph-block-subtitle">
          Pour entraîner le modèle, il faut UN nombre qui dise « tu es loin / proche » de la bonne
          réponse. C'est la <strong>cross-entropy</strong> :{" "}
          <code>-log(proba de la bonne lettre)</code>. Voir <code>10-loss.ts</code>.
        </p>
      </header>

      <aside class="legend" data-testid="legend" aria-label="Légende loss">
        <div class="legend-intro">
          <h3>
            Pourquoi <code>-log(proba)</code> ?
          </h3>
          <ul class="legend-pipeline">
            <li>bonne réponse quasi certaine (proba ≈ 1) → -log(1) = 0 : coût quasi nul.</li>
            <li>hésitation (proba ≈ 0,5) → -log(0,5) ≈ 0,69 : coût moyen.</li>
            <li>
              erreur commise avec aplomb (proba ≈ 0) → -log(0) → +∞ : punition énorme. Le log châtie
              très fort les fautes confiantes.
            </li>
          </ul>
          <p class="legend-paragraph">
            Repère : au début (modèle au hasard), la proba de la bonne lettre vaut ≈ 1/vocabSize,
            donc la loss part de ≈ ln(vocabSize) ≈ 3,7 et DESCEND avec l'entraînement.
          </p>
        </div>
      </aside>

      <section class="graph-block" data-testid="loss-block">
        <header class="graph-block-header">
          <h2>
            Après « <code>{state.context}</code> », quelle lettre ?
          </h2>
          <p class="graph-block-step" data-testid="phase">
            {phaseDescription(state)}
          </p>
        </header>

        <table class="param-matrix emb-matrix" data-testid="candidates">
          <tbody>
            <tr>
              <th class="emb-row-label">lettre candidate</th>
              {state.candidates.map((ch, i) => (
                <td class={`param-cell ${r >= 2 && i === state.targetIndex ? "is-highlight" : ""}`}>
                  <span class="data">
                    {ch}
                    {r >= 2 && i === state.targetIndex ? " ✓" : ""}
                  </span>
                </td>
              ))}
            </tr>
            <tr>
              <th class="emb-row-label">score brut</th>
              {state.scores.map((v) => (
                <td class="param-cell">
                  <span class="data">{fmt(v)}</span>
                </td>
              ))}
            </tr>
            {r >= 1 && (
              <tr>
                <th class="emb-row-label">proba (softmax)</th>
                {state.probs.map((v, i) => (
                  <td
                    class={`param-cell ${r >= 2 && i === state.targetIndex ? "is-highlight" : ""}`}
                  >
                    <span class="data">{pct(v)}</span>
                  </td>
                ))}
              </tr>
            )}
          </tbody>
        </table>

        {r >= 3 && (
          <div class="rms-scalebox" data-testid="loss-value">
            <span>
              proba(« {state.candidates[state.targetIndex]} ») ={" "}
              <strong>{pct(state.probs[state.targetIndex] ?? 0)}</strong>
            </span>
            <span>
              loss = -log(proba) = <strong>{fmt(state.loss)}</strong>
            </span>
          </div>
        )}

        {r >= 3 && (
          <div data-testid="loss-scale">
            <div class="param-matrix-label">Barème : si la bonne lettre avait la proba…</div>
            <table class="param-matrix emb-matrix">
              <tbody>
                <tr>
                  <th class="emb-row-label">proba</th>
                  {SCALE.map((p) => (
                    <td class="param-cell">
                      <span class="data">{pct(p)}</span>
                    </td>
                  ))}
                </tr>
                <tr>
                  <th class="emb-row-label">loss = -ln(proba)</th>
                  {SCALE.map((p) => (
                    <td class="param-cell">
                      <span class="data">{fmt(-Math.log(p))}</span>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}

        <footer class="graph-block-controls">
          <button
            type="button"
            data-testid="next"
            data-on:click="@post('/loss/next')"
            disabled={done}
          >
            {nextLabel(state.phase)}
          </button>
          <button type="button" data-testid="reset" data-on:click="@post('/loss/reset')">
            ↻ Reset
          </button>
        </footer>
      </section>
    </main>
  );
};
