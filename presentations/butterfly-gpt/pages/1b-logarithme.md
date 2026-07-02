---
layout: default
---

# {{ $t('logarithme.expoTitle') }} <bgpt-sfx text="VS" color="crimson" size="2.2rem" /> {{ $t('logarithme.logTitle') }}

<div class="rule-ink w-24 my-3" />

<div class="grid grid-cols-[0.82fr_1.4fr] gap-6 mt-2 items-start">

<div>

<div class="panel panel-amber" style="padding: 0.5rem 0.95rem">
  <div class="label-amber" style="font-size: 1rem; display: flex; align-items: center; gap: 0.4em">{{ $t('logarithme.expLabel') }}<span style="font-family: 'Fira Code', monospace; text-transform: none; font-size: 0.68em; color: var(--ink); border: 1.5px solid var(--ink); border-radius: 3px; padding: 0.05em 0.3em; line-height: 1.1">exp()</span></div>
  <p class="text-sm mt-1" style="line-height: 1.3; margin-bottom: 0" v-html="$t('logarithme.expGrowth')"></p>
  <p class="text-xs opacity-70 mb-0" style="margin-top: 0" v-html="$t('logarithme.expEx')"></p>
</div>

<div class="panel mt-2 panel-teal" style="padding: 0.5rem 0.95rem">
  <div class="label-teal" style="font-size: 1rem; display: flex; align-items: center; gap: 0.4em">{{ $t('logarithme.lnLabel') }}<span style="font-family: 'Fira Code', monospace; text-transform: none; font-size: 0.68em; color: var(--ink); border: 1.5px solid var(--ink); border-radius: 3px; padding: 0.05em 0.3em; line-height: 1.1">ln()</span></div>
  <p class="text-sm mt-1" style="line-height: 1.3; margin-bottom: 0" v-html="$t('logarithme.lnGrowth')"></p>

  <p class="text-xs opacity-70 mb-0" style="margin-top: 0" v-html="$t('logarithme.lnEx')"></p>
</div>

</div>

<div>

<!-- exp/ln inverses, 100% Datastar : signal $x ← curseur, le rendu SVG est le
     web component <bgpt-logexp> piloté par data-attr:x. Readout via data-text. -->
<div v-pre class="logexp" data-signals="{x: 1}">
  <div class="controls">
    <div class="ctrl">
      <input type="range" min="0.1" max="1.83" step="0.01" data-bind:x />
    </div>
    <div class="readout">
      <span class="codechip"><span class="fn">exp</span>(<span class="num" data-text="window.bgpt.logexp.xStr($x)"></span>) = <span class="num" data-text="window.bgpt.logexp.exStr($x)"></span></span>
      <span class="arrow" data-text="window.bgpt.t('logarithme.mirror')"></span>
      <span class="codechip"><span class="fn">ln</span>(<span class="num" data-text="window.bgpt.logexp.exStr($x)"></span>) = <span class="num" data-text="window.bgpt.logexp.xStr($x)"></span></span>
    </div>
  </div>
  <div class="stage">
    <bgpt-logexp data-attr:x="$x"></bgpt-logexp>
  </div>
</div>

</div>

</div>

<!-- cartouche « surprise » remonté au niveau du slider ; left = bord droit du graphe + le même écart (2,45 %) que les cartouches de gauche -->
<div style="position: absolute; top: 19.5%; left: 78.1%; right: calc(0.5rem + 0.5%)">
  <!-- Mini-démo « surprise » = −ln(proba), 100% Datastar (signal $pct → readouts
       data-text). Logique pure exposée sur window.bgpt.sm (cf. src/components). -->
  <div v-pre class="surprise-mini" data-signals="{pct: 100}">
    <div class="sm-intro"><span data-text="window.bgpt.t('logarithme.introA')"></span><strong data-text="window.bgpt.t('logarithme.introStrong')"></strong><span data-text="window.bgpt.t('logarithme.introB')"></span></div>
    <div class="sm-line">
      <span data-text="window.bgpt.t('logarithme.winLead')"></span><strong data-text="$pct"></strong><span data-text="window.bgpt.t('logarithme.winTail')"></span>
      <strong class="sm-hi" data-text="window.bgpt.sm.reactionText($pct)"></strong>
      <span class="sm-emoji" data-text="window.bgpt.sm.reactionEmoji($pct)"></span>
    </div>
    <input class="sm-slider" type="range" min="1" max="100" step="1" data-bind:pct />
    <div class="codechip sm-chip">
      −<span class="fn">ln</span>(<span class="num" data-text="window.bgpt.sm.probaStr($pct)"></span>) =
      <span class="num" data-text="window.bgpt.sm.surpriseStr($pct)"></span>
    </div>
  </div>
</div>

<div style="position: absolute; right: calc(0.5rem + 0.5%); bottom: 0; width: 210px; text-align: center">
  <div style="margin-bottom: 0.15rem; position: relative; z-index: 1; top: 5%; transform: rotate(-5deg)">
    <bgpt-sfx text-key="common.mathBoss" color="crimson" size="1rem" />
  </div>
  <!-- image retournée en miroir pour qu'elle regarde vers le graphe ; le nom au-dessus reste dans le bon sens -->
  <img :src="$asset('/klowd-boss-math-2.png')" style="width: 200px; display: block; margin: 0 auto; transform: scaleX(-1)" />
</div>

<style scoped>
/* mini-snippets « code exécuté » : mêmes teintes que Shiki light-plus (cf. 3b) :
   fonction #795e26, nombre #098658, commentaire #008000. */
/* .codechip (global, styles/local.css) ; ici on n'ajuste que l'interligne et la
   marge des blocs multi-lignes propres à cette slide. */
.codeblock { line-height: 1.35; margin: 0.12rem 0; }
</style>

<!--
Logarithme VS Exponentielle — deux fonctions inverses, montrées dans le miroir y = x :
- exp : croissance qui s'accélère (pente de plus en plus raide)
- ln  : croissance qui ralentit (monte encore, pente de plus en plus douce ; écrase, × → +)
- un seul curseur, le même couple de nombres lu dans les deux sens
Tout est positif, on part de 0 : exp(0) = 1, ln(1) = 0 (les deux ancres du graphe).
NB : la « surprise » (−ln de la proba) est vue plus tard — à la passe avant (−ln) et au training.
-->
