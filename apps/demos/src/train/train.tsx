import { raw } from "hono/html";
import type { FC } from "hono/jsx";
import { fmt } from "../views/fmt.ts";
import type { SessionSnapshot } from "./session.ts";

// ════════════════════════════════════════════════════════════════════════
// <Train> — démo /train (section « Training loop »), courbe de loss EN LIVE
// ════════════════════════════════════════════════════════════════════════
// On lance un vrai entraînement ; à chaque pas, le serveur pousse la nouvelle
// loss par SSE et la courbe se redessine. La loss part de ≈ ln(vocabSize) et
// descend — c'est tout l'apprentissage qui se résume à « faire baisser ce
// nombre ».

const W = 640;
const H = 240;
const PAD_L = 44;
const PAD_R = 16;
const PAD_T = 16;
const PAD_B = 30;

const phaseDescription = (s: SessionSnapshot): string => {
  if (s.phase === "idle")
    return "Prêt — clique sur Entraîner. À chaque pas : forward → loss → backward → pas d'Adam.";
  if (s.phase === "running")
    return `Entraînement en cours… pas ${s.step}/${s.numSteps}. La loss est poussée en direct par SSE.`;
  const first = s.losses[0] ?? 0;
  const last = s.ema[s.ema.length - 1] ?? 0;
  return `Terminé. Loss (lissée) descendue de ≈ ${fmt(first)} vers ≈ ${fmt(last)}.`;
};

// Construit le `points="x,y x,y …"` d'une polyline pour une série de loss.
const buildPoints = (series: readonly number[], numSteps: number, yMax: number): string => {
  const xAt = (i: number) => PAD_L + (i / Math.max(1, numSteps - 1)) * (W - PAD_L - PAD_R);
  const yAt = (v: number) =>
    H - PAD_B - (Math.min(Math.max(v, 0), yMax) / yMax) * (H - PAD_T - PAD_B);
  return series.map((v, i) => `${xAt(i).toFixed(1)},${yAt(v).toFixed(1)}`).join(" ");
};

export const App: FC<{ state: SessionSnapshot }> = ({ state }) => {
  const running = state.phase === "running";
  const yMax = Math.ceil(state.lossRef) + 0.5; // ~4.x
  const yRef = H - PAD_B - (state.lossRef / yMax) * (H - PAD_T - PAD_B);
  const rawPts = buildPoints(state.losses, state.numSteps, yMax);
  const emaPts = buildPoints(state.ema, state.numSteps, yMax);
  const lossNow = state.losses[state.losses.length - 1];
  const emaNow = state.ema[state.ema.length - 1];

  // SVG construit en chaîne (raw) : pas d'interactivité, juste un tracé.
  const svg = `
<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width:${W}px" role="img" aria-label="Courbe de loss">
  <line x1="${PAD_L}" y1="${H - PAD_B}" x2="${W - PAD_R}" y2="${H - PAD_B}" stroke="#ccc" />
  <line x1="${PAD_L}" y1="${PAD_T}" x2="${PAD_L}" y2="${H - PAD_B}" stroke="#ccc" />
  <line x1="${PAD_L}" y1="${yRef.toFixed(1)}" x2="${W - PAD_R}" y2="${yRef.toFixed(1)}"
        stroke="#bbb" stroke-dasharray="4 4" />
  <text x="${W - PAD_R}" y="${(yRef - 4).toFixed(1)}" text-anchor="end" font-size="11" fill="#999">
    départ ≈ ln(vocab) = ${fmt(state.lossRef)}
  </text>
  ${rawPts ? `<polyline points="${rawPts}" fill="none" stroke="#f0c08a" stroke-width="1" />` : ""}
  ${emaPts ? `<polyline points="${emaPts}" fill="none" stroke="#f97316" stroke-width="2" />` : ""}
  <text x="${PAD_L - 6}" y="${(PAD_T + 8).toFixed(1)}" text-anchor="end" font-size="11" fill="#999">${yMax.toFixed(0)}</text>
  <text x="${PAD_L - 6}" y="${(H - PAD_B).toFixed(1)}" text-anchor="end" font-size="11" fill="#999">0</text>
</svg>`;

  return (
    <main id="app" data-init="@get('/train/subscribe')" data-preserve-attr="data-init">
      <header>
        <h1>12 · Training loop</h1>
        <p class="graph-block-subtitle">
          On enchaîne, des milliers de fois : tokeniser un nom → passe avant → loss → passe arrière
          → un pas d'Adam. La loss doit globalement DESCENDRE. Voir <code>12-train.ts</code>.
        </p>
      </header>

      <aside class="legend" data-testid="legend" aria-label="Légende training loop">
        <div class="legend-intro">
          <h3>Un pas d'entraînement</h3>
          <ul class="legend-pipeline">
            <li>
              <strong>forward</strong> — on prédit chaque lettre suivante du nom et on mesure la{" "}
              <code>cross-entropy</code> (cf. loss).
            </li>
            <li>
              <strong>backward</strong> — <code>backward(loss)</code> calcule le gradient de chaque
              paramètre.
            </li>
            <li>
              <strong>Adam</strong> — <code>adamStep</code> bouge chaque paramètre dans le bon sens.
            </li>
          </ul>
          <p class="legend-paragraph">
            La courbe est tracée <strong>en direct</strong> : le serveur pousse la loss après chaque
            pas via le flux SSE. Orange = moyenne lissée ; clair = loss brute (bruitée car un seul
            nom par pas).
          </p>
        </div>
      </aside>

      <section class="graph-block" data-testid="train-block">
        <header class="graph-block-header">
          <h2>Entraînement sur les papillons</h2>
          <p class="graph-block-step" data-testid="phase">
            {phaseDescription(state)}
          </p>
        </header>

        <div class="graph" data-testid="chart">
          {raw(svg)}
        </div>

        <div class="rms-scalebox" data-testid="readout">
          <span data-testid="step-counter">
            pas <strong>{state.step}</strong> / {state.numSteps}
          </span>
          {lossNow !== undefined && (
            <span data-testid="loss-now">
              loss <strong>{fmt(lossNow)}</strong>
            </span>
          )}
          {emaNow !== undefined && (
            <span>
              moyenne lissée <strong>{fmt(emaNow)}</strong>
            </span>
          )}
        </div>

        <footer class="graph-block-controls">
          <button
            type="button"
            data-testid="start"
            data-on:click="@post('/train/start')"
            disabled={running}
          >
            {running ? "Entraînement…" : "Entraîner ▶"}
          </button>
          <button type="button" data-testid="reset" data-on:click="@post('/train/reset')">
            ↻ Reset
          </button>
        </footer>
      </section>
    </main>
  );
};
