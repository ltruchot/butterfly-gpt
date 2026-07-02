# Andrej Karpathy — portrait, parcours & revue de presse

> Revue réalisée le **2026-06-08** pour la slide « Mentor » du deck
> `butterfly-gpt`. **Règle de la fiche : chaque fait avancé porte au moins un
> lien-preuve.** Ce qui n'a **pas** pu être sourcé est signalé comme tel
> (« non trouvé / incertain ») plutôt qu'affirmé.
>
> **Fiabilité.** Les faits les plus sensibles (arrivée chez Anthropic, date/lieu
> de naissance, directeur de thèse, thèse « AGI à ~10 ans ») ont été
> **re-vérifiés par consultation directe des pages** le 2026-06-08. Les autres
> liens proviennent d'une recherche web ; les sources stables (Wikipedia,
> Stanford CS, karpathy.ai, GitHub, presse tech identifiée) sont privilégiées.

## En bref

Andrej Karpathy (né en 1986 à Bratislava) est l'un des ingénieurs-chercheurs en
IA les plus influents de sa génération **et** son pédagogue le plus suivi.
Doctorant de Fei-Fei Li à Stanford, **membre fondateur d'OpenAI**, **directeur
de l'IA / Autopilot chez Tesla**, de retour chez OpenAI puis fondateur d'**Eureka
Labs** (éducation IA), il a **rejoint Anthropic le 19 mai 2026** pour travailler
sur le pré-entraînement de Claude. Réputé humble et accessible, il a démocratisé
le deep learning (CS231n, « Neural Networks: Zero to Hero », micrograd, nanoGPT)
et forgé des notions devenues courantes (« Software 2.0 », « vibe coding »). Il
se dit plus prudent que le consensus sur l'AGI : « encore à environ dix ans ».

---

## 1. Actualité — l'arrivée chez Anthropic (mai 2026)

- Karpathy a **rejoint Anthropic** et l'a annoncé sur X (« I've joined
  Anthropic »). Il a **commencé la semaine du 19 mai 2026**, sur le
  **pré-entraînement** (l'étape qui donne à Claude ses connaissances et capacités
  de base), sous la responsabilité du team lead **Nick Joseph**. Un porte-parole
  d'Anthropic indique qu'il va **monter une équipe dédiée à l'usage de Claude
  pour accélérer la recherche de pré-entraînement**.
  - <https://techcrunch.com/2026/05/19/openai-co-founder-andrej-karpathy-joins-anthropics-pre-training-team/>
  - <https://www.axios.com/2026/05/19/anthropic-openai-karpathy-andrej-claude>
  - <https://www.cnbc.com/2026/05/19/anthropic-hires-openai-cofounder-andrej-karpathy-former-tesla-ai-lead.html>
- Lecture « guerre des talents » (Anthropic vs OpenAI) au moment de ce recrutement :
  - <https://gizmodo.com/openai-cofounder-andrej-karpathy-joins-anthropic-as-sam-altmans-fortunes-turn-2000760674>

---

## 2. Biographie — origines

- **Né le 23 octobre 1986 à Bratislava** (alors Tchécoslovaquie, aujourd'hui
  Slovaquie). **Nationalité slovaco-canadienne.**
  - <https://en.wikipedia.org/wiki/Andrej_Karpathy>
- **Émigré à Toronto (Canada) avec sa famille à l'âge de 15 ans.**
  - <https://en.wikipedia.org/wiki/Andrej_Karpathy>

---

## 2 bis. « L'homme des Carpates » — géographie & étymologie

> Sert de fil au **titre de la slide**. Géographie = **fait sourcé** ;
> l'étymologie du patronyme = **fait sur le nom**, pas sur sa généalogie
> personnelle (voir réserve).

- **Bratislava est aux portes des Carpates.** Capitale de la Slovaquie, sur le
  Danube, elle est posée **au pied des Petites Carpates** (_Malé Karpaty_), qui
  forment l'**extrémité occidentale de l'arc carpatique** : la chaîne commence
  littéralement à Bratislava puis s'arque sur ~1 500 km (Slovaquie, Pologne,
  Ukraine, Roumanie).
  - <https://en.wikipedia.org/wiki/Carpathian_Mountains>
- **Le patronyme « Karpathy » signifie « des Carpates ».** Variante de
  **Kárpáti / Kárpáthy**, nom hongrois dérivé de _Kárpátok_ (les Carpates) — un
  **nom de lieu** (« originaire des Carpates »).
  - <https://surnames.behindthename.com/name/ka10rpa10ti>
  - <https://forebears.io/surnames/k%C3%A1rp%C3%A1ti>
  - <https://surnames.behindthename.com/name/ka10rpa10thy>
  - ⚠️ **Réserve** : c'est l'étymologie **générale** du nom. Aucune source ne
    documente que _sa_ famille tire son nom des Carpates → à présenter comme
    étymologie, pas comme généalogie.
- **Clin d'œil culturel : Dracula.** Les Carpates sont _le_ décor du _Dracula_
  de Bram Stoker (château du comte en **Transylvanie**, Roumanie). Nuance :
  Transylvanie = bout **sud-est** de l'arc ; Bratislava = bout **ouest** — même
  chaîne, ~des centaines de km d'écart. Jeu de mots géographique, **pas** un
  fait sur Karpathy.
  - <https://en.wikipedia.org/wiki/Carpathian_Mountains>

---

## 3. Cursus académique

- **Licence (BSc)** — Informatique et Physique, **Université de Toronto (2009)**.
  - <https://en.wikipedia.org/wiki/Andrej_Karpathy>
- **Master (MSc)** — **Université de Colombie-Britannique (UBC), 2011**.
  - <https://en.wikipedia.org/wiki/Andrej_Karpathy>
- **Doctorat (PhD)** — **Stanford, 2015**, sous la direction de **Fei-Fei Li**.
  - <https://cs.stanford.edu/people/karpathy/>
  - <https://en.wikipedia.org/wiki/Andrej_Karpathy>
- **Sujet de thèse : « Connecting Images and Natural Language »** — _relier les
  images au langage naturel_. Il combine un **CNN** (réseau convolutif, pour
  « voir » l'image) et un **RNN** (réseau récurrent, pour « écrire » du texte)
  afin de **générer automatiquement la description d'une image**, et même de ses
  régions une à une. Travail-phare associé : **« Deep Visual-Semantic Alignments
  for Generating Image Descriptions »** (CVPR 2015). En clair : apprendre à une
  machine à **regarder une photo et la raconter** — l'ancêtre direct des modèles
  multimodaux d'aujourd'hui.
  - <https://cs.stanford.edu/people/karpathy/>
  - <https://cs.stanford.edu/people/karpathy/cvpr2015.pdf>
- **CS231n « Convolutional Neural Networks for Visual Recognition »** — premier
  cours de deep learning de Stanford, qu'il a conçu et enseigné ; supports en
  accès libre, très largement suivis.
  - <https://cs231n.stanford.edu/>

### Qui est Fei-Fei Li (sa directrice de thèse)

Une des figures **fondatrices** de l'IA moderne, surnommée **« the Godmother of
AI »** — d'où le clin d'œil sur la slide.

- **Née le 3 juillet 1976 à Chengdu (Chine)**, émigrée aux États-Unis **à 15
  ans** (bel écho avec Karpathy, lui aussi émigré à 15 ans). Physique à
  **Princeton** (1999), **PhD à Caltech** (2005), professeure à **Stanford**
  depuis 2009.
  - <https://en.wikipedia.org/wiki/Fei-Fei_Li>
  - <https://www.britannica.com/biography/Fei-Fei-Li>
- **Créatrice d'ImageNet** — la base d'images annotées (~15 M) et sa
  compétition, considérée comme **l'un des déclencheurs de la révolution du deep
  learning** des années 2010 (c'est sur ImageNet qu'AlexNet a explosé en 2012).
  - <https://hai.stanford.edu/people/fei-fei-li>
- **Co-directrice du Stanford HAI** (Human-Centered AI), ex-**Chief Scientist
  AI/ML chez Google Cloud** (2017-2018), co-fondatrice de l'ONG **AI4ALL**
  (diversité dans l'IA), **Time Person of the Year 2025**.
  - <https://en.wikipedia.org/wiki/Fei-Fei_Li>
- ⚠️ **À confirmer** : elle aurait lancé une startup récente **World Labs**
  (« intelligence spatiale », 2024) — non re-vérifié lors de cette revue.

> **Filiation marquante** : Karpathy a été formé par **celle qui a bâti le jeu
> de données fondateur de l'IA visuelle moderne**. Sa lignée intellectuelle
> remonte donc à la source même du _deep learning_.

---

## 4. Parcours professionnel (chronologie)

| Période               | Rôle                                                    | Organisation |
| --------------------- | ------------------------------------------------------- | ------------ |
| ~2006                 | YouTubeur speedcubing (« badmephisto »)                 | YouTube      |
| 2015–2017             | Membre fondateur, research scientist                    | OpenAI       |
| 2017–2022             | Directeur IA / Autopilot Vision (recruté par Elon Musk) | Tesla        |
| fév. 2023 – fév. 2024 | Retour chercheur                                        | OpenAI       |
| juil. 2024            | Fondateur                                               | Eureka Labs  |
| mai 2026 →            | Pré-entraînement (équipe dédiée)                        | Anthropic    |

- Chronologie consolidée : <https://en.wikipedia.org/wiki/Andrej_Karpathy>
- **Avant l'IA — speedcubing.** Tutoriels Rubik's Cube sous le pseudo
  « badmephisto », fiche au World Cube Association :
  - <https://www.worldcubeassociation.org/persons/2008KARP01>
  - <https://www.speedsolving.com/wiki/index.php/Andrej_Karpathy>
- **Tesla (2017–2022).** Pilote la vision de l'Autopilot ; défend une approche
  **100 % vision** (suppression du radar), exposée à CVPR 2021 :
  - <https://venturebeat.com/business/tesla-ai-chief-explains-why-self-driving-cars-dont-need-lidar/>
- **Départ d'OpenAI (fév. 2024), « sans drama ».**
  - <https://techcrunch.com/2024/02/13/andrej-karpathy-is-leaving-openai-again-but-he-says-there-was-no-drama/>
- **Eureka Labs (juil. 2024)** — école « IA-native », cours LLM101n.
  - <https://www.inc.com/ben-sherry/openai-co-founder-andrej-karpathy-announces-eureka-labs-an-ai-education-startup.html>
  - <https://www.siliconrepublic.com/machines/andrej-karpathy-eureka-labs-ai-startup-education-platform-llm101n>

---

## 5. Œuvre pédagogique (« le grand vulgarisateur »)

- **Site & blogs** (volontairement minimalistes) :
  - <https://karpathy.ai/>
  - <http://karpathy.github.io/>
  - <https://karpathy.medium.com/>
- **« The Unreasonable Effectiveness of Recurrent Neural Networks »** (2015),
  texte fondateur de vulgarisation :
  - <http://karpathy.github.io/2015/05/21/rnn-effectiveness/>
- **« Neural Networks: Zero to Hero »** — série vidéo qui construit tout depuis
  zéro (micrograd → makemore → nanoGPT) :
  - <https://karpathy.ai/zero-to-hero.html>
  - <https://www.youtube.com/playlist?list=PLAqhIrjkxbuWI23v9cThsA9GvCAUhRvKZ>
- **Code open source** (micrograd, nanoGPT, makemore, nn-zero-to-hero, microgpt…) :
  - <https://github.com/karpathy>
  - <https://github.com/karpathy/micrograd>
- **LLM101n** (Eureka Labs) — construire un « Storyteller AI » de bout en bout :
  - <https://www.techopedia.com/eureka-labs-llm101n-edtech-by-andrej-karpathy>
- **Reconnaissance** : Time 100 AI 2024 (souligne son rôle d'éducateur de
  référence sur les réseaux de neurones) :
  - <https://time.com/collections/time100-ai-2024/7012851/andrej-karpathy/>

> Note projet : ce monorepo réimplémente précisément **microgpt** de Karpathy
> (article du 12 février 2026, gist `8627fe009c40f57531cb18360106ce95`).

---

## 6. En quoi il croit (philosophie)

- **« Software 2.0 » (2017)** — les réseaux de neurones, entraînés sur des
  données, remplacent peu à peu le code écrit à la main ; l'humain spécifie un
  objectif, le réseau apprend les poids.
  - <https://karpathy.medium.com/software-2-0-a64152b37c35>
- **« Vibe coding » (2025)** — programmer en décrivant son intention en langage
  naturel, l'IA générant le code ; terme qu'il a popularisé.
  - <https://www.ycombinator.com/library/MW-andrej-karpathy-software-is-changing-again>
  - <https://www.questera.ai/blogs/andrej-karpathy-on-vibe-coding>
- **Pédagogie « understand and build »** — comprendre et reconstruire depuis les
  fondamentaux plutôt que subir une boîte noire.
  - <https://karpathy.ai/zero-to-hero.html>

---

## 7. Risques de l'IA & horizon AGI

- **« AGI is still a decade away »** — dans le podcast de **Dwarkesh Patel
  (17 octobre 2025)**, il se positionne plus prudent que le consensus :
  problèmes « solubles mais difficiles », ~10 ans pour combler les déficits
  actuels (apprentissage continu, multimodalité, usage de l'ordinateur).
  - <https://www.dwarkesh.com/p/andrej-karpathy>
  - <https://simonwillison.net/2025/Oct/18/agi-is-still-a-decade-away/>
- **« Decade of agents » (pas « year of agents »)** — il corrige l'optimisme
  ambiant : l'agentique demandera une décennie de travail, pas une année.
  - <https://thenewstack.io/openai-co-founder-ai-agents-are-still-10-years-away/>
- Lecture « il calme le hype / la bulle » :
  - <https://fortune.com/2025/10/21/andrej-karpathy-openai-ai-bubble-pop-dwarkesh-patel-interview/>
- **Risque de sécurité / x-risk existentiel** — **non trouvé** : aucune prise de
  position publique explicite et détaillée sur le risque existentiel / la
  superintelligence n'a été identifiée dans les sources consultées. Son discours
  observable porte davantage sur des risques _à court terme_ (impact sur
  l'emploi) et sur la prudence face au hype. Son arrivée chez Anthropic (maison
  « safety-first ») est parfois lue comme un signal, **sans déclaration publique
  détaillée** pour l'étayer. _À recouper avant toute affirmation forte._
  - <https://www.geeky-gadgets.com/ai-talent-war-anthropic-karpathy/>

---

## 8. Positionnement politique

- **Non trouvé** : aucune position **partisane** publique claire (élections,
  partis) n'a été identifiée. Son fil public reste très majoritairement
  technique. Ce qui s'en approche : des critiques des **structures d'incitation
  des plateformes** (qualité longform / RSS vs « slop »), pas de la politique
  partisane.
  - <https://x.com/karpathy>
- **Recherches ciblées effectuées (2026-06-08), résultat négatif** : pas de
  prise de parole publique trouvée sur **Trump / partis / élections**, ni sur
  le **« wokisme » / DEI / political correctness**, ni de **position
  géopolitique clivante** (Chine, immigration, H-1B…). Absence de **preuve
  trouvée** — ce qui n'est pas une preuve d'absence d'opinion : il peut
  simplement les garder privées.
- **Les seuls moments « clivants » sont techno-économiques, pas partisans** :
  - **AI « job risk map » (oct. 2025), supprimée ~48 h après publication.** Il
    avait scoré l'« exposition » à l'IA de ~toutes les professions (données
    BLS) ; les métiers **bien payés / 100 % écran** ressortaient les plus
    exposés. Il l'a retirée car le score d'« exposition » (à quel point un métier
    est _digital_) était lu à tort comme une **prédiction de destruction
    d'emplois** (qui dépend de l'élasticité de la demande, etc.).
    - <https://uk.finance.yahoo.com/news/openai-co-founder-shares-list-121518685.html>
    - <https://futurism.com/artificial-intelligence/openai-cofounder-analysis-jobs-ai>
  - **Intérêt « Green AI » (2019)** : partage de lectures « Green AI vs Red AI »
    et « Tackling Climate Change with ML » — **curiosité technique**, pas une
    position de politique environnementale.
    - <https://x.com/karpathy/status/1193700794597462016>

> Donc : prudence. Présenter Karpathy comme « engagé politiquement » serait, en
> l'état des sources, **non étayé**. Sur un axe gauche / droite / centre /
> populiste / antipopuliste / apolitique / discret, la seule case **sourçable**
> est **« discret / apolitique »** (publiquement) — c'est ce que retient la
> slide. Ses rares sujets « chauds » sont **technologiques et économiques**
> (impact emploi, incitations des plateformes, bulle IA), pas partisans.

---

## 9. Relations « sulfureuses » : Musk, Altman, OpenAI/Anthropic

- **Elon Musk (Tesla).** Recruté personnellement par Musk en 2017 ; propos
  publics très positifs de Karpathy sur le style de management de Musk.
  - <https://en.wikipedia.org/wiki/Andrej_Karpathy>
  - <https://news.ycombinator.com/item?id=43093446>
- **Tension 2023** (Musk vs OpenAI) puis **réconciliation** affichée (« toujours
  bienvenu chez Tesla ») :
  - <https://www.teslarati.com/tesla-ai-director-karpathy-comes-back-always-welcome-elon-musk/>
- **Sam Altman / OpenAI.** Deux passages chez OpenAI ; départ 2024 décrit
  **sans conflit** (« no drama ») :
  - <https://techcrunch.com/2024/02/13/andrej-karpathy-is-leaving-openai-again-but-he-says-there-was-no-drama/>
- **Contexte Musk ↔ Altman** (d'alliés à rivaux), toile de fond de la guerre des
  talents où Karpathy est un objet convoité :
  - <https://www.cnbc.com/2026/05/18/how-elon-musk-and-sam-altman-went-from-besties-to-bitter-rivals.html>

> Synthèse : pas de « scandale » documenté impliquant Karpathy lui-même ; il
> traverse les rivalités OpenAI/Tesla/Anthropic en gardant des relations
> publiquement cordiales. Le « sulfureux » tient au **contexte** (Musk, Altman),
> pas à des prises de position personnelles tranchées.

---

## 10. Pourquoi « le sage » humble et accessible

- **Interviews de fond** : Lex Fridman #333 (2022), Dwarkesh Patel (2025).
  - <https://lexfridman.com/andrej-karpathy/>
  - <https://www.youtube.com/watch?v=cdiD-9MMpb0>
  - <https://www.dwarkesh.com/p/andrej-karpathy>
- **Réputation de « grand traducteur »** de l'IA pour le grand public — il
  enseigne, blogue, code en public plutôt que de rester dans les papiers denses.
  - <https://time.com/collections/time100-ai-2024/7012851/andrej-karpathy/>
- **Continuité pédagogique** : du speedcubing (décomposer en fondamentaux) au
  deep learning « from scratch », même méthode — comprendre avant d'utiliser.
  - <https://www.speedsolving.com/wiki/index.php/Andrej_Karpathy>

---

## Bibliographie (sources distinctes)

1. <https://techcrunch.com/2026/05/19/openai-co-founder-andrej-karpathy-joins-anthropics-pre-training-team/>
2. <https://www.axios.com/2026/05/19/anthropic-openai-karpathy-andrej-claude>
3. <https://www.cnbc.com/2026/05/19/anthropic-hires-openai-cofounder-andrej-karpathy-former-tesla-ai-lead.html>
4. <https://gizmodo.com/openai-cofounder-andrej-karpathy-joins-anthropic-as-sam-altmans-fortunes-turn-2000760674>
5. <https://en.wikipedia.org/wiki/Andrej_Karpathy>
6. <https://cs.stanford.edu/people/karpathy/>
7. <https://cs231n.stanford.edu/>
8. <https://time.com/collections/time100-ai-2024/7012851/andrej-karpathy/>
9. <https://www.worldcubeassociation.org/persons/2008KARP01>
10. <https://www.speedsolving.com/wiki/index.php/Andrej_Karpathy>
11. <https://venturebeat.com/business/tesla-ai-chief-explains-why-self-driving-cars-dont-need-lidar/>
12. <https://techcrunch.com/2024/02/13/andrej-karpathy-is-leaving-openai-again-but-he-says-there-was-no-drama/>
13. <https://www.inc.com/ben-sherry/openai-co-founder-andrej-karpathy-announces-eureka-labs-an-ai-education-startup.html>
14. <https://www.siliconrepublic.com/machines/andrej-karpathy-eureka-labs-ai-startup-education-platform-llm101n>
15. <https://karpathy.ai/>
16. <http://karpathy.github.io/>
17. <https://karpathy.medium.com/>
18. <http://karpathy.github.io/2015/05/21/rnn-effectiveness/>
19. <https://karpathy.ai/zero-to-hero.html>
20. <https://www.youtube.com/playlist?list=PLAqhIrjkxbuWI23v9cThsA9GvCAUhRvKZ>
21. <https://github.com/karpathy>
22. <https://github.com/karpathy/micrograd>
23. <https://www.techopedia.com/eureka-labs-llm101n-edtech-by-andrej-karpathy>
24. <https://karpathy.medium.com/software-2-0-a64152b37c35>
25. <https://www.ycombinator.com/library/MW-andrej-karpathy-software-is-changing-again>
26. <https://www.questera.ai/blogs/andrej-karpathy-on-vibe-coding>
27. <https://www.dwarkesh.com/p/andrej-karpathy>
28. <https://simonwillison.net/2025/Oct/18/agi-is-still-a-decade-away/>
29. <https://thenewstack.io/openai-co-founder-ai-agents-are-still-10-years-away/>
30. <https://fortune.com/2025/10/21/andrej-karpathy-openai-ai-bubble-pop-dwarkesh-patel-interview/>
31. <https://www.geeky-gadgets.com/ai-talent-war-anthropic-karpathy/>
32. <https://x.com/karpathy>
33. <https://news.ycombinator.com/item?id=43093446>
34. <https://www.teslarati.com/tesla-ai-director-karpathy-comes-back-always-welcome-elon-musk/>
35. <https://www.cnbc.com/2026/05/18/how-elon-musk-and-sam-altman-went-from-besties-to-bitter-rivals.html>
36. <https://lexfridman.com/andrej-karpathy/>
37. <https://www.youtube.com/watch?v=cdiD-9MMpb0>
38. <https://en.wikipedia.org/wiki/Carpathian_Mountains>
39. <https://surnames.behindthename.com/name/ka10rpa10ti>
40. <https://forebears.io/surnames/k%C3%A1rp%C3%A1ti>
41. <https://surnames.behindthename.com/name/ka10rpa10thy>
42. <https://cs.stanford.edu/people/karpathy/cvpr2015.pdf>
43. <https://en.wikipedia.org/wiki/Fei-Fei_Li>
44. <https://www.britannica.com/biography/Fei-Fei-Li>
45. <https://hai.stanford.edu/people/fei-fei-li>
46. <https://uk.finance.yahoo.com/news/openai-co-founder-shares-list-121518685.html>
47. <https://futurism.com/artificial-intelligence/openai-cofounder-analysis-jobs-ai>
48. <https://x.com/karpathy/status/1193700794597462016>

---

_Fiche établie pour un public débutant/collégien : sur la slide, on ne garde que
l'inspirant et le vérifié ; les zones grises (politique, x-risk) restent ici,
explicitement marquées « non trouvé »._
