import type { FC } from "hono/jsx";
import type { Phase, SessionSnapshot } from "./session.ts";

// ════════════════════════════════════════════════════════════════════════
// <Tokenizer> — démo /tokenizer
// ════════════════════════════════════════════════════════════════════════
// Cinq phases — chaque clic « Suivant » avance d'une. Le bouton change
// de label en fonction de la phase courante pour rester parlant.

const nextLabel = (p: Phase): string => {
  if (p === "initial") return "1 · Convert (split en caractères)";
  if (p === "converted") return "2 · Dedupe";
  if (p === "deduped") return "3 · Sort";
  if (p === "sorted") return "4 · Show IDs + BOS";
  return "Terminé";
};

const phaseDescription = (s: SessionSnapshot): string => {
  if (s.phase === "initial")
    return `${s.entries.length} entrées d'exemple (les 30 premières de docs).`;
  if (s.phase === "converted") return `${s.flatChars.length} caractères au total, doublons inclus.`;
  if (s.phase === "deduped")
    return `${s.uniqueChars.length} caractères uniques (ordre d'apparition, non trié).`;
  if (s.phase === "sorted")
    return `${s.sortedChars.length} caractères uniques triés (sur le sample de 30 entrées). Chacun reçoit son id selon sa position. On bascule à l'étape suivante sur le VOCAB COMPLET (corpus entier, ~5 904 noms).`;
  return `Vocab complet sur le corpus entier (~5 904 noms) : ${s.bos} caractères distincts → ids 0 à ${s.bos - 1}, + BOS=${s.bos} → vocabSize=${s.bos + 1}. Tous les ${s.bos + 1} tokens sont listés ci-dessous, dans l'ordre du tri par tranches (espace, a–z, puis tout le reste en ordre Unicode).`;
};

// Rendu d'un array de strings, format JS-like inline.
const renderArray = (items: readonly string[], { limit = 60 } = {}): string => {
  const shown = items.slice(0, limit);
  const json = shown.map((c) => JSON.stringify(c)).join(", ");
  const ellipsis = items.length > limit ? `, /* …${items.length - limit} de plus */` : "";
  return `[${json}${ellipsis}]`;
};

type Category = "space" | "lower" | "accent" | "punct" | "other";

const categoryLabel: Record<Category, string> = {
  space: "Espace (séparateur, en tête)",
  lower: "Lettres ASCII a–z (mnémotechnique : a→1, z→26)",
  accent: "Caractères latins étendus (tous les accents et ligatures)",
  punct: "Ponctuation (tiret, apostrophe…)",
  other: "Autres",
};

// Catégorisation par code point. Robuste : tout char tombe dans une
// catégorie connue, aucun n'est silencieusement omis.
//   • U+0020            → espace
//   • U+0061..U+007A    → a–z
//   • U+00C0..U+024F    → Latin étendu (accents, ligatures)
//   • sinon (tiret, apostrophe typographique U+2019…) → ponctuation
const categorize = (ch: string): Category => {
  if (ch === " ") return "space";
  const cp = ch.codePointAt(0) ?? 0;
  if (cp >= 0x61 && cp <= 0x7a) return "lower";
  if (cp >= 0xc0 && cp <= 0x24f) return "accent";
  return "punct";
};

const renderIdTable = (sorted: readonly string[], bos: number): string => {
  // RENDU LINÉAIRE — on parcourt `sorted` dans l'ordre des ids (déjà
  // trié par la lib en TROIS TRANCHES : espace, puis a–z, puis tout le
  // reste en ordre Unicode — le tiret arrive donc AVANT les accents,
  // l'apostrophe typographique APRÈS). Une étiquette de catégorie est
  // insérée à chaque transition (une même catégorie peut donc réapparaître,
  // ex. la ponctuation, coupée en deux par les accents). AUCUN char n'est
  // filtré — y compris la catégorie "Autres", improbable mais affichée.
  const lines: string[] = [];
  lines.push("// char → id   (tri par tranches : espace, a–z, puis le reste en ordre Unicode)");
  lines.push("{");
  let prevCat: Category | null = null;
  for (let i = 0; i < sorted.length; i++) {
    const ch = sorted[i]!;
    const cat = categorize(ch);
    if (cat !== prevCat) {
      if (prevCat !== null) lines.push("");
      lines.push(`  // ${categoryLabel[cat]}`);
      prevCat = cat;
    }
    lines.push(`  ${JSON.stringify(ch).padEnd(6, " ")}: ${i},`);
  }
  lines.push("");
  lines.push("  // BOS — token sentinelle, n'apparaît jamais dans le texte.");
  lines.push("  //       Sa valeur = uchars.length (id juste après le dernier char).");
  lines.push(`  "\\n"  : ${bos},`);
  lines.push("}");
  lines.push("");
  lines.push(`// uchars.length = ${bos}   ← d'où BOS = ${bos}`);
  lines.push(`// vocabSize     = ${bos + 1}   ← uchars.length + 1 (pour BOS)`);
  return lines.join("\n");
};

export const App: FC<{ state: SessionSnapshot }> = ({ state }) => {
  let viewerContent: string;
  if (state.phase === "initial") {
    viewerContent = state.entries
      .map((e, i) => `${i.toString().padStart(3, " ")}  ${e}\n`)
      .join("");
  } else if (state.phase === "converted") {
    viewerContent = renderArray(state.flatChars);
  } else if (state.phase === "deduped") {
    viewerContent = renderArray(state.uniqueChars);
  } else if (state.phase === "sorted") {
    viewerContent = renderArray(state.sortedChars);
  } else {
    // Phase "ids" : on bascule sur le VOCAB COMPLET (uchars sur le corpus entier).
    // Cohérent avec `state.bos = uchars.length`.
    viewerContent = renderIdTable(state.vocabChars, state.bos);
  }

  return (
    <main id="app" data-init="@get('/tokenizer/subscribe')" data-preserve-attr="data-init">
      <header>
        <h1>2 · Tokenizer</h1>
        <p class="graph-block-subtitle">
          Un GPT manipule des nombres. Le tokenizer fait la conversion <code>string ↔ id</code> dans
          les deux sens. Ici on opère <strong>caractère par caractère</strong> (granularité
          minimale, vocabulaire minuscule), exactement comme dans <code>02-tokenizer.ts</code>.
        </p>
        <p class="graph-block-step" data-testid="phase">
          {phaseDescription(state)}
        </p>
      </header>

      <section class="graph-block" data-testid="tokenizer-block">
        <header class="graph-block-header">
          <h2>Pipeline (clique pour faire avancer)</h2>
          <ul class="graph-legend-mini">
            <li>
              <strong>1. Convert</strong> — <code>docs.flatMap(d =&gt; Array.from(d))</code>.
              Aplatit en array de caractères. Doublons inclus.
            </li>
            <li>
              <strong>2. Dedupe</strong> — <code>Array.from(new Set(...))</code>. On garde la
              première occurrence.
            </li>
            <li>
              <strong>3. Sort</strong> — tri par tranches : espace, puis a–z, puis tout le reste en
              ordre Unicode. C'est cette POSITION qui fixe l'id de chaque caractère.
            </li>
            <li>
              <strong>4. Show IDs + BOS</strong> — table <code>char → id</code> et le token
              sentinelle <code>BOS = uchars.length</code> en bonus.
            </li>
          </ul>
        </header>

        <pre class="legend-snapshot" data-testid="viewer">
          {viewerContent}
        </pre>

        <footer class="graph-block-controls">
          <button
            type="button"
            data-testid="next"
            data-on:click="@post('/tokenizer/next')"
            disabled={state.phase === "ids"}
          >
            {nextLabel(state.phase)} →
          </button>
          <button type="button" data-testid="reset" data-on:click="@post('/tokenizer/reset')">
            ↻ Reset
          </button>
        </footer>
      </section>
    </main>
  );
};
