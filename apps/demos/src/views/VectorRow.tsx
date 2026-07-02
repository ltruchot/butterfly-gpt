import type { FC } from "hono/jsx";
import { fmt as fmt3 } from "./fmt.ts";

// Une ligne de vecteur sous forme de cellules numériques — le composant
// de base des tables « vecteur » (embeddings, rmsnorm, attention, forward).
// Le formateur est injectable pour les démos qui n'affichent pas 3 décimales
// (attention affiche 2), sans dupliquer le composant.

export const VectorRow: FC<{
  label: string;
  values: readonly number[];
  highlight?: boolean;
  fmt?: (n: number) => string;
}> = ({ label, values, highlight, fmt = fmt3 }) => (
  <tr class={highlight ? "is-highlight-row" : ""}>
    <th class="emb-row-label">{label}</th>
    {values.map((v) => (
      <td class={`param-cell ${highlight ? "is-highlight" : ""}`}>
        <span class="data">{fmt(v)}</span>
      </td>
    ))}
  </tr>
);
