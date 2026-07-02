---
layout: default
---

# {{ $t('annexeSchema.title') }}

<div class="rule-ink w-24 my-3" />

<div class="text-sm mb-2" v-html="$t('annexeSchema.hint')"></div>

<div class="schema">

<!-- ① LES EMBEDDINGS -->
<div class="panel col">
  <div class="label-teal">{{ $t('annexeSchema.colIn') }}</div>
  <div class="bk bk-ink">{{ $t('annexeSchema.brickInput') }}<span class="sub">{{ $t('annexeSchema.subInput') }}</span><span class="tip" v-html="$t('annexeSchema.tipInput')"></span></div>
  <div class="arr">↓</div>
  <div class="bkrow">
    <div class="bk bk-teal">tokenEmb<span class="sub">44 × 16</span><span class="tip" v-html="$t('annexeSchema.tipTokenEmb')"></span></div>
    <div class="plus">+</div>
    <div class="bk bk-teal">positionEmb<span class="sub">64 × 16</span><span class="tip" v-html="$t('annexeSchema.tipPositionEmb')"></span></div>
  </div>
  <div class="arr">↓</div>
  <div class="bk bk-paper">x<span class="sub">{{ $t('annexeSchema.subX') }}</span><span class="tip" v-html="$t('annexeSchema.tipX')"></span></div>
  <div class="arr">↓</div>
  <div class="bk bk-slate">rmsnorm<span class="tip" v-html="$t('annexeSchema.tipRmsIn')"></span></div>
</div>

<div class="colarr">→</div>

<!-- ② L'ATTENTION -->
<div class="panel col">
  <div class="label-crimson">{{ $t('annexeSchema.colAttn') }}</div>
  <div class="bk bk-slate">rmsnorm<span class="tip" v-html="$t('annexeSchema.tipRmsAttn')"></span></div>
  <div class="arr">↓</div>
  <div class="bkrow">
    <div class="bk bk-crimson">attn_wq<span class="tip" v-html="$t('annexeSchema.tipWq')"></span></div>
    <div class="bk bk-crimson">attn_wk<span class="tip" v-html="$t('annexeSchema.tipWk')"></span></div>
    <div class="bk bk-crimson">attn_wv<span class="tip" v-html="$t('annexeSchema.tipWv')"></span></div>
  </div>
  <div class="arr">↓</div>
  <div class="bk bk-ink">{{ $t('annexeSchema.brickCache') }}<span class="tip" v-html="$t('annexeSchema.tipCache')"></span></div>
  <div class="arr">↓</div>
  <div class="bk bk-crimson">attention<span class="sub">{{ $t('annexeSchema.subAttn') }}</span><span class="tip" v-html="$t('annexeSchema.tipHeads')"></span></div>
  <div class="arr">↓</div>
  <div class="bk bk-crimson">attn_wo<span class="tip" v-html="$t('annexeSchema.tipWo')"></span></div>
  <div class="arr">↓</div>
  <div class="bk bk-paper">{{ $t('annexeSchema.brickResidual') }}<span class="tip" v-html="$t('annexeSchema.tipResidual1')"></span></div>
</div>

<div class="colarr">→</div>

<!-- ③ LE PERCEPTRON (MLP) -->
<div class="panel col">
  <div class="label-amber">{{ $t('annexeSchema.colMlp') }}</div>
  <div class="bk bk-slate">rmsnorm<span class="tip" v-html="$t('annexeSchema.tipRmsMlp')"></span></div>
  <div class="arr">↓</div>
  <div class="bk bk-amber">mlp_fc1<span class="sub">16 → 64</span><span class="tip" v-html="$t('annexeSchema.tipFc1')"></span></div>
  <div class="arr">↓</div>
  <div class="bk bk-amber">ReLU<span class="tip" v-html="$t('annexeSchema.tipRelu')"></span></div>
  <div class="arr">↓</div>
  <div class="bk bk-amber">mlp_fc2<span class="sub">64 → 16</span><span class="tip" v-html="$t('annexeSchema.tipFc2')"></span></div>
  <div class="arr">↓</div>
  <div class="bk bk-paper">{{ $t('annexeSchema.brickResidual') }}<span class="tip" v-html="$t('annexeSchema.tipResidual2')"></span></div>
</div>

<div class="colarr">→</div>

<!-- ④ LA SORTIE -->
<div class="panel col">
  <div class="label-ink">{{ $t('annexeSchema.colOut') }}</div>
  <div class="bk bk-slate">outputProj<span class="sub">16 → 44</span><span class="tip" v-html="$t('annexeSchema.tipOutputProj')"></span></div>
  <div class="arr">↓</div>
  <div class="bk bk-slate">{{ $t('annexeSchema.brickScores') }}<span class="sub">{{ $t('annexeSchema.subScores') }}</span><span class="tip" v-html="$t('annexeSchema.tipScores')"></span></div>
  <div class="arr">↓</div>
  <div class="bk bk-slate">softmax<span class="tip" v-html="$t('annexeSchema.tipSoftmax')"></span></div>
  <div class="arr">↓</div>
  <div class="bk bk-ink">{{ $t('annexeSchema.brickNext') }}<span class="tip tip-last" v-html="$t('annexeSchema.tipNext')"></span></div>
</div>

</div>

<style scoped>
/* Schéma « brique par brique » du forward pass (cf. gpt(), 09-model.ts).
   Tooltips en pur CSS :hover — pas de JS, pas de Datastar. */
.schema {
  display: grid;
  grid-template-columns: 0.95fr auto 1.15fr auto 1fr auto 1fr;
  gap: 0.5rem;
  align-items: stretch;
  margin-top: 0.4rem;
}
.schema .col {
  padding: 0.5rem 0.55rem;
  display: flex;
  flex-direction: column;
}
.schema .col > [class^="label-"] {
  font-size: 0.78rem;
  margin-bottom: 0.35rem;
}
.colarr {
  align-self: center;
  font-weight: 900;
  font-size: 1.15rem;
  opacity: 0.45;
}
.bkrow {
  display: flex;
  gap: 0.25rem;
  align-items: stretch;
}
.bkrow .bk {
  flex: 1;
}
.plus {
  align-self: center;
  font-weight: 900;
  opacity: 0.6;
}
.arr {
  text-align: center;
  opacity: 0.45;
  line-height: 1;
  font-size: 0.7rem;
  margin: 0.14rem 0;
}
.bk {
  position: relative;
  font-family: "Fira Code", monospace;
  font-size: 0.66rem;
  font-weight: 700;
  border: 2px solid var(--ink);
  border-radius: 3px;
  padding: 0.2rem 0.3rem;
  text-align: center;
  line-height: 1.25;
  cursor: help;
}
.bk .sub {
  display: block;
  font-weight: 400;
  font-size: 0.56rem;
  opacity: 0.8;
}
.bk-teal { background: var(--teal); color: var(--paper); }
.bk-crimson { background: var(--crimson); color: var(--paper); }
.bk-amber { background: var(--amber); color: var(--ink); }
.bk-slate { background: var(--slate); color: var(--paper); }
.bk-ink { background: var(--ink); color: var(--paper); }
.bk-paper { background: #fff; color: var(--ink); }

/* La tooltip : cartouche encré au-dessus de la brique survolée. */
.bk .tip {
  display: none;
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  width: 16rem;
  background: var(--ink);
  color: var(--paper);
  border: 2px solid var(--paper);
  outline: 2px solid var(--ink);
  border-radius: 6px;
  padding: 0.45rem 0.6rem;
  font-family: "Poppins", sans-serif;
  font-weight: 400;
  font-size: 0.7rem;
  line-height: 1.45;
  text-align: left;
  z-index: 60;
  box-shadow: 4px 4px 0 rgba(20, 17, 15, 0.35);
}
.bk:hover .tip {
  display: block;
}
/* Colonnes de bord : la tooltip reste dans la slide. */
.schema .col:first-of-type .tip {
  left: 0;
  transform: none;
}
.schema .col:last-of-type .tip {
  left: auto;
  right: 0;
  transform: none;
}
/* La dernière brique (bas de colonne ④) : tooltip au-dessus, jamais coupée. */
.tip a, .tip strong { color: var(--amber); }
</style>

<!--
Résumé visuel du forward pass complet (une passe de gpt(), fidèle à
09-model.ts / microgpt.py) pour les cerveaux « image ». Chaque brique se
survole : la tooltip redonne le rôle avec le wording des slides (query
« je cherche quoi ? », dépliage/coude/repliage, résiduel « on garde x »…).
Inspiré du classeur microgpt-excel (iamyb) — même modèle, cellule par
cellule, dans un tableur ; ajouté à la bibliographie.
-->
