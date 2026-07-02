import type { FC } from "hono/jsx";
import { fmt } from "../views/fmt.ts";
import { VectorRow } from "../views/VectorRow.tsx";
import type { Phase, SessionSnapshot } from "./session.ts";

// ════════════════════════════════════════════════════════════════════════
// <Rmsnorm> — démo /rmsnorm (section 06)
// ════════════════════════════════════════════════════════════════════════
// Montre la recette RMSNorm : carrés → moyenne des carrés → facteur d'échelle
// → multiplication. Le « bouton de volume » qui régule la longueur du vecteur
// sans changer sa direction.

const rank = (p: Phase): number =>
  p === "initial" ? 0 : p === "squares" ? 1 : p === "scale" ? 2 : 3;

const nextLabel = (p: Phase): string => {
  if (p === "initial") return "1 · Élever au carré (xᵢ²)";
  if (p === "squares") return "2 · Moyenne des carrés → facteur d'échelle";
  if (p === "scale") return "3 · Multiplier chaque xᵢ par le facteur";
  return "Terminé";
};

const phaseDescription = (s: SessionSnapshot): string => {
  if (s.phase === "initial")
    return "Prêt — on va remettre ce vecteur à la bonne échelle, sans changer sa direction.";
  if (s.phase === "squares")
    return "On élève chaque composante au carré : un -4 compte autant qu'un +4 (la magnitude, pas le signe).";
  if (s.phase === "scale")
    return `ms = moyenne(xᵢ²) = ${fmt(s.meanSquare)} ; facteur = 1/√(ms + ε) = ${fmt(s.scale)}.`;
  return "On multiplie chaque composante par le MÊME facteur : la longueur est régulée (moyenne des carrés ≈ 1), la direction préservée.";
};

export const App: FC<{ state: SessionSnapshot }> = ({ state }) => {
  const r = rank(state.phase);
  const done = state.phase === "normalized";
  const outMs = state.output.reduce((s, x) => s + x * x, 0) / (state.output.length || 1);

  return (
    <main id="app" data-init="@get('/rmsnorm/subscribe')" data-preserve-attr="data-init">
      <header>
        <h1>6 · RMSNorm</h1>
        <p class="graph-block-subtitle">
          Au fil des couches, les vecteurs peuvent gonfler ou rétrécir et déstabiliser les calculs.
          RMSNorm est un « bouton de volume » automatique : il ramène la longueur du vecteur dans
          une plage saine <strong>sans changer sa direction</strong>. Voir{" "}
          <code>06-rmsnorm.ts</code>.
        </p>
      </header>

      <aside class="legend" data-testid="legend" aria-label="Légende rmsnorm">
        <div class="legend-intro">
          <h3>La recette, en trois gestes</h3>
          <ul class="legend-pipeline">
            <li>
              <strong>carrés</strong> — on mesure la « taille typique » via la moyenne des carrés{" "}
              <code>ms</code> (les carrés font compter +3 et -3 pareil).
            </li>
            <li>
              <strong>facteur d'échelle</strong> — <code>scale = 1/√(ms + ε)</code>. La racine
              annule le carré ; le petit <code>ε</code> évite la division par zéro.
            </li>
            <li>
              <strong>multiplication</strong> — chaque composante × <code>scale</code> (le MÊME pour
              toutes) : homothétie, pas rotation → la direction est conservée.
            </li>
          </ul>
        </div>
      </aside>

      <section class="graph-block" data-testid="rmsnorm-block">
        <header class="graph-block-header">
          <h2>Normaliser un vecteur de {state.input.length} nombres</h2>
          <p class="graph-block-step" data-testid="phase">
            {phaseDescription(state)}
          </p>
        </header>

        <table class="param-matrix emb-matrix" data-testid="vectors">
          <tbody>
            <VectorRow label="x (entrée)" values={state.input} />
            {r >= 1 && <VectorRow label="xᵢ²" values={state.squares} />}
            {r >= 3 && <VectorRow label="x · scale (sortie)" values={state.output} highlight />}
          </tbody>
        </table>

        {r >= 2 && (
          <div class="rms-scalebox" data-testid="scalebox">
            <span>
              ms = <strong>{fmt(state.meanSquare)}</strong>
            </span>
            <span>ε = {state.eps}</span>
            <span>
              facteur = 1/√(ms+ε) = <strong>{fmt(state.scale)}</strong>
            </span>
            {r >= 3 && (
              <span data-testid="out-ms">
                moyenne des carrés de la sortie ≈ <strong>{fmt(outMs)}</strong>
              </span>
            )}
          </div>
        )}

        <footer class="graph-block-controls">
          <button
            type="button"
            data-testid="next"
            data-on:click="@post('/rmsnorm/next')"
            disabled={done}
          >
            {nextLabel(state.phase)}
          </button>
          <button type="button" data-testid="reset" data-on:click="@post('/rmsnorm/reset')">
            ↻ Reset
          </button>
        </footer>
      </section>
    </main>
  );
};
