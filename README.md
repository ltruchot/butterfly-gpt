# butterfly-gpt

Réimplémentation TypeScript, fonctionnelle et vulgarisée, du
[microgpt](https://karpathy.github.io/2026/02/12/microgpt/) d'Andrej Karpathy,
entraînée sur ~5 904 noms de papillons.

- `packages/microgpt-ts` : le GPT en 13 briques commentées (`vp run train`)
- `apps/demos` : les démos interactives (Hono + Datastar)
- `presentations/butterfly-gpt` : les slides du MOOC, en ligne sur
  [developers.gods.academy/loic-truchot/projects/butterfly-gpt](https://developers.gods.academy/loic-truchot/projects/butterfly-gpt/)

## Développement

- Vérifier que tout est prêt :

```bash
vp run ready
```

- Lancer les tests :

```bash
vp run -r test
```

- Builder le monorepo :

```bash
vp run -r build
```

- Lancer le serveur de développement :

```bash
vp run dev
```

## Licence

Ce monorepo est un « MOOC » en libre accès :
**toute utilisation à des fins commerciales est interdite**. Le code est sous
**[PolyForm Noncommercial 1.0.0](https://polyformproject.org/licenses/noncommercial/1.0.0/)**,
le contenu (textes, slides, figures) sous
**[CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.fr)**.
Détail bilingue dans [LICENSE.md](LICENSE.md).
Contact : [LinkedIn](https://www.linkedin.com/in/lo%C3%AFc-truchot-93924497/).

Toutes les images de « Butterfly » de Dave Gibbons ont été collectées sur des
sites de fans partageant des extraits sous licence CC-BY-SA et sur Internet
Archive (elles ont été publiées sans paywall pendant la promotion des films
Matrix), mais je n'en possède pas la licence ni le droit d'exploitation. Je
n'ai aucun droit sur ces extraits d'images et suis prêt à les retirer à la
moindre demande (mes mails sont restés sans réponse) : il en va de même pour
quiconque utiliserait cette présentation.

Le code microgpt d'Andrej Karpathy présenté ici reste sa propriété
intellectuelle exclusive. Il est partagé par son auteur en
[gist public sur GitHub](https://gist.github.com/karpathy/8627fe009c40f57531cb18360106ce95),
sans licence explicite ; la notice
[MIT de micrograd](https://github.com/karpathy/micrograd/blob/master/LICENSE)
est reproduite de bonne foi dans
[packages/microgpt-python-karpathy/LICENSE](packages/microgpt-python-karpathy/LICENSE).

## Contenu généré par IA

Plus de 50 % du contenu de ce monorepo a été généré par des IA :
**Claude Code** (Opus 4.8 ~40 %, Fable 5 ~5 %), **Gemma 4** (~5 %),
**ChatGPT** (~5 %) et **Nano Banana 2** (quelques images).
