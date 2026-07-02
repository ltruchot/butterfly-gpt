import { raw } from "hono/html";
import type { FC } from "hono/jsx";
import type { Node, Parameter, StateDict } from "microgpt-ts";
import { highlight } from "../views/highlight.ts";
import type { Phase, SessionSnapshot } from "./session.ts";

// ════════════════════════════════════════════════════════════════════════
// <Parameters> — démo /parameters
// ════════════════════════════════════════════════════════════════════════
// Deux blocs : (1) un GROS BLOC DE CONTEXTE qui explique d'où viennent
// les paramètres (du texte au vecteur) et POURQUOI ils sont organisés en
// matrices nommées (state_dict) ; (2) le pipeline 5 phases qui montre
// concrètement Init → Aplatis → Backward → Step.

// Snapshot des 3 tables apprises du modèle. Ce sont des MATRICES DE
// PARAMÈTRES, donc des matrices de Node-feuilles que l'autograd traitera
// comme telles. Initialisées au gaussien, mises à jour à chaque step SGD.
const MODEL_SNAPSHOT = `// Tables vivant en mémoire AVANT toute prédiction.
// Initialisées au hasard, mises à jour par la descente de gradient.
// Chaque case est un Node-feuille — exactement comme à l'étape 3.
//
// NB : les formes ci-dessous (27 tokens, 16 positions) sont la config
// JOUET de Karpathy (prénoms courts) — notre corpus papillons utilise
// 44 tokens et blockSize 64.
//
// Trois tables apprises (noms historiques microgpt entre parenthèses) :
//   • tokenEmb     (wte)      → 1 vecteur par lettre (token).
//   • positionEmb  (wpe)      → 1 vecteur par position dans le mot (séquence).
//   • outputProj   (lm_head)  → matrice de projection finale qui transforme
//                                un vecteur interne en scores de sortie
//                                (un score par lettre candidate).
//
// Microgpt utilise n_bias = 0 : aucun biais ajouté nulle part.

const tokenEmb = {             // 27 lettres × 16 dim = 432 nombres appris
  a:   [-0.42,  0.15,  0.31, ..., -0.18],   // vecteur d'embedding de 'a'
  b:   [ 0.27, -0.34,  0.12, ...,  0.40],
  c:   [ 0.08,  0.49, -0.16, ...,  0.05],
  // ... 23 autres lettres + BOS
};

const positionEmb = [          // 16 positions × 16 dim = 256 nombres appris
  [ 0.05, -0.12,  0.31, ..., -0.08],   // vecteur pour la position 0
  [-0.17,  0.22,  0.40, ..., -0.15],   // vecteur pour la position 1
  // ... 14 autres positions
];

const outputProj = [           // 27 candidats × 16 dim = 432 poids appris
  [-0.05,  0.12, -0.31, ...,  0.08],   // poids vers le candidat 'a'
  [ 0.17, -0.22,  0.40, ..., -0.15],   // poids vers le candidat 'b'
  // ... 25 autres lignes
];`;

const fmt = (n: number): string => (Math.abs(n) >= 1000 ? n.toExponential(2) : n.toFixed(3));

const nextLabel = (p: Phase): string => {
  if (p === "initial") return "1 · Initialise (Gaussien std=0.08)";
  if (p === "initialized") return "2 · Aplatis (state_dict → params[])";
  if (p === "flattened") return "3 · Backward (gradients)";
  if (p === "backward") return "4 · Step (SGD) (data ← data − lr·grad)";
  return "Terminé";
};

const phaseDescription = (s: SessionSnapshot): string => {
  if (s.phase === "initial")
    return "Prêt — clique sur Initialise pour tirer les paramètres au gaussien.";
  if (s.phase === "initialized")
    return `state_dict = { tokenEmb: ${s.tokenEmbShape.nout}×${s.tokenEmbShape.nin}, outputProj: ${s.outputProjShape.nout}×${s.outputProjShape.nin} }. Chaque cellule = un Node-feuille (data, children=[]).`;
  if (s.phase === "flattened")
    return `params = flattenParams(state_dict) : ${s.flat.length} paramètres en une liste plate. C'est cette liste que l'optimiseur indexera.`;
  if (s.phase === "backward")
    return `backward(loss) renvoie un gradient par paramètre (Map<Node, number>). Ici factices mais déterministes.`;
  return `step(state_dict, lr=${s.lr}) → nouveau state_dict (les gradients sont lus sur p.grad). 4 cellules mises en avant pour visualiser le delta.`;
};

const Cell: FC<{
  data: number;
  grad?: number;
  newData?: number;
  highlight?: boolean;
}> = ({ data, grad, newData, highlight: hl }) => (
  <td class={`param-cell ${hl ? "is-highlight" : ""}`}>
    {newData !== undefined ? (
      <>
        <span class="data old">{fmt(data)}</span>
        <span class="arrow">→</span>
        <span class="data new">{fmt(newData)}</span>
      </>
    ) : (
      <span class="data">{fmt(data)}</span>
    )}
    {grad !== undefined ? <span class="grad">∂={fmt(grad)}</span> : null}
  </td>
);

const MatrixView: FC<{
  name: string;
  mat: Parameter[][];
  grads: ReadonlyMap<Node, number>;
  nextMat?: Parameter[][];
  phase: Phase;
  highlightAbsIndices: ReadonlySet<number>;
  startIndex: number;
}> = ({ name, mat, grads, nextMat, phase, highlightAbsIndices, startIndex }) => (
  <div class="param-matrix-wrapper">
    <div class="param-matrix-label">
      {name} — {mat.length}×{mat[0]!.length}
    </div>
    <table class="param-matrix">
      <tbody>
        {mat.map((row, i) => (
          <tr>
            {row.map((p, j) => {
              const flatIdx = startIndex + i * row.length + j;
              const grad = grads.get(p);
              const newData = phase === "stepped" && nextMat ? nextMat[i]![j]!.data : undefined;
              return (
                <Cell
                  data={p.data}
                  grad={grad}
                  newData={newData}
                  highlight={phase === "stepped" && highlightAbsIndices.has(flatIdx)}
                />
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const FlatView: FC<{
  flat: readonly Parameter[];
  grads: ReadonlyMap<Node, number>;
  phase: Phase;
}> = ({ flat, grads, phase }) => (
  <div class="param-flat" data-testid="params-flat">
    <div class="param-matrix-label">params (taille {flat.length})</div>
    <div class="param-flat-row">
      {flat.map((p, i) => (
        <span class="param-flat-cell">
          <span class="param-flat-idx">[{i}]</span>
          <span class="data">{fmt(p.data)}</span>
          {phase === "backward" || phase === "stepped" ? (
            <span class="grad">∂={fmt(grads.get(p) ?? 0)}</span>
          ) : null}
        </span>
      ))}
    </div>
  </div>
);

export const App: FC<{ state: SessionSnapshot }> = ({ state }) => {
  const showMatrices = state.stateDict !== null;
  const showFlat =
    state.phase === "flattened" || state.phase === "backward" || state.phase === "stepped";

  const tokenEmbSize = state.tokenEmbShape.nout * state.tokenEmbShape.nin;
  const hl = new Set(state.highlightIndices);

  return (
    <main id="app" data-init="@get('/parameters/subscribe')" data-preserve-attr="data-init">
      <header>
        <h1>4 · Parameters</h1>
        <p class="graph-block-subtitle">
          La pièce de pont entre l'autograd (étape 3) et le modèle. Un paramètre{" "}
          <strong>EST</strong> un Node-feuille. La nuance : on en garde une référence dans un{" "}
          <code>state_dict</code> nommé pour pouvoir le retrouver après <code>backward</code> et le
          bouger via <code>step</code>. Voir <code>04-parameters.ts</code>.
        </p>
      </header>

      <aside class="legend" data-testid="legend" aria-label="Légende parameters">
        <div class="legend-intro">
          <h3>Du texte aux nombres — où vont les paramètres ?</h3>
          <ul class="legend-pipeline">
            <li>
              Corpus : ~7 000 noms de papillons français (cf. <a href="/dataset">étape 1</a>), dont
              par exemple <em>azur</em>.
            </li>
            <li>Modèle lu lettre (token) par lettre.</li>
            <li>
              Chaque lettre → id entier (cf. <a href="/tokenizer">étape 2</a> :{" "}
              <code>espace→0, a→1, b→2, …, z→26</code>). Donc <code>azur</code> →{" "}
              <code>[1, 26, 21, 18]</code>.
            </li>
            <li>
              Chaque id → vecteur d'embedding <strong>appris</strong>, lu dans la matrice{" "}
              <code>tokenEmb</code>. Par ex. <code>tokenEmb[1]</code> ={" "}
              <code>[-0.42, 0.15, …, 0.7]</code>, 16 nombres pour <em>a</em>.{" "}
              <strong>Chacun de ces 16 nombres est un Node-feuille</strong> du graphe autograd.
            </li>
            <li>
              Chaque position dans le mot (séquence) a aussi son vecteur appris, dans la matrice{" "}
              <code>positionEmb</code>. Au cœur du modèle, on additionne :{" "}
              <code>x = tok_emb + pos_emb</code>.
            </li>
            <li>
              La projection finale <code>outputProj</code> transforme ce vecteur en un score par
              candidat — sans biais (<code>n_bias = 0</code>). Pour UN candidat <code>k</code> et
              UNE dimension : <code>L = w · x</code>. C'est cette brique qu'isole le mini-neurone de
              l'étape 3.
            </li>
          </ul>
        </div>

        <div class="legend-intro">
          <h3>Pourquoi 16 nombres par lettre ?</h3>
          <p class="legend-paragraph">
            Ces 16 nombres <strong>ne sont PAS</strong> « 16 chances de placement par rapport aux
            autres lettres ». Ce sont 16 <strong>axes latents</strong> que l'optimiseur ajuste tout
            seul pour capturer ce qu'il veut sur la lettre (voyelle/consonne, lettre qui suit
            souvent <code>h</code>, lettre fréquente en début de mot, …). Aucun axe n'est étiqueté
            par avance.
          </p>
          <p class="legend-paragraph">
            <code>16</code> est juste un <strong>hyperparamètre</strong> (microgpt :{" "}
            <code>n_embd = 16</code>). Plus c'est grand, plus le modèle peut être nuancé. GPT-4 :
            ~12 000.
          </p>
        </div>

        <div class="legend-intro">
          <h3>L'index 0 ou 13 du vecteur — qui bouge ?</h3>
          <p class="legend-paragraph">
            <strong>Tous bougent à chaque pas.</strong> Le backward calcule, pour CHACUN des 16, son
            gradient (= sa part de responsabilité dans la perte). <code>step()</code> applique
            ensuite <code>nombre -= η · gradient</code> à chacun.
          </p>
          <p class="legend-paragraph">
            La différence : un index avec un gros gradient (ex. <code>+2.3</code>) bouge beaucoup ;
            un index avec un petit gradient (ex. <code>+0.01</code>) bouge à peine. Ceux qui
            contribuaient le plus à l'erreur reçoivent les plus grosses corrections.
          </p>
        </div>

        <p class="legend-snapshot-caption">
          <strong>Structures de données pré-existantes</strong> du modèle (3 jeux de paramètres
          appris, à des rôles distincts) :
        </p>
        <pre class="legend-snapshot" data-testid="legend-model-snapshot">
          <code>{raw(highlight(MODEL_SNAPSHOT))}</code>
        </pre>
      </aside>

      <section class="graph-block" data-testid="parameters-block">
        <header class="graph-block-header">
          <h2>Pipeline — du tirage initial au step SGD</h2>
          <p class="graph-block-step" data-testid="phase">
            {phaseDescription(state)}
          </p>
          <ul class="graph-legend-mini">
            <li>
              <strong>1. Initialise</strong> — <code>matrix(rng, nout, nin, std)</code> remplit
              chaque cellule par un tirage gaussien centré.
            </li>
            <li>
              <strong>2. Aplatis</strong> — <code>flattenParams(stateDict)</code> en une liste plate
              pour l'optimiseur.
            </li>
            <li>
              <strong>3. Backward</strong> — en vrai : <code>backward(loss)</code> (cf. étape 3).
              Ici : grads factices déterministes pour pédagogie.
            </li>
            <li>
              <strong>4. Step</strong> — <code>step(stateDict, lr)</code> renvoie un{" "}
              <em>nouveau</em> state_dict (immuable). 4 cellules surlignées pour visualiser le
              delta.
            </li>
          </ul>
        </header>

        {showMatrices && (
          <div class="param-matrices" data-testid="matrices">
            <MatrixView
              name="tokenEmb"
              mat={(state.stateDict as StateDict).tokenEmb!}
              grads={state.grads}
              nextMat={state.nextStateDict?.tokenEmb}
              phase={state.phase}
              highlightAbsIndices={hl}
              startIndex={0}
            />
            <MatrixView
              name="outputProj"
              mat={(state.stateDict as StateDict).outputProj!}
              grads={state.grads}
              nextMat={state.nextStateDict?.outputProj}
              phase={state.phase}
              highlightAbsIndices={hl}
              startIndex={tokenEmbSize}
            />
          </div>
        )}

        {showFlat && <FlatView flat={state.flat} grads={state.grads} phase={state.phase} />}

        <footer class="graph-block-controls">
          <button
            type="button"
            data-testid="next"
            data-on:click="@post('/parameters/next')"
            disabled={state.phase === "stepped"}
          >
            {nextLabel(state.phase)} →
          </button>
          <button type="button" data-testid="reset" data-on:click="@post('/parameters/reset')">
            ↻ Reset
          </button>
        </footer>
      </section>
    </main>
  );
};
