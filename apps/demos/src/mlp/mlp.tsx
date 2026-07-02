import type { FC } from "hono/jsx";
import { fmt } from "../views/fmt.ts";
import type { Phase, SessionSnapshot } from "./session.ts";

// ════════════════════════════════════════════════════════════════════════
// <Mlp> — démo /mlp (section 08)
// ════════════════════════════════════════════════════════════════════════
// Le « sablier » : fc1 déplie le vecteur (4 → 8), ReLU coupe les négatifs,
// fc2 le replie (8 → 4). C'est ReLU (la non-linéarité) qui donne au réseau
// le pouvoir d'apprendre autre chose que des droites.

const rank = (p: Phase): number =>
  p === "initial" ? 0 : p === "expand" ? 1 : p === "relu" ? 2 : 3;

const nextLabel = (p: Phase): string => {
  if (p === "initial") return "1 · Expansion (fc1 : 4 → 8)";
  if (p === "expand") return "2 · ReLU (couper les négatifs)";
  if (p === "relu") return "3 · Contraction (fc2 : 8 → 4)";
  return "Terminé";
};

const phaseDescription = (s: SessionSnapshot): string => {
  if (s.phase === "initial")
    return "Prêt — on va faire « réfléchir » ce vecteur dans un espace plus grand, puis le replier.";
  if (s.phase === "expand")
    return `fc1 projette les ${s.input.length} nombres vers ${s.hidden} : plus de place pour détecter des motifs variés.`;
  if (s.phase === "relu")
    return "ReLU garde les positifs tels quels et écrase les négatifs à 0. SANS ce coude, deux couches = une seule (que des droites).";
  return `fc2 reprojette les ${s.hidden} nombres vers ${s.input.length} : la sortie se rebranche sur le reste du modèle (et s'ajoute au résiduel).`;
};

const Cell: FC<{ v: number; dead?: boolean; highlight?: boolean }> = ({ v, dead, highlight }) => (
  <td class={`param-cell ${dead ? "is-dead" : ""} ${highlight ? "is-highlight" : ""}`}>
    <span class="data">{fmt(v)}</span>
  </td>
);

const Row: FC<{ label: string; children: unknown }> = ({ label, children }) => (
  <tr>
    <th class="emb-row-label">{label}</th>
    {children as never}
  </tr>
);

export const App: FC<{ state: SessionSnapshot }> = ({ state }) => {
  const r = rank(state.phase);
  const done = state.phase === "contract";
  const deadCount = state.dead.filter(Boolean).length;

  return (
    <main id="app" data-init="@get('/mlp/subscribe')" data-preserve-attr="data-init">
      <header>
        <h1>8 · MLP</h1>
        <p class="graph-block-subtitle">
          Après l'attention (qui fait circuler l'info entre tokens), le MLP fait « digérer » l'info
          à chaque token, pour lui-même. Forme en sablier : on déplie, on coche les motifs utiles
          (ReLU), on replie. Voir <code>08-mlp.ts</code>.
        </p>
      </header>

      <aside class="legend" data-testid="legend" aria-label="Légende mlp">
        <div class="legend-intro">
          <h3>Pourquoi déplier puis replier ?</h3>
          <ul class="legend-pipeline">
            <li>
              <strong>expansion</strong> (<code>fc1</code>) — passer dans un espace plus grand donne
              plus de dimensions pour repérer des combinaisons utiles.
            </li>
            <li>
              <strong>ReLU</strong> — la non-linéarité indispensable : <code>max(0, x)</code>. Sans
              elle, empiler des couches linéaires se réduit à UNE seule (le réseau ne saurait tracer
              que des droites).
            </li>
            <li>
              <strong>contraction</strong> (<code>fc2</code>) — on replie vers la taille d'origine
              pour se rebrancher sur le reste du modèle.
            </li>
          </ul>
        </div>
      </aside>

      <section class="graph-block" data-testid="mlp-block">
        <header class="graph-block-header">
          <h2>
            Le sablier : {state.input.length} → {state.hidden} → {state.input.length}
          </h2>
          <p class="graph-block-step" data-testid="phase">
            {phaseDescription(state)}
          </p>
        </header>

        <table class="param-matrix emb-matrix" data-testid="vectors">
          <tbody>
            <Row label="x (entrée)">
              {state.input.map((v) => (
                <Cell v={v} />
              ))}
            </Row>
            {r >= 1 && (
              <Row label="fc1·x (caché, avant ReLU)">
                {state.preRelu.map((v) => (
                  <Cell v={v} />
                ))}
              </Row>
            )}
            {r >= 2 && (
              <Row label="ReLU (caché, après)">
                {state.postRelu.map((v, i) => (
                  <Cell v={v} dead={state.dead[i]} />
                ))}
              </Row>
            )}
            {r >= 3 && (
              <Row label="fc2 (sortie)">
                {state.output.map((v) => (
                  <Cell v={v} highlight />
                ))}
              </Row>
            )}
          </tbody>
        </table>

        {r >= 2 && (
          <p class="rms-scalebox" data-testid="dead-count">
            ReLU a éteint <strong>{deadCount}</strong> / {state.hidden} neurones cachés (valeur
            négative → 0).
          </p>
        )}

        <footer class="graph-block-controls">
          <button
            type="button"
            data-testid="next"
            data-on:click="@post('/mlp/next')"
            disabled={done}
          >
            {nextLabel(state.phase)}
          </button>
          <button type="button" data-testid="reset" data-on:click="@post('/mlp/reset')">
            ↻ Reset
          </button>
        </footer>
      </section>
    </main>
  );
};
