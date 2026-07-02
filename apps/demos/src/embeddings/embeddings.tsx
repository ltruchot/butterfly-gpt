import type { FC } from "hono/jsx";
import { VectorRow } from "../views/VectorRow.tsx";
import type { Phase, SessionSnapshot } from "./session.ts";

// ════════════════════════════════════════════════════════════════════════
// <Embeddings> — démo /embeddings (section 05)
// ════════════════════════════════════════════════════════════════════════
// Montre, sur le mot « azur », comment un id de token devient un VECTEUR :
// on va chercher (lookup) la ligne du token dans tokenEmb, la ligne de la
// position dans positionEmb, puis on les ADDITIONNE terme à terme → x.

// Rang de progression d'une phase (pour l'affichage progressif des tables).
const rank = (p: Phase): number =>
  p === "initial" ? 0 : p === "tokenRow" ? 1 : p === "posRow" ? 2 : 3;

const nextLabel = (p: Phase): string => {
  if (p === "initial") return "Commencer (lettre « a »)";
  if (p === "tokenRow") return "2 · Lookup positionEmb[position]";
  if (p === "posRow") return "3 · Additionner → x";
  return "Lettre suivante →";
};

const phaseDescription = (s: SessionSnapshot): string => {
  const letter = s.letters[s.pos] ?? "";
  const id = s.tokens[s.pos] ?? 0;
  if (s.phase === "initial")
    return "Prêt — on va transformer chaque lettre de « azur » en un vecteur de 6 nombres.";
  if (s.phase === "tokenRow")
    return `Lettre « ${letter} » (token id ${id}) → on lit SA ligne dans tokenEmb : tokenEmb[${id}].`;
  if (s.phase === "posRow")
    return `Position ${s.pos} dans le mot → on lit SA ligne dans positionEmb : positionEmb[${s.pos}].`;
  return `x = tokenEmb[${id}] + positionEmb[${s.pos}] (addition terme à terme). Ce vecteur x entre dans le modèle.`;
};

export const App: FC<{ state: SessionSnapshot }> = ({ state }) => {
  const r = rank(state.phase);
  const done = state.phase === "summed" && state.pos === state.tokens.length - 1;
  const id = state.tokens[state.pos] ?? 0;

  return (
    <main id="app" data-init="@get('/embeddings/subscribe')" data-preserve-attr="data-init">
      <header>
        <h1>5 · Embeddings</h1>
        <p class="graph-block-subtitle">
          Un entier seul ne veut rien dire pour le modèle. À chaque token on associe un{" "}
          <strong>vecteur</strong> de <code>nEmbd</code> nombres appris (sa « carte d'identité »),
          et on y ajoute un vecteur de <strong>position</strong> pour encoder l'ordre des lettres.
          Voir <code>05-embeddings.ts</code>.
        </p>
      </header>

      <aside class="legend" data-testid="legend" aria-label="Légende embeddings">
        <div class="legend-intro">
          <h3>Trois gestes, répétés pour chaque lettre</h3>
          <ul class="legend-pipeline">
            <li>
              <strong>lookup tokenEmb</strong> — l'id du token sélectionne UNE ligne de la grande
              table <code>tokenEmb</code> (1 ligne par token). On ne calcule rien, on consulte.
            </li>
            <li>
              <strong>lookup positionEmb</strong> — la place de la lettre (0, 1, 2, …) sélectionne
              une ligne de <code>positionEmb</code>. C'est ce qui distingue « azur » de « zura ».
            </li>
            <li>
              <strong>addition</strong> — <code>x = tokenEmb[token] + positionEmb[pos]</code>, terme
              à terme. Le vecteur <code>x</code> porte à la fois « quelle lettre » et « à quelle
              place ».
            </li>
          </ul>
        </div>
        <div class="legend-intro">
          <h3>Pourquoi un vecteur et pas un seul nombre ?</h3>
          <p class="legend-paragraph">
            Avec un seul nombre, le modèle croirait que la lettre <code>b</code> (id 2) vaut « deux
            fois » la lettre <code>a</code> (id 1) — absurde. Les <code>nEmbd</code> nombres sont
            des axes libres que l'entraînement remplit comme il veut. Ici <code>nEmbd = 6</code>{" "}
            pour l'affichage ; le vrai modèle en utilise 16.
          </p>
        </div>
      </aside>

      <section class="graph-block" data-testid="embeddings-block">
        <header class="graph-block-header">
          <h2>
            Le mot <code>{state.word}</code> → <code>[{state.tokens.join(", ")}]</code>
          </h2>
          <p class="graph-block-step" data-testid="phase">
            {phaseDescription(state)}
          </p>
        </header>

        {r >= 1 && (
          <div class="emb-tables">
            <div class="param-matrix-wrapper">
              <div class="param-matrix-label">tokenEmb (ligne du token courant surlignée)</div>
              <table class="param-matrix emb-matrix" data-testid="token-table">
                <tbody>
                  {state.tokens.map((tok, i) => (
                    <VectorRow
                      label={`'${state.letters[i]}' = tokenEmb[${tok}]`}
                      values={state.tokenRows[i]!}
                      highlight={i === state.pos}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {r >= 2 && (
              <div class="param-matrix-wrapper">
                <div class="param-matrix-label">positionEmb (ligne de la position courante)</div>
                <table class="param-matrix emb-matrix" data-testid="pos-table">
                  <tbody>
                    {state.tokens.map((_tok, i) => (
                      <VectorRow
                        label={`positionEmb[${i}]`}
                        values={state.posRows[i]!}
                        highlight={i === state.pos}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {r >= 3 && (
          <div class="emb-sum" data-testid="sum">
            <div class="param-matrix-label">
              x = tokenEmb[{id}] + positionEmb[{state.pos}]
            </div>
            <table class="param-matrix emb-matrix">
              <tbody>
                <VectorRow label="x" values={state.sums[state.pos]!} highlight />
              </tbody>
            </table>
          </div>
        )}

        <footer class="graph-block-controls">
          <button
            type="button"
            data-testid="next"
            data-on:click="@post('/embeddings/next')"
            disabled={done}
          >
            {nextLabel(state.phase)}
          </button>
          <button type="button" data-testid="reset" data-on:click="@post('/embeddings/reset')">
            ↻ Reset
          </button>
        </footer>
      </section>
    </main>
  );
};
