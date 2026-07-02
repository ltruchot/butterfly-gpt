// ════════════════════════════════════════════════════════════════════════
// Graphe de loss en SVG (chaîne) — utilisé par pages/8c-train-code.md
// ════════════════════════════════════════════════════════════════════════
// Construit un SVG (à injecter via innerHTML) montrant la loss qui descend :
// la courbe BRUTE (orange clair, qui zigzague) et sa MOYENNE LISSÉE (crimson),
// plus un repère horizontal à ln(vocabSize) = la loss d'un modèle « au hasard ».
const PAD = { l: 34, r: 10, t: 10, b: 22 };
const W = 520;
const H = 250;

const esc = (n: number): string => (Math.round(n * 100) / 100).toString();

/** Rend le graphe. `raw` = pertes brutes, `ema` = pertes lissées (même longueur). */
export const lossChartSVG = (
  raw: readonly number[],
  ema: readonly number[],
  numSteps: number,
  lnVocab: number,
): string => {
  const yMax = Math.max(lnVocab + 0.4, ...raw, 0.5);
  const yMin = Math.max(0, Math.min(lnVocab - 1.4, ...(ema.length ? ema : [yMax])));
  const x = (i: number): number => PAD.l + (i / Math.max(1, numSteps - 1)) * (W - PAD.l - PAD.r);
  const y = (v: number): number => PAD.t + (1 - (v - yMin) / (yMax - yMin)) * (H - PAD.t - PAD.b);
  const path = (arr: readonly number[]): string =>
    arr.map((v, i) => `${i === 0 ? "M" : "L"}${esc(x(i))},${esc(y(v))}`).join(" ");

  const yRef = y(lnVocab);
  const last = ema.length ? ema[ema.length - 1]! : lnVocab;

  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto">
    <rect x="0" y="0" width="${W}" height="${H}" fill="#fff"/>
    <line x1="${PAD.l}" y1="${PAD.t}" x2="${PAD.l}" y2="${H - PAD.b}" stroke="#14110f" stroke-width="1.5"/>
    <line x1="${PAD.l}" y1="${H - PAD.b}" x2="${W - PAD.r}" y2="${H - PAD.b}" stroke="#14110f" stroke-width="1.5"/>
    <line x1="${PAD.l}" y1="${esc(yRef)}" x2="${W - PAD.r}" y2="${esc(yRef)}" stroke="#0f5e5a" stroke-width="1.3" stroke-dasharray="5 4"/>
    <text x="${W - PAD.r}" y="${esc(yRef - 4)}" text-anchor="end" font-size="10" fill="#0f5e5a" font-family="'Fira Code',monospace">random ≈ ${esc(lnVocab)}</text>
    <path d="${path(raw)}" fill="none" stroke="#e8a33d" stroke-width="1.3" opacity="0.65"/>
    <path d="${path(ema)}" fill="none" stroke="#b5223a" stroke-width="2.6"/>
    <text x="${PAD.l - 5}" y="${esc(y(yMax) + 4)}" text-anchor="end" font-size="10" fill="#14110f" font-family="'Fira Code',monospace">${esc(yMax)}</text>
    <text x="${PAD.l - 5}" y="${esc(y(yMin) + 4)}" text-anchor="end" font-size="10" fill="#14110f" font-family="'Fira Code',monospace">${esc(yMin)}</text>
    <text x="${W - PAD.r}" y="${H - 6}" text-anchor="end" font-size="10" fill="#14110f" font-family="'Fira Code',monospace">loss ${esc(last)}</text>
  </svg>`;
};
