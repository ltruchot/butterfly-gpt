import { raw } from "hono/html";
import type { FC, PropsWithChildren } from "hono/jsx";
import { IconsSprite } from "./IconsSprite.tsx";

// BaseLayout — coquille HTML partagée entre les démos. Charge le bundle
// Datastar v1.0.1 (servi par `serveStatic`). Chaque GET rend l'App complète
// côté serveur (SSR) — ex. `<App>` = `autograd/autograd.tsx` — puis les
// mises à jour suivantes arrivent en morphs via SSE.
//
// Le sprite d'icônes (`<IconsSprite />`) est inclus une seule fois dans
// le body : les `<use href="#light-icon-..." />` du graphe et de la
// légende viennent y puiser leurs symbols.
//
// Le `Stepper` est rendu en haut de chaque page : nav MPA via <a href>
// natifs, donc chaque clic recharge la page suivante. La prop
// `currentStep` (optionnelle) sert juste à marquer l'item actif.

type StepId =
  | "dataset"
  | "tokenizer"
  | "derivee"
  | "autograd"
  | "parameters"
  | "embeddings"
  | "rmsnorm"
  | "produit-scalaire"
  | "attention"
  | "mlp"
  | "forward"
  | "logarithme"
  | "loss"
  | "train"
  | "inference";

// `num` = numéro de la section du tronc (packages/microgpt-ts/src/0X-*.ts),
// pas l'index du stepper : la section 11 (Adam) n'a pas de démo dédiée,
// d'où le saut 10 → 12. Les INTERLUDES MATH (∂, a·b, ln) portent un symbole
// à la place d'un numéro : ce sont les prérequis mathématiques, intercalés
// juste avant la démo qui s'en sert (dérivée → autograd, produit scalaire →
// attention, logarithme → loss).
const STEPS: ReadonlyArray<{
  id: StepId;
  num: number | string;
  label: string;
  href: string;
  math?: boolean;
}> = [
  { id: "dataset", num: 1, label: "Dataset", href: "/dataset" },
  { id: "tokenizer", num: 2, label: "Tokenizer", href: "/tokenizer" },
  { id: "derivee", num: "∂", label: "Dérivée", href: "/derivee", math: true },
  { id: "autograd", num: 3, label: "Autograd", href: "/autograd" },
  { id: "parameters", num: 4, label: "Parameters", href: "/parameters" },
  { id: "embeddings", num: 5, label: "Embeddings", href: "/embeddings" },
  { id: "rmsnorm", num: 6, label: "RMSNorm", href: "/rmsnorm" },
  {
    id: "produit-scalaire",
    num: "a·b",
    label: "Prod. scalaire",
    href: "/produit-scalaire",
    math: true,
  },
  { id: "attention", num: 7, label: "Attention", href: "/attention" },
  { id: "mlp", num: 8, label: "MLP", href: "/mlp" },
  { id: "forward", num: 9, label: "Forward", href: "/forward" },
  { id: "logarithme", num: "ln", label: "Logarithme", href: "/logarithme", math: true },
  { id: "loss", num: 10, label: "Loss", href: "/loss" },
  { id: "train", num: 12, label: "Training", href: "/train" },
  { id: "inference", num: 13, label: "Inference", href: "/inference" },
];

const Stepper: FC<{ current?: StepId }> = ({ current }) => (
  <nav class="stepper" aria-label="Étapes de la décomposition microgpt">
    <ol>
      {STEPS.map((s) => (
        <li class={`${s.id === current ? "is-active" : ""}${s.math ? " is-math" : ""}`}>
          <a href={s.href} data-testid={`step-${s.id}`}>
            <span class="stepper-num">{s.num}</span>
            <span class="stepper-label">{s.label}</span>
          </a>
        </li>
      ))}
    </ol>
  </nav>
);

type Props = PropsWithChildren<{ title: string; currentStep?: StepId }>;

export const BaseLayout: FC<Props> = ({ title, currentStep, children }) => (
  <>
    {raw("<!DOCTYPE html>")}
    <html lang="fr">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title}</title>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <style>{raw(STYLES)}</style>
        <script type="module" src="/datastar.js"></script>
      </head>
      <body>
        <IconsSprite />
        <Stepper current={currentStep} />
        {children}
      </body>
    </html>
  </>
);

const STYLES = `
  :root {
    color-scheme: light;
    --bg: #f7f7f8;
    --fg: #111;
    --muted: #666;
    --accent: #f97316;
    --border: #e1e1e6;
  }
  * { box-sizing: border-box; }
  body {
    font-family: ui-sans-serif, system-ui, sans-serif;
    background: var(--bg);
    color: var(--fg);
    margin: 0;
    padding: 0 1.5rem 2rem;
  }
  main#app {
    max-width: 1300px;
    margin: 0 auto;
    padding: 1rem 0;
  }
  header h1 {
    font-size: 1.4rem;
    margin: .5rem 0;
  }
  header p {
    color: var(--muted);
    font-family: ui-monospace, monospace;
    font-size: .9rem;
    min-height: 1.4em;
  }
  .legend {
    display: grid;
    grid-template-columns: 1fr;
    gap: .65rem;
    padding: 1rem 1.1rem;
    margin: 1rem 0 0;
    background: #fffbeb;
    border: 1px solid #f5e6a3;
    border-radius: 8px;
    font-size: .88rem;
    line-height: 1.5;
  }
  .legend-intro {
    margin: 0 0 .35rem;
    padding-bottom: .65rem;
    border-bottom: 1px dashed #e4d484;
    color: #404040;
  }
  /* Titre d'un sous-bloc de la légende. <h3> sémantique : nous sommes
     à l'intérieur d'un <aside class="legend"> qui vit sous le <h1> de
     page et à côté des <section> qui portent les <h2>. */
  .legend-intro h3 {
    margin: 0 0 .35rem;
    font-size: 1rem;
    font-weight: 600;
    color: var(--fg);
  }
  .legend-intro h3 code {
    font-weight: 600;
  }
  .legend-paragraph {
    margin: .35rem 0;
    color: #404040;
  }
  .legend-paragraph code,
  .legend-paragraph em {
    color: #6b4f00;
  }
  .legend-intro code,
  .legend-intro em {
    color: #6b4f00;
  }
  .legend-pipeline {
    margin: .25rem 0 0;
    padding-left: 1.1rem;
  }
  .legend-pipeline li {
    margin: .15rem 0;
  }
  .legend-snapshot-caption {
    margin: .75rem 0 .35rem;
    font-size: .88rem;
    color: #404040;
  }
  /* Snapshot JSON colorisé — couleurs du thème slidev-theme-light-icons
     (variables --prism-* du fichier node_modules/.../styles/code.css).
     On hardcode les valeurs ici pour rester indépendant de slidev en
     runtime, tout en gardant la cohérence visuelle du monorepo. */
  .legend-snapshot {
    margin: 0;
    padding: 1rem 1.1rem;
    background: #1b1b1b;
    color: #d4cfbf;
    border-radius: 8px;
    font-family: "Fira Code", ui-monospace, "SF Mono", Menlo, monospace;
    font-size: .8rem;
    line-height: 1.55;
    overflow-x: auto;
    white-space: pre;
    tab-size: 2;
  }
  .legend-snapshot code {
    font-family: inherit;
    background: none;
    color: inherit;
  }
  .legend-snapshot .hl-comment    { color: #758575; font-style: italic; }
  .legend-snapshot .hl-string     { color: #d48372; }
  .legend-snapshot .hl-keyword    { color: #4d9375; }
  .legend-snapshot .hl-number     { color: #6394bf; }
  .legend-snapshot .hl-property   { color: #dd8e6e; }
  .legend-snapshot .hl-identifier { color: #c2b36e; }
  .legend-snapshot .hl-punctuation{ color: #858585; }
  .legend-sublist {
    margin: .25rem 0 0;
    padding-left: 1.1rem;
  }
  .legend-sublist li {
    margin: .15rem 0;
  }
  .legend-item {
    display: grid;
    grid-template-columns: 1.4rem 5.5rem 1fr;
    gap: .65rem;
    align-items: start;
  }
  .legend-item code {
    font-family: ui-monospace, monospace;
    font-weight: 600;
    color: #6b4f00;
  }
  .legend-icon {
    width: 18px;
    height: 18px;
    color: var(--accent);
    flex-shrink: 0;
    /* Aligne l'icône verticalement sur la 1ʳᵉ ligne du texte voisin
       (font-size .88rem × line-height 1.5 ≈ 21 px ; (21 - 18) / 2 ≈ 2 px). */
    margin-top: 2px;
  }
  .graph-block {
    margin: 1.5rem 0 0;
    padding: 1rem 1.1rem 1.1rem;
    background: #fff;
    border: 1px solid var(--border);
    border-radius: 10px;
  }
  .graph-block-header {
    margin-bottom: .75rem;
  }
  .graph-block-header h2 {
    margin: 0 0 .35rem;
    font-size: 1.15rem;
    color: #1a1a1a;
  }
  .graph-block-subtitle {
    margin: 0 0 .5rem;
    color: var(--muted);
    font-size: .9rem;
    line-height: 1.5;
  }
  .graph-questions,
  .graph-legend-mini {
    margin: .4rem 0 .65rem;
    padding-left: 1.2rem;
    color: #404040;
    font-size: .88rem;
    line-height: 1.55;
  }
  .graph-questions li,
  .graph-legend-mini li {
    margin: .25rem 0;
  }
  .graph-questions code,
  .graph-legend-mini code {
    background: #f3eed6;
    padding: 0 .25em;
    border-radius: 3px;
    font-size: .92em;
  }
  .graph-block-step {
    margin: 0;
    padding: .5rem .75rem;
    background: #faf7f0;
    border-left: 3px solid var(--accent);
    border-radius: 4px;
    font-family: ui-monospace, monospace;
    font-size: .85rem;
    color: #404040;
    min-height: 1.4em;
  }
  .step-counter {
    color: var(--muted);
  }
  .graph {
    overflow: auto;
    padding: 1rem 0 0;
  }
  .graph--azur {
    /* Le graphe complet est large : on autorise le scroll horizontal. */
    overflow-x: auto;
    overflow-y: hidden;
  }
  .graph svg {
    display: block;
    margin: 0 auto;
  }
  .graph-block-controls {
    display: flex;
    gap: .75rem;
    align-items: center;
    margin-top: .75rem;
  }
  .graph-block-controls button {
    font: inherit;
    padding: .55rem 1.1rem;
    border: 1px solid var(--border);
    background: #fff;
    border-radius: 6px;
    cursor: pointer;
  }
  .graph-block-controls button[data-testid="next"] {
    background: var(--accent);
    color: #fff;
    border-color: var(--accent);
    font-weight: 600;
  }
  .graph-block-controls button[disabled] {
    opacity: .5;
    cursor: not-allowed;
  }

  /* ── Stepper / fil d'ariane partagé entre démos ─────────────────── */
  .stepper {
    max-width: 1300px;
    margin: 0 auto;
    padding: 1rem 0 .25rem;
  }
  .stepper ol {
    display: flex;
    gap: .5rem;
    list-style: none;
    margin: 0;
    padding: 0;
    overflow-x: auto;
  }
  .stepper li {
    flex: 1 1 0;
    min-width: 8.5rem;
  }
  .stepper a {
    display: flex;
    align-items: center;
    gap: .6rem;
    padding: .55rem .85rem;
    background: #fff;
    color: var(--muted);
    border: 1px solid var(--border);
    border-radius: 8px;
    text-decoration: none;
    font-size: .92rem;
    transition: background 120ms, color 120ms, border-color 120ms;
  }
  .stepper a:hover {
    background: #fafafa;
    color: var(--fg);
  }
  .stepper li.is-active a {
    background: var(--accent);
    color: #fff;
    border-color: var(--accent);
    font-weight: 600;
  }
  .stepper-num {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.5rem;
    height: 1.5rem;
    border-radius: 50%;
    background: #f3f3f5;
    color: var(--muted);
    font-family: ui-monospace, monospace;
    font-size: .78rem;
    font-weight: 600;
    flex-shrink: 0;
  }
  .stepper li.is-active .stepper-num {
    background: #fff;
    color: var(--accent);
  }
  .stepper-label {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  /* Interludes math (∂, a·b, ln) : mêmes pastilles, teinte ambrée pour
     signaler « prérequis mathématique », pas une étape du pipeline. */
  .stepper li.is-math .stepper-num {
    background: #fef3c7;
    color: #92400e;
    border-radius: 6px;
    width: auto;
    min-width: 1.5rem;
    padding: 0 .3rem;
  }
  .stepper li.is-math.is-active a {
    background: #b45309;
    border-color: #b45309;
  }
  .stepper li.is-math.is-active .stepper-num {
    background: #fff;
    color: #b45309;
  }

  /* ── Matrices de paramètres (démo /parameters) ──────────────────── */
  .param-matrices {
    display: flex;
    flex-wrap: wrap;
    gap: 1.5rem;
    margin: 1rem 0;
  }
  .param-matrix-wrapper { display: inline-block; }
  .param-matrix-label {
    font-family: ui-monospace, monospace;
    font-size: .85rem;
    color: var(--muted);
    margin-bottom: .35rem;
  }
  .param-matrix {
    border-collapse: collapse;
    background: #fff;
    border: 1px solid var(--border);
    border-radius: 6px;
    overflow: hidden;
  }
  .param-matrix td {
    border: 1px solid var(--border);
    padding: .35rem .55rem;
    text-align: center;
    font-family: ui-monospace, monospace;
    font-size: .82rem;
    min-width: 5.5rem;
    vertical-align: middle;
  }
  .param-cell {
    display: table-cell;
  }
  .param-cell .data {
    display: block;
    color: var(--fg);
  }
  .param-cell .data.old {
    display: inline;
    color: var(--muted);
    text-decoration: line-through;
  }
  .param-cell .data.new {
    display: inline;
    color: var(--accent);
    font-weight: 600;
  }
  .param-cell .arrow {
    color: var(--muted);
    padding: 0 .25rem;
  }
  .param-cell .grad {
    display: block;
    color: #6b4f00;
    font-size: .72rem;
    margin-top: .15rem;
  }
  .param-cell.is-highlight {
    background: #fffbeb;
    box-shadow: inset 0 0 0 2px var(--accent);
  }

  /* params aplati (ligne) */
  .param-flat { margin: 1rem 0; }
  .param-flat-row {
    display: flex;
    flex-wrap: wrap;
    gap: .35rem;
  }
  .param-flat-cell {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    padding: .35rem .55rem;
    background: #fff;
    border: 1px solid var(--border);
    border-radius: 4px;
    font-family: ui-monospace, monospace;
    font-size: .78rem;
    min-width: 5rem;
  }
  .param-flat-idx {
    color: var(--muted);
    font-size: .68rem;
  }
  .param-flat-cell .grad {
    color: #6b4f00;
    font-size: .68rem;
  }
  .param-flat-cell.is-highlight {
    background: #fffbeb;
    box-shadow: inset 0 0 0 2px var(--accent);
  }

  /* ── Embeddings (démo /embeddings) ──────────────────────────────── */
  .emb-tables {
    display: flex;
    flex-wrap: wrap;
    gap: 1.5rem;
    margin: 1rem 0;
  }
  .emb-sum { margin: 1rem 0; }
  .emb-matrix th.emb-row-label {
    border: 1px solid var(--border);
    padding: .35rem .6rem;
    text-align: right;
    font-family: ui-monospace, monospace;
    font-size: .78rem;
    font-weight: 600;
    color: var(--muted);
    background: #faf7f0;
    white-space: nowrap;
  }
  .emb-matrix tr.is-highlight-row th.emb-row-label {
    color: var(--accent);
    background: #fffbeb;
  }

  /* ── RMSNorm (démo /rmsnorm) ────────────────────────────────────── */
  .rms-scalebox {
    display: flex;
    flex-wrap: wrap;
    gap: 1.25rem;
    margin: 1rem 0;
    padding: .65rem .9rem;
    background: #faf7f0;
    border-left: 3px solid var(--accent);
    border-radius: 4px;
    font-family: ui-monospace, monospace;
    font-size: .85rem;
    color: #404040;
  }

  /* ── Inference (démo /inference) : nom généré en direct ─────────── */
  .sample-output {
    margin: 1.25rem 0;
    padding: 1.5rem 1.25rem;
    background: #faf7f0;
    border: 1px solid var(--border);
    border-radius: 8px;
    font-family: ui-monospace, monospace;
    font-size: 1.8rem;
    color: var(--fg);
    text-align: center;
    min-height: 2.4em;
    letter-spacing: .04em;
  }
  .sample-caret {
    color: var(--accent);
    animation: sample-blink 1s step-end infinite;
  }
  @keyframes sample-blink { 50% { opacity: 0; } }

  /* ── MLP (démo /mlp) : neurones éteints par ReLU ────────────────── */
  .param-cell.is-dead {
    background: #f3f3f5;
  }
  .param-cell.is-dead .data {
    color: #b0b0b0;
    text-decoration: line-through;
  }
`;
