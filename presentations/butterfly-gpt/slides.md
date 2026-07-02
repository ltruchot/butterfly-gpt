---
theme: light-icons
title: Karpathy's MicroGPT
info: |
  Karpathy's MicroGPT — la vraie présentation (charte « Matrix Comics »).
# Deck verrouillé en mode CLAIR : la charte est crème/comic, et le code Shiki
# doit utiliser sa variante claire (light-plus). Sans ça, un navigateur/projecteur
# en dark mode fait servir les couleurs --shiki-dark (pâles) sur notre fond blanc.
colorSchema: light
mdc: true
drawings:
  persist: false
transition: slide-left
layout: cover
image: /comic-cover.jpg
---

# {{ $t('cover.title') }}

{{ $t('cover.shareLead') }} <bgpt-sfx text-key="cover.sharePill" color="crimson" size="1.6rem" />

<div style="position: absolute; right: 2rem; bottom: 1.2rem; text-align: right; font-family: 'Poppins', sans-serif; line-height: 1.35; z-index: 3">
  <div class="text-sm" style="color: var(--paper)">Loïc TRUCHOT — BreizhCamp 2026</div>
  <div class="text-xs" style="color: var(--paper); opacity: 0.7">sponsored by <strong>Shodo</strong> &amp; <strong>Actian Zeenea</strong></div>
</div>



---
src: ./pages/1-le-sage-et-le-papillon.md
---

---
src: ./pages/1a-singularite.md
---

---
src: ./pages/1c-l-homme-des-carpates.md
---

---
src: ./pages/1d-microgpt-image.md
---

---
src: ./pages/1e-exec-microgpt.md
---

---
src: ./pages/1f-butterfly-exec.md
---

---
src: ./pages/2-microgpt.md
---

---
src: ./pages/2a-neurones.md
---

---
src: ./pages/2b-transformes.md
---

---
src: ./pages/2c-briques.md
---

---
src: ./pages/3-dataset.md
---

---
src: ./pages/3a-nettoyer.md
---

---
src: ./pages/3b-dataset-code.md
---

---
src: ./pages/4-tokenizer.md
---

---
src: ./pages/4a-atomiser.md
---

---
src: ./pages/4b-tokenizer-code.md
---

---
src: ./pages/5-parameters.md
---

---
src: ./pages/5a-parameters-def.md
---

---
src: ./pages/5aa-tirage-gaussien.md
---

---
src: ./pages/5c-parameters-code.md
---

---
src: ./pages/6-autograd.md
---

---
src: ./pages/6a-mort-vivant.md
---

---
src: ./pages/6b-passe-avant.md
---

---
src: ./pages/6c-la-derivee.md
---

---
src: ./pages/6e-passe-avant-code.md
---

---
src: ./pages/6f-passe-arriere.md
---

---
src: ./pages/6g-regle-chaine.md
---

---
src: ./pages/6i-passe-arriere-code.md
---

---
src: ./pages/7-architecture.md
---

---
src: ./pages/7a-pipeline.md
---

---
src: ./pages/7b-embeddings.md
---

<!-- exp/log : introduit juste AVANT softmax (qui s'en sert) — pas besoin plus tôt. -->

---
src: ./pages/1b-logarithme.md
---

---
src: ./pages/7ba-softmax.md
---

---
src: ./pages/7c-attention.md
---

---
src: ./pages/7ca-attention-code.md
---

---
src: ./pages/7f-mlp.md
---

---
src: ./pages/7d-rms.md
---

---
src: ./pages/7g-forward-code.md
---

---
src: ./pages/7h-loss.md
---

---
src: ./pages/8-training.md
---

---
src: ./pages/8a-entrainement.md
---

---
src: ./pages/8b-adam.md
---

---
src: ./pages/8c-train-code.md
---

---
src: ./pages/9-inference.md
---

---
src: ./pages/9a-inference.md
---

---
src: ./pages/9b-inference-code.md
---

---
src: ./pages/9c-inference-live.md
---

---
src: ./pages/9d-conclusion.md
---

---
src: ./pages/10a-remerciements.md
---

---
src: ./pages/10b-merci.md
---

---
src: ./pages/10c-bibliographie.md
---

<!-- ── ANNEXE (après les remerciements) ─────────────────────────────────── -->

---
src: ./pages/annexe-titre.md
---

---
src: ./pages/annexe-schema.md
---

---
src: ./pages/annexe-en-vrai.md
---

---
src: ./pages/annexe-le-harnais.md
---

---
src: ./pages/annexe-derivee-partielle.md
---

---
src: ./pages/annexe-regle-chaine-multivariable.md
---

---
src: ./pages/annexe-residuels-rmsnorm.md
---

---
src: ./pages/annexe-helpers.md
---

---
src: ./pages/5b-parameters-3d.md
---
