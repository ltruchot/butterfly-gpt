// ═══════════════════════════════════════════════════════════════════════════
// <bgpt-tirage> — la cible de fléchettes gaussienne, encapsulée et pilotée par
// Datastar. Moteur de rendu SVG pur (cible + histogramme).
// ═══════════════════════════════════════════════════════════════════════════
// La slide ne porte plus AUCUN état Vue : elle pilote le composant par des
// SIGNAUX Datastar reliés à des attributs (data-attr) —
//   • `sigma`  : l'écart-type σ (curseur) → reprojette le nuage,
//   • `throw1/throw50/throw500` : compteurs-nonce → ajoutent N impacts,
//   • `reset`  : compteur-nonce → vide la cible.
// L'état lourd (jusqu'à 10000 impacts) vit DANS le composant (signal minimalism :
// on ne met pas un tableau de 10000 points dans un signal). En retour, le
// composant RENVOIE les stats du dernier tir par un event `bgpt-tir` (dataset),
// que la slide lit via `data-on:bgpt-tir` pour ses cartouches de lecture — même
// idiome que le `drag-t` de <bgpt-derivee>.
import {
  CAP,
  CX,
  CY,
  degOf,
  draw,
  FRAME,
  fmt,
  histogram,
  makeRng,
  PXU,
  RINGS,
  type Shot,
  toX,
  toY,
  W,
} from "./tirage-gaussien.logic.ts";

export const TAG = "bgpt-tirage";

// Style inline de la cible (repris VERBATIM de l'ancienne slide Vue).
const TARGET_STYLE =
  "width: 100%; height: auto; background: linear-gradient(180deg, #fdf6e6 0%, #f6ead0 100%); border: 1.5px solid var(--ink); border-radius: 4px";

const n2 = (v: number): string => v.toFixed(2);

// La cible : anneaux fixes + axes + tous les impacts + le rayon/ombre du dernier.
const renderTarget = (samples: readonly Shot[], sigma: number): string => {
  const rings = RINGS.map(
    (r) =>
      `<circle cx="${CX}" cy="${CY}" r="${n2(r * PXU)}" fill="none" stroke="var(--slate)" stroke-width="1" stroke-dasharray="3 3" opacity="0.4" />`,
  ).join("");
  const axes =
    `<line x1="${n2(toX(-FRAME))}" y1="${CY}" x2="${n2(toX(FRAME))}" y2="${CY}" stroke="var(--ink)" stroke-width="1.2" opacity="0.5" />` +
    `<line x1="${CX}" y1="${n2(toY(FRAME))}" x2="${CX}" y2="${n2(toY(-FRAME))}" stroke="var(--ink)" stroke-width="1.2" opacity="0.5" />`;
  const pts = samples
    .map(
      (d) =>
        `<circle cx="${n2(toX(d.zx * sigma))}" cy="${n2(toY(d.zy * sigma))}" r="2.2" fill="var(--amber)" opacity="0.8" />`,
    )
    .join("");
  const last = samples.at(-1);
  const lastMark = last
    ? `<line x1="${CX}" y1="${CY}" x2="${n2(toX(last.zx * sigma))}" y2="${n2(toY(last.zy * sigma))}" stroke="var(--teal)" stroke-width="1.8" stroke-dasharray="4 3" />` +
      `<line x1="${n2(toX(last.zx * sigma))}" y1="${n2(toY(last.zy * sigma))}" x2="${n2(toX(last.zx * sigma))}" y2="${CY}" stroke="var(--crimson)" stroke-width="1.5" stroke-dasharray="2 2" opacity="0.8" />` +
      `<circle cx="${n2(toX(last.zx * sigma))}" cy="${n2(toY(last.zy * sigma))}" r="4" fill="var(--crimson)" stroke="var(--ink)" stroke-width="1" />`
    : "";
  return (
    `<svg viewBox="0 0 ${W} 232" style="${TARGET_STYLE}">` +
    rings +
    axes +
    pts +
    lastMark +
    `<text x="${CX + 5}" y="${CY - 5}" fill="var(--ink)" style="font: 9px 'Fira Code', monospace" opacity="0.6">0</text>` +
    `</svg>`
  );
};

// L'histogramme des ombres, même axe x → la cloche se dessine au fil des tirs.
const renderHisto = (samples: readonly Shot[], sigma: number): string => {
  const bars = histogram(samples, sigma)
    .map(
      (b) =>
        `<rect x="${n2(b.x + 0.5)}" y="${n2(50 - b.h)}" width="${n2(b.w - 1)}" height="${n2(b.h)}" fill="var(--teal)" opacity="0.55" />`,
    )
    .join("");
  return (
    `<svg viewBox="0 0 ${W} 53" style="width: 100%; height: auto; margin-top: 2px">` +
    bars +
    `<line x1="${n2(toX(-FRAME))}" y1="50" x2="${n2(toX(FRAME))}" y2="50" stroke="var(--ink)" stroke-width="1" opacity="0.5" />` +
    `</svg>`
  );
};

export const register = (): void => {
  if (typeof HTMLElement === "undefined" || customElements.get(TAG)) return;

  class BgptTirage extends HTMLElement {
    // σ + les trois compteurs de tir + le reset : tout passe par des attributs
    // reliés aux signaux Datastar (data-attr). Les compteurs sont des NONCES :
    // seule leur VARIATION compte (ajouter N), pas leur valeur.
    static readonly observedAttributes = ["sigma", "throw1", "throw50", "throw500", "reset"];

    #samples: Shot[] = [];
    #rng = makeRng(7); // graine fixe → séquence reproductible (comme l'original)

    // Dernier NONCE traité par compteur + dernière valeur de σ. CLEF anti-boucle :
    // Datastar peut ré-appliquer un data-attr à valeur IDENTIQUE, et setAttribute
    // re-déclenche attributeChangedCallback même sans changement réel. Comme notre
    // #emit() ré-écrit des signaux Datastar (donc peut provoquer cette ré-pose),
    // on doit être IDEMPOTENT : n'agir que sur une vraie progression du compteur.
    #seen: Record<string, number> = { throw1: 0, throw50: 0, throw500: 0, reset: 0 };
    #lastSigma = "";

    get #sigma(): number {
      const s = Number(this.getAttribute("sigma") ?? "0.08");
      return Number.isFinite(s) ? s : 0.08;
    }

    connectedCallback(): void {
      this.style.display = "block";
      this.#render();
      this.#emit();
    }

    attributeChangedCallback(name: string, _oldValue: string | null, value: string | null): void {
      if (name === "sigma") {
        if (value === this.#lastSigma) return; // ré-pose à σ identique → no-op (anti-boucle)
        this.#lastSigma = value ?? "";
        this.#render(); // σ a changé → reprojeter le nuage (et mettre x à jour)
        this.#emit();
        return;
      }
      // Compteurs-nonce : on ignore toute valeur qui ne PROGRESSE pas (pose
      // initiale à 0, ou ré-pose à valeur égale). → exactement une action par clic.
      const v = Number(value ?? "0");
      if (!Number.isFinite(v) || v <= (this.#seen[name] ?? 0)) return;
      this.#seen[name] = v;
      switch (name) {
        case "throw1":
          this.#add(1);
          break;
        case "throw50":
          this.#add(50);
          break;
        case "throw500":
          this.#add(500);
          break;
        case "reset":
          this.#samples = [];
          this.#render();
          this.#emit();
          break;
      }
    }

    #add(count: number): void {
      const room = CAP - this.#samples.length; // limite dure : jamais plus de 10000
      const k = Math.min(count, Math.max(0, room));
      for (let i = 0; i < k; i++) this.#samples.push(draw(this.#rng));
      this.#render();
      this.#emit();
    }

    #render(): void {
      const sigma = this.#sigma;
      this.innerHTML = renderTarget(this.#samples, sigma) + renderHisto(this.#samples, sigma);
    }

    // Renvoie à la slide les stats du dernier tir (pré-formatées) via dataset +
    // event `bgpt-tir` que la slide écoute avec `data-on:bgpt-tir`.
    #emit(): void {
      const last = this.#samples.at(-1);
      this.dataset.shots = String(this.#samples.length);
      this.dataset.hasLast = last ? "true" : "false";
      if (last) {
        this.dataset.u1 = fmt(last.u1);
        this.dataset.u2 = fmt(last.u2);
        this.dataset.r = fmt(last.r);
        this.dataset.deg = degOf(last.a);
        this.dataset.x = fmt(last.zx * this.#sigma, 3);
      }
      this.dispatchEvent(new Event("bgpt-tir", { bubbles: true }));
    }
  }

  customElements.define(TAG, BgptTirage);
};
