// ═══════════════════════════════════════════════════════════════════════════
// Dictionnaire FR — DONNÉE PURE, forme de RÉFÉRENCE de toutes les clés.
// ═══════════════════════════════════════════════════════════════════════════
// `type Dict = typeof fr` force `en` (en.ts) à porter EXACTEMENT les mêmes clés
// (une clé manquante d'un côté = erreur de compilation → anti-oubli).
//
// Règle de fidélité : chaînes recopiées VERBATIM depuis les anciennes pages FR —
// elles ont été réglées au caractère près (un mot trop long casse une mise en
// page). On ne reformule jamais ici. Une clé par page (slug du fichier .md).

export const fr = {
  // Écran-titre (slides.md).
  cover: {
    title: "MicroGPT de Karpathy",
    shareLead: "Partageons la pilule",
    sharePill: "rouge !",
  },
  // 1-le-sage-et-le-papillon
  leSage: {
    title: "Le papillon et le sage",
    quote:
      "« À son réveil, il ne savait plus s'il était un homme qui rêvait d'un papillon, ou un papillon rêvant qu'il était un homme. »",
    attribution: "Zhuangzi (莊子), De l’égalité des choses (300 av. J.-C.)",
  },
  // Libellés SFX partagés par plusieurs slides.
  common: {
    mathBoss: "La boss des maths",
  },
  // 1a-singularite
  singularite: {
    title: "Papillon",
    subtitle: "Rencontre du 3e type",
    azur: "Voici Azur",
    butler: "mon <strong>OpenClaw</strong>, mon ami ?",
    psychosis: "AI Psychosis : soif de savoir",
    discovery: "Karpathy parle de Dobby",
  },
  // 1c-l-homme-des-carpates
  carpates: {
    subtitle: "Andrej Karpathy - L'homme des Carpates",
    journey:
      "Né à Bratislava (Slovaquie) en 1986<br /> → thèse à <strong>Stanford</strong> (Californie)<br /> sous la dir. de <strong>Fei-Fei Li</strong><br /> → cofondateur d'<strong>OpenAI</strong><br /> → Autopilot de <strong>Tesla</strong><br />  → <strong>Anthropic</strong> (mai 2026)",
  },
  // 1d-microgpt-image
  microgptImage: {
    alt: "microgpt.py — le code complet",
  },
  // 1e-exec-microgpt — la capture montre `vp run gpt` (le microgpt.py ORIGINAL
  // de Karpathy lancé via mise/python), pas le runner TS.
  execMicrogpt: {
    alt: "Sortie de vp run gpt (le microgpt.py original de Karpathy)",
  },
  // 1f-butterfly-exec
  butterflyExec: {
    alt: "Exécution du GPT papillon — génération de noms",
  },
  // 2a-neurones
  neurones: {
    title: "Neurones",
    lead: "Large Language Models (LLM) - inspiration neurobiologique… mais résultat :",
    aiPanel:
      "<strong>Intelligence Artificielle ?</strong><br />Capacité à résoudre des problèmes, émergeant d'un TRÈS GRAND réseau de neurones artificiels.",
    gen: "Génère du contenu",
    pretrain: "Pré-entraîné sur immense corpus",
    transform: "Transforme progressivement l’information en poids",
  },
  // 2b-transformes
  transformes: {
    title: "Transformés",
    band: 'Une archi "simple", ubiquitaire, qui donne des',
    superpowers: "super-pouvoirs !",
  },
  // 2c-briques
  briques: {
    title: "Briques",
    capDataset: "Noms de papillons",
    capTokenizer: "Découpe noms en petites lettres",
    capParameters: "Boutons réglables",
    capAutograd: "Espionne les erreurs",
    capOptimizer: "Adam tourne les boutons",
    capTraining: "Deviner, se tromper, ajuster",
    capInference: '"Rêver" de nouveaux noms',
    archi: "Architecture Transformer",
    cite: "« Attention Is All You Need » — Vaswani, Shazeer, Parmar et al. · Google, 2017",
  },
  // 3a-nettoyer
  nettoyer: {
    title: "Nettoyeur",
    fuel: "Carburant",
    li1: "Flux de <strong>tokens</strong>: pixels, mots, lettres…",
    li2: "Microgpt : <strong>~30 000 prénoms</strong>",
    li3: "Butterflygpt : <strong>~6 000 noms de papillons</strong>",
    always:
      "Toujours <strong>plus</strong> de données, plus <strong>variées</strong>, plus <strong>propres</strong> ",
  },
  // 4a-atomiser
  atomiser: {
    title: "Atomiseur",
    vocab: "Vocabulaire",
    li1: "Liste de <strong>tokens</strong> uniques",
    li2: "LLM manipulent des <strong>nombres</strong>, leurs ids",
    li3: "<strong>Microgpt :</strong> 1 id par lettre de l’alphabet",
    li4: "<strong>Butterflygpt :</strong> + espace + accents + tiret + apostrophe",
    bosSpan: " = Frontière des noms <code>[BOS, a, z, u, r, BOS]</code>",
  },
  // 5a-parameters-def
  parametersDef: {
    title: "VECTEUR",
    intro:
      "Paramètre = poids = <strong>morceau de connaissance</strong> - ex :<code>-0.19</code><br />LLM = <strong>Matrices</strong> de <strong>milliards de params</strong> figés",
    sfxDimensions: "Autres dimensions",
    dimToken:
      "Un token (« a », « z »...) → <strong>vecteur</strong>: <code>[0.23, 0.61, -0.17, ...]</code>",
    dimPosition:
      "Une position dans le nom → <strong>vecteur</strong>: <code>[-0.19, -0.76, ...]</code>",
    dimDirections: "Autant de <strong>directions</strong> à enrichir",
    sfxGalaxy: "Galaxie",
    galGpt4: "<strong>GPT4</strong> = <strong>1 760 milliards</strong> de params",
    galMilkyway: "Voie lactée = 300 milliards d’⭐",
    galBrain: "🧠 = ~86 milliards de neurones",
    matContext: "- contexte",
    matDecide: "- trancher",
    matScores: "- scores calculés",
  },
  // 5aa-tirage-gaussien
  tirageGaussien: {
    title: "Le tirage gaussien",
    gaussLabel: "Je me gausse",
    gaussSum: "Somme des petits <strong>hasards </strong> autour d’une tendance forte",
    gaussFact:
      "Constat <strong>physique</strong> ; formalisé en <strong>maths</strong><br><br><strong>Loi de Gauss</strong> : un étalement doux",
    bmU: "<strong>u<sub>1</sub></strong>, <strong>u<sub>2</sub></strong> = deux nombres au hasard",
    bm1: '<strong>1.</strong> <span class="codechip">√(−2·<span class="fn">ln</span> u<sub>1</sub>)</span> = <strong style="color: var(--teal)">distance aplanie</strong>',
    bm2: '<strong>2.</strong> <span class="codechip"><span class="fn">cos</span>(2π·u<sub>2</sub>)</span> = <strong style="color: var(--crimson)">angle choisi</strong>',
    bm3: '<strong>3.</strong> <span class="codechip">× σ</span> = <strong style="color: var(--amber)">petit σ → petite cloche</strong>',
    btnThrow: "🎯 lancer",
    shots: "tirs",
    radius: "rayon",
    formula: "Formule",
  },
  // 6a-mort-vivant
  mortVivant: {
    title: "Mort-vivant",
    intro:
      "À l’entraînement, on <strong>déverrouille</strong> les params : <ul> <li><strong>armure bionique</strong> : chaque poids devient un <strong>Node</strong> de graphe</li> <li>chaque opération est <strong>mémorisée</strong></li> </ul> Entraînement fini : retour aux <strong>params verrouillés</strong>.",
    sfxDead: "mort",
    inference: ": inférence",
    deadReadonly: "<strong>Lecture seule</strong>",
    deadFrozen: "Valeurs params figées",
    deadFile: "LLM: <strong>1 fichier de poids</strong>",
    deadHarness: "Un <strong>harnais</strong> pour le reste",
    sfxAlive: "vivant",
    training: ": entraînement",
    aliveWrite: "Lecture et <strong>écriture</strong>",
    aliveRam: "Mise en RAM d’un graphe de params",
    aliveForward: "<strong>Passe avant</strong>: chaque opération est espionnée",
    aliveBackward: "<strong>Passe arrière</strong>: espions remontent contributions",
  },
  // 6b-passe-avant
  passeAvant: {
    title: "La passe avant",
    lead: "Un vecteur x se transforme : on construit un graphe d’opérations",
    predAdd: 'Additionner embeddings : <span class="codechip">+</span>',
    predAttn: 'Activer l’attention : <span class="codechip">*</span>',
    predPerceptron:
      'Passer aux perceptrons : <span class="codechip"><span class="fn">relu()</span></span>',
    predLoss: "<strong>Loss</strong> : erreur, <strong>surprise</strong> du modèle",
    sfxBlame: "Blâme",
    blameNotes: "Bloc-notes: pas utile pour l’instant",
    blameGradients:
      "On note quoi ? <br>Des <strong>gradients</strong> locaux = <strong>dérivées ∂</strong>",
  },
  // 6e-passe-avant-code
  passeAvantCode: {
    codeTag: "(la passe avant)",
  },
  // 6f-passe-arriere
  passeArriere: {
    title: "La passe arrière",
    lead: "On repart de la dernière opération et on <strong>distribue le blâme</strong>",
    p1Label: "1 · On part du sommet",
    p1a: "L'erreur finale se donne <strong>∂ 1</strong>",
    p1b: "La <strong>backpropagation</strong> commence",
    p1c: "Prélude à la <strong>descente de gradient</strong>",
    p2Label: "2 · On propage l’erreur ",
    p2a: "<strong>Effet papillon</strong> à l’envers",
    p2b: "Cumul des <strong>∂<br />(gradients locaux)</strong>",
    p2c: "<strong>Règle de la chaîne</strong>",
    p3Label: "3 · On donne les responsabilités",
    p3a: "<em>In fine</em> chaque <strong>params</strong> tient son gradient d’erreur",
    p3b: "L’<strong>optimiseur</strong> update les poids",
  },
  // 6g-regle-chaine
  regleChaine: {
    title: "La règle de la chaîne",
    defLabel: "Définition",
    defText:
      "La <strong>règle de la chaîne</strong> : le taux total est le <strong>produit</strong> des taux le long du chemin.",
    formulaLabel: "Formule",
    so: "Donc",
    fastA: "va",
    fastB: "plus vite que",
    alsoLabel: "et aussi…",
    alsoText:
      "<strong>Plusieurs chemins</strong> ? Ça <strong>s'additionne</strong><br /><code>*</code> le long d'un chemin, <code>+</code> entre les chemins <br/> <br/> Voir annexes",
  },
  // 6i-passe-arriere-code
  passeArriereCode: {
    codeTag: "03-autograd.ts — la passe arrière",
  },
  // 7a-pipeline
  pipeline: {
    puritySfx: "pureté",
    modelPure: "Le modèle est une <strong>fonction pure</strong>",
    gptSig: "gpt (lettre, position, paramètres, cache)",
    scoresNote: "<strong>scores</strong> = toutes les lettres sont candidates",
    cacheSfx: "cache-cache",
    cacheLi1: "utile aux matrices d'<strong>attention</strong>",
    cacheLi2: "seul mécanisme connaissant les lettres précédentes",
    journey: "L’aventure d’un vecteur",
    box1Title: "① vecteurs d’embeddings",
    box1Sub: "« lettre z » + « position 2 »",
    box2Title: "② matrices d’attention",
    box2Sub: "liens entre lettres lointaines",
    box3Sub: "détecteurs de motifs → élagueurs",
    box4Title: "④ vecteurs de projection",
    box4Sub: "1 score par lettre",
  },
  // 7b-embeddings
  embeddings: {
    diveSfx: "Plongeons",
    li1: "Le texte devient des maths",
    li2: "<strong>Embedding</strong> = <em>plonge</em> chaque <strong>lettre</strong> en vecteur <strong>+</strong> son vecteur <strong>position</strong>",
    li3: 'aucune connexion entre lettres :<br /><span class="tag">a z u r</span> = <span class="tag">r u z a</span>',
  },
  // 7ba-softmax
  softmax: {
    defLabel: "Définition",
    def1: "Transforme des valeurs en <strong>probabilités</strong><br /><strong>Accentue</strong> le plus grand",
    def2: "La somme est égale à 100%",
    formulaLabel: "Formule",
  },
  // 7c-attention
  attention: {
    mindfulnessSfx: "Pleine conscience",
    query:
      '<strong>query</strong> : je cherche quoi ? <ol class="text-xs mt-0" style="padding:0; padding-left: 1.5rem;"><li style="margin: 0; padding: 0;"><span class="codechip" style="margin: 0.5rem 0 0 0;">vecQ = <span class="fn">linear</span>(vecX, matQ)</span></li><li style="margin: 0; padding: 0;"><em>(= somme des produits de <span class="codechip">vecX</span> et <span class="codechip">matQ</span>)</em></li></ol>',
    keys: '<strong style="color: var(--teal)">keys</strong> <span class="codechip">vecK</span> : je cherche où ?',
    weights:
      'Quels <strong style="color: var(--teal)">keys</strong> matchent ma <strong>query</strong> ?<br /><span class="codechip">vecWeights = <span class="fn">Softmax</span>(vecQ · chaque vecK)</span>',
    values:
      '<strong style="color: var(--amber)">values</strong> <span class="codechip">vecV</span> : je trouve quoi ? <ul class="text-xs" style=" padding-left: 1.5rem;"></ul>',
    context:
      'Quelles <strong style="color: var(--amber)">values</strong> sont modulées ?<br /><span class="codechip">vecContext = vecWeights · chaque vecV</span>',
    residual:
      'Résidu d’attention<br /><span class="codechip">vecAttn = <span class="fn">linear</span>(vecContext, matO)</span>',
    headsSfx: "têtes",
    splitP:
      'On découpe <span class="codechip">vecQ</span>/<span class="codechip">vecK</span>/<span class="codechip">vecV</span> en tranches égales :',
    head0: "tête 0",
    head1: "tête 1",
    headsNote:
      " → Chaque tête fait attention à <strong>ses tranches</strong> <br /> → On <strong>concat</strong> tout à la fin ",
    kvNote:
      '<span class="codechip">vecK</span> et <span class="codechip">vecV</span> <strong>mémorisés</strong><br /><br />→ <strong>les tokens lointains comptent</strong>',
  },
  // 7f-mlp
  mlp: {
    clarify: "Clarifier les concepts",
    before: "Avant",
    after: "Après",
    twoLayers: "<strong>2 couches</strong> et un <strong>coude</strong> :",
    li1: '<strong style="color: var(--teal)">fc1  →  "dépliage"</strong> : plus de place pour des motifs',
    li2: '<strong style="color: var(--crimson)">coude (ReLU)</strong> : on garde ce qui s\'allume',
    li3: '<strong style="color: var(--amber)">fc2 → repliage</strong> : motifs attrapés dans un résidu',
    fcNote: "<strong>fc</strong> = <em>fully connected</em>, couche dense",
    tag: "08-mlp.ts — version simplifiée",
  },
  // 7d-rms
  rms: {
    title: "La moyenne quadratique",
    airPressure: "<strong>Pression de l'air</strong> dans un micro : ",
    pushed: 'poussé = <strong style="color: var(--crimson)">+</strong>',
    pulled: 'tiré = <strong style="color: var(--crimson)">−</strong>',
    meanZero:
      "<strong>Moyenne ≈ 0</strong>, même en chantant fort !<br />La <strong>RMS</strong> calcule un <strong>vrai volume</strong>",
    formula: "Formule",
    formulaText: "RMS = √( moyenne des carrés )",
    pushedAxis: "+ poussé",
    pulledAxis: "− tiré",
    meanLabel: "moyenne ≈ ",
    normBefore: " — Les points ÷ ",
    normAfter: " sont normalisés autour de ",
  },
  // 7h-loss
  loss: {
    sfx: "cross-entropy /  Erreur",
    intro:
      '<strong>27 probabilités, une par lettre</strong><br/> Loss = <strong>UN dernier chiffre</strong> : <span class="codechip"><span class="fn">−ln</span>(<span class="num">vraie lettre</span>)</span><br /> → à quel point on s\'est <strong>trompé</strong> ?',
    surprise:
      'Le <span class="codechip">−ln(p)</span> mesure la <strong>surprise</strong><br /> Prédiction juste → <strong>0 loss</strong><br /> Hésitant → ~0,7 loss<br /> sûr & faux → <strong>3+ loss</strong><br />',
  },
  // 8a-entrainement
  entrainement: {
    title: "Entraînement",
    zip: "Entraîner = un <strong>zip géant</strong> et <strong>lossy</strong> ?",
    moves: "5 gestes, répétés 1000 fois",
    s1: "<strong>①</strong> prendre un nom",
    s2: "<strong>②</strong> passe avant sur ses lettres",
    s3: "<strong>③</strong> mesurer la <strong>loss</strong>",
    s4: "<strong>④</strong> passe arrière → gradients",
    s5: "<strong>⑤</strong> ajuster les paramètres (Adam)",
  },
  // 8b-adam
  adam: {
    stepByStep: "Pas à pas",
    pipe1: "un nom dans <br> le dataset",
    pipe2: 'passe avant<br><span style="opacity: .85">gpt(params) → scores</span>',
    pipe3: 'loss = l\'erreur<br><span style="opacity: .85">−ln p(« u »)</span>',
    pipe4: 'passe arrière<br><span style="opacity: .85">peuple chaque p.grad</span>',
    pipe5:
      'ADAM<br><span style="font-weight: 400">chaque p.data −= gradient (lissé et freiné)</span>',
    gradient:
      "Interpréter les scores et pousser chaque param dans le sens de son <strong>gradient</strong>",
  },
  // 8c-train-code
  trainCode: {
    title: "Entraîneur",
    surpriseLabel: "La loss = la « surprise »",
    lossFormula:
      '<span class="codechip">−<span class="fn">log</span> p(bonne lettre)</span> <br />On cherche un équilibre entre <strong>hasard</strong> et <strong>déterminisme</strong>',
  },
  // 9a-inference
  inferenceA: {
    title: "Pendu",
    intro:
      '<p>Modèle = <strong>2 fichiers</strong></p><ul style="color: var(--slate)"><li>les <strong>poids</strong> (morts)</li><li>le <strong>run</strong> (le programme qui les anime)</li></ul><p>Pioche un token, relance en direction d\'un autre token, repioche, etc.</p>',
    sfxGenerator: "Générateur",
    genFrozen:
      "Paramètres <strong>gelés</strong> : plus rien à apprendre.<br> On déroule la passe avant en boucle",
    startStop:
      '<div>départ : <span class="codechip">BOS</span> (« début »)</div><div>arrêt : <span class="codechip">BOS</span> (« fin »)</div>',
    sfxTemperature: "Température",
    tempDesc:
      'Le <strong>bouton de créativité</strong> du modèle<br> On <strong>divise les scores</strong> par <span class="codechip">temperature</span>',
    tempScale:
      '<div><strong>≈ 0</strong> — toujours le plus probable (réaliste)</div><div><strong style="color: var(--crimson)">0,5</strong> — conservateur (rêveur)</div><div><strong>&gt; 1</strong> — audacieux (cauchemardesque)</div>',
    conclusion:
      "L'inférence : comme un entraînement… <strong>sans autograd, sans passe arrière</strong>. Il ne reste que la lettre prédite",
  },
  // 9b-inference-code
  inferenceCode: {
    tag: "13-sample.ts — générer, lettre par lettre",
  },
  // 9c-inference-live
  inferenceLive: {
    title: "Génération",
    dream:
      "Le modèle <strong>rêve</strong> (hallucine) des noms de papillons <strong>qu'il n'a jamais vus</strong><br><br> Il a appris leur « musique ».",
    temperature: "température",
  },
  // 9d-conclusion
  conclusion: {
    story:
      "GPT, c’est l’aventure d’un vecteur de token qui essaye d’atteindre son promis. Il gravit des montagnes, descend des vallées, puis enfin, rencontre son bien-aimé, et ne l’oublie jamais.",
  },
  // 10b-merci
  merci: {
    title: "Merci",
    sfxSponsors: "Les sponsors",
    sponsors:
      "<strong>Shodo Rennes</strong> &amp; <strong>Actian Zeenea</strong> — pour les ressources, les répétitions, les encouragements et les précieux conseils",
    sfxLoved: "Les proches",
    loved:
      '<div><strong>Sonemany Nigole</strong> — pour la patience, le soutien et la vulgarisation</div><div class="mt-1"><strong>Kelly Resche</strong> — la boss des maths, pour la relecture des slides</div>',
    sfxMachines: "Les machines",
    machines:
      "Mon agent majordome <strong>« Azur »</strong> et <strong>Claude Opus&nbsp;4.8</strong>",
    sfxInspirations: "Les inspirations",
    inspirations:
      '<div><strong>A. Karpathy</strong> — pour ses partages et sa pédagogie.</div><div class="mt-1"><strong>Dave Gibbons</strong> — pour le webtoon Matrix qui illustre ces slides</div>',
  },
  // 10c-bibliographie
  bibliographie: {
    title: "Bibliographie",
    slidesOnline:
      'Ces slides sont en ligne sur <a href="https://slides.gods.academy/microgpt-ts/fr">https://slides.gods.academy/microgpt-ts/fr</a>',
    sfxSource: "La source",
    source:
      '<div>L\'<strong><a href="https://karpathy.github.io/2026/02/12/microgpt/">article microgpt</a></strong> de Karpathy</div><div class="mt-1">Le <strong><a href="https://gist.github.com/karpathy/8627fe009c40f57531cb18360106ce95">gist du code original</a></strong></div><div class="mt-1"><strong><a href="https://github.com/iamyb/microgpt-excel">microgpt-excel</a></strong> — le même GPT, cellule par cellule, dans un tableur</div><div class="mt-2">Le <strong><a href="https://github.com/ltruchot/butterfly-gpt">code source de butterfly-gpt</a></strong> et de ces slides</div>',
    sfxPodcasts: "Les podcasts",
    podcasts:
      '<div><strong><a href="https://www.dwarkesh.com/p/andrej-karpathy">Karpathy chez Dwarkesh Patel</a></strong></div><div class="mt-2"><strong><a href="https://lexfridman.com/andrej-karpathy/">Karpathy chez Lex Fridman</a></strong></div><div class="mt-2"><strong><a href="https://www.superdatascience.com/podcast">Super Data Science</a></strong></div>',
    sfxCuisine: "La cuisine de ce projet",
    cuisine:
      '<div><strong>TypeScript</strong> — la réécriture, zéro dépendance</div><div><strong><a href="https://viteplus.dev/">Vite+</a></strong> — la toolchain unifiée</div><div><strong><a href="https://sli.dev/">Slidev</a></strong> — ces slides</div><div><strong><a href="https://data-star.dev/">Datastar</a></strong> — l\'interactivité des démos</div><div><strong><a href="https://threejs.org/">Three.js</a></strong> — le nuage de paramètres 3D</div>',
    licence:
      'Contenu sous <strong><a href="https://creativecommons.org/licenses/by-nc-sa/4.0/deed.fr">CC BY-NC-SA 4.0</a></strong>, code sous <strong><a href="https://polyformproject.org/licenses/noncommercial/1.0.0/">PolyForm Noncommercial 1.0.0</a></strong> ; le microgpt de Karpathy reste sa propriété intellectuelle exclusive (<a href="https://gist.github.com/karpathy/8627fe009c40f57531cb18360106ce95">gist public</a>, notice <a href="https://github.com/karpathy/micrograd/blob/master/LICENSE">MIT de micrograd</a>). Toutes les images de « Butterfly » de Dave Gibbons ont été collectées sur des sites de fans partageant des extraits sous licence CC-BY-SA et sur Internet Archive (elles ont été publiées sans paywall pendant la promotion des films Matrix), mais je n\'en possède pas la licence ni le droit d\'exploitation. Le contenu de cette présentation est un « MOOC » en libre accès qu\'il est interdit d\'utiliser à des fins commerciales. Je n\'ai aucun droit sur ces extraits d\'images et suis prêt à les retirer à la moindre demande (mes mails sont restés sans réponse) : il en va de même pour quiconque utiliserait cette présentation.',
  },

  // annexe-titre
  annexeTitre: {
    sfx: "ANNEXES",
  },

  // annexe-schema — résumé visuel du forward pass (une passe de gpt()),
  // inspiré du classeur microgpt-excel. Les identifiants de code (tokenEmb,
  // attn_wq…) restent en anglais dans les DEUX langues (décision actée).
  annexeSchema: {
    title: "Le modèle en un schéma",
    hint: 'Une passe avant complète, brique par brique — <strong>survole chaque brique</strong> pour découvrir son rôle. Schéma inspiré de <strong><a href="https://github.com/iamyb/microgpt-excel">microgpt-excel</a></strong> : le même GPT, cellule par cellule, dans un tableur.',
    colIn: "① les embeddings",
    colAttn: "② l'attention",
    colMlp: "③ le perceptron (MLP)",
    colOut: "④ la sortie",
    brickInput: "« z » · position 2",
    subInput: "la lettre courante",
    tipInput:
      "Tout ce que voit le modèle à ce pas : <strong>une lettre</strong> et <strong>sa position</strong>. Les lettres précédentes, elles, vivent déjà dans le cache K/V.",
    tipTokenEmb:
      "La table des <strong>fiches-vecteurs</strong> : une ligne de 16 nombres par lettre du vocabulaire (44). Apprise pendant l'entraînement — c'est ici que « z » devient des maths.",
    tipPositionEmb:
      "La même idée pour la <strong>position</strong> : un vecteur par place possible (64). Sans lui, « a z u r » = « r u z a ».",
    subX: "le vecteur courant (16 nombres)",
    tipX: "L'<strong>aventurier</strong> du pipeline : la somme des deux embeddings. Ces 16 nombres résument « z en position 2 » et seront retouchés d'étape en étape.",
    tipRmsIn:
      "<strong>rmsnorm</strong> ramène le volume du vecteur autour de ~1 : les additions et multiplications répétées font dériver la taille des nombres, on la remet d'aplomb avant le bloc.",
    tipRmsAttn:
      "Normalisation <em>pre-norm</em> : l'attention reçoit une copie de x au volume ~1. L'original de x, lui, attend au bord du résiduel.",
    tipWq:
      "Alias « matQ » des slides — fabrique la <strong>query</strong> : « je cherche quoi ? ».",
    tipWk:
      "Alias « matK » — fabrique la <strong>key</strong> : « je cherche où ? ». La clé de « z » part au cache pour les lettres suivantes.",
    tipWv:
      "Alias « matV » — fabrique la <strong>value</strong> : « je trouve quoi ? », l'information à transmettre si la clé matche.",
    brickCache: "cache K/V",
    tipCache:
      "La <strong>mémoire</strong> : les clés et valeurs de toutes les lettres déjà vues. C'est le seul mécanisme qui connaît le passé.",
    subAttn: "4 têtes",
    tipHeads:
      "Le cœur : softmax(vecQ · chaque vecK) pondère les values du passé → un vecteur contexte. Découpée en <strong>4 têtes</strong> qui regardent chacune leurs tranches, concaténées à la fin.",
    tipWo:
      "Alias « matO » — recombine ce que les 4 têtes rapportent en une seule <strong>correction</strong> de 16 nombres.",
    brickResidual: "+ résiduel",
    tipResidual1:
      "On ne remplace jamais x : on <strong>garde x et on ajoute la correction</strong> de l'attention. Voie express pour le gradient → réseaux profonds entraînables.",
    tipRmsMlp:
      "Même rituel qu'avant l'attention : copie de x au volume ~1 pour le MLP, l'original attend au bord du résiduel.",
    tipFc1:
      "Le <strong>dépliage</strong> : 16 → 64 nombres, plus de place pour détecter des motifs.",
    tipRelu:
      "Le <strong>coude</strong> : les négatifs passent à 0 — on ne garde que ce qui s'allume.",
    tipFc2:
      "Le <strong>repliage</strong> : 64 → 16, les motifs attrapés repartent dans une correction.",
    tipResidual2:
      "Deuxième résiduel : x + la correction du MLP. Le bloc ② + ③ pourrait être empilé N fois ; ici, une seule couche suffit.",
    tipOutputProj:
      "Alias « lm_head » chez Karpathy — la dernière projection : les 16 nombres de x deviennent <strong>44 scores</strong>, un par lettre du vocabulaire (les « logits »).",
    brickScores: "scores",
    subScores: "1 par lettre (44)",
    tipScores:
      "Des scores bruts : <strong>toutes les lettres sont candidates</strong> pour la position suivante — les grandes valeurs sont les favorites.",
    tipSoftmax:
      "Transforme les scores en <strong>probabilités</strong> (somme = 100 %) en accentuant les plus grands. La <strong>température</strong> se règle juste avant.",
    brickNext: "🎲 lettre suivante",
    tipNext:
      "On <strong>tire au sort</strong> selon ces probabilités, et la lettre gagnée repart en ① — c'est la boucle de génération.",
  },

  // annexe-en-vrai
  annexeEnVrai: {
    title: "Et « en vrai » ?",
    lead: "microgpt a <strong>toute l'essence</strong> d'un GPT. C'est déjà GPT-2 — juste <strong>simplifié</strong>, et minuscule. Le reste, c'est de l'<strong>ingénierie d'échelle</strong>.",
    labelSimpler: "microgpt = GPT-2 en plus simple",
    amberNote:
      '<span class="codechip"><span class="ty">RMSNorm</span></span> au lieu de LayerNorm · <span class="tag">pas de biais</span> · <span class="codechip"><span class="ty">ReLU</span></span> au lieu de GeLU. À l\'échelle, on fait l\'inverse : on <strong>rajoute</strong> des briques (RoPE, GQA, MoE, activations gated…).',
    sfxBuild: "CONSTRUIRE LE MODÈLE",
    data: "non pas ~5 900 noms mais des <strong>milliers de milliards</strong> de tokens, filtrés.",
    tokenizer: "du <strong>BPE</strong> (~100 000 tokens), pas des lettres.",
    autograd: "des <strong>tenseurs sur GPU</strong> (PyTorch, FlashAttention), pas des scalaires.",
    architecture: "<strong>centaines de milliards</strong> de params, 100+ couches.",
    sfxScale: "LE PASSER À L'ÉCHELLE",
    training: "gros batchs, precision mixte, <strong>milliers de GPU</strong> des mois durant.",
    optimization: "lois d'échelle (<strong>Chinchilla</strong>), réglages au cordeau.",
    postTraining:
      "<strong>SFT</strong> (conversations) puis <strong>RL</strong> (feedback) → un chatbot.",
    inference: "batching, <strong>vLLM</strong>, quantization, décodage spéculatif.",
  },

  // annexe-le-harnais
  annexeLeHarnais: {
    title: "Tout… et rien",
    lead: "Le modèle que tu viens de voir <strong>prédit le prochain token</strong>. C'est <strong>tout</strong> ce qu'il sait faire. Et c'est à la fois énorme… et très peu.",
    sfxEverything: "TOUT",
    everythingP1:
      "Le modèle, c'est <strong>l'essence</strong> : prédire la suite, encore et encore. Tu l'as vu en entier — tokenizer, attention, entraînement, génération.",
    everythingP2: "Le <strong>moteur</strong>. Indispensable. Magnifique.",
    sfxNothing: "… ET RIEN",
    nothingP1:
      'Seul, il ne <strong>fait</strong> rien d\'utile. Entre <span class="codechip"><span class="fn">gpt</span>()</span> et ChatGPT ou Claude Code : un <strong>harnais</strong> gigantesque.',
    tools: "<strong>des outils</strong> — lire un fichier, lancer du code, chercher sur le web",
    loop: "<strong>une boucle agentique</strong> — penser → agir → observer → recommencer",
    context: "<strong>du contexte & de la mémoire</strong> — les bonnes infos au bon moment",
    guardrails: "<strong>des garde-fous</strong> — sécurité, permissions, ne pas casser ta machine",
  },

  // annexe-residuels-rmsnorm
  annexeResiduelsRmsnorm: {
    title: "Résidus",
    labelResidual: "Le résidu",
    residualP1:
      "Un <strong>bloc</strong> (l'attention, le MLP) ne refait pas tout : il calcule juste le <strong>reste à corriger</strong> — le « résidu » — qu'on <strong>ajoute</strong> au vecteur.",
    formula: "x = x + bloc(x)",
    residualP2:
      "x n'est <strong>jamais effacé</strong> → l'info circule sans se perdre. Une <strong>voie express</strong> qui rend les réseaux profonds entraînables.",
    labelRmsnorm: "rmsnorm : remettre le volume à niveau",
    rmsnormP:
      "À force d'<span class=\"codechip\">+</span> et <span class=\"codechip\">×</span>, les nombres <strong>gonflent ou s'éteignent</strong>. On les ramène <strong>autour de 1</strong> avant l'étape suivante — l'entraînement ne déraille pas.",
    tagResidual: "le résidu, exécuté",
  },

  // annexe-helpers
  annexeHelpers: {
    title: "La boîte à outils",
    tagFile: "lib/matrix-helpers.ts — les petites mains de l'attention",
    intro:
      "L'attention n'invente rien : elle <strong>empile</strong> ces gestes d'algèbre minuscules. Clique-les pour les voir tourner.",
    footnote:
      'Des <span class="codechip"><span class="ty">number[]</span></span> tout nus, pas de gradient — juste le calcul. Dans le tronc, ces briques portent des <span class="codechip"><span class="ty">Node</span></span> (autograd).',
  },
  // 1b-logarithme (slide interactive)
  logarithme: {
    expoTitle: "Exponentielle",
    logTitle: "Logarithme",
    expLabel: "L'exponentielle",
    expGrowth: "Sa croissance <strong>s'accélère</strong>",
    expEx: "<strong>ex. :</strong> Propagation d'une maladie contagieuse",
    lnLabel: "Le logarithme naturel",
    lnGrowth: "Sa croissance <strong>ralentit</strong>",
    lnEx: "<strong>ex. : </strong> dB, pH, échelle de Richter",
    mirror: " miroir de",
    introA: "-ln(x%) ",
    introStrong: "dénote la surprise",
    introB: " à l'entraînement du LLM…",
    winLead: "J'ai ",
    winTail: " % de chance de gagner, si je gagne :",
  },
  // 6c-la-derivee (slide interactive)
  laDerivee: {
    title: "La dérivée",
    defLabel: "Définition",
    defText: "La <strong>dérivée</strong> : à quelle vitesse une fonction varie en un point",
    slopeLabel: "pente :",
    formulaLabel: "Formule",
    addLine: "addition&nbsp;: <strong>(x + a)' = 1</strong>",
    mulLine: "multiplication&nbsp;: <strong>(a * x)' = a</strong>",
    time: "temps",
    slopeSpeed: "vitesse de la pente =",
  },
  // annexe-derivee-partielle (slide interactive)
  partielle: {
    title: "La dérivée partielle",
    defLabel: "Définition",
    defText:
      "La <strong>dérivée partielle</strong> : la dérivée quand on ne pousse <strong>qu'une entrée à la fois</strong> — les autres restent figées.",
    formulaLabel: "Formule",
    width: "largeur",
    height: "hauteur",
    areaPrefix: "aire = ",
    footer:
      "Élargis le parterre d'un poil&nbsp;: l'aire gagne une fine bande dont la surface vaut la <strong>hauteur</strong>. Pour une <strong>multiplication</strong>, la dérivée d'une entrée = <strong>l'autre</strong>.",
  },
  // annexe-regle-chaine-multivariable (slide interactive)
  chaineMulti: {
    title: "La règle de la chaîne multivariable",
    intro:
      "Je vais au travail <strong>6 jours</strong>&nbsp;: 2× à pied, 2× à vélo, 2× en voiture. Chaque trajet <strong>amplifie</strong> ma vitesse (×, la chaîne)&nbsp;; elle sert à <strong>tous</strong>, donc son blâme = le <strong>cumul des 6 dérivées</strong> — on <strong>additionne</strong>, on ne moyenne pas.",
    slopePrefix: "pente = cumul des dérivées = ",
    noteBase: " de base ⇒ ",
    noteWeek: " sur ma semaine · plancher (tout à pied) : ",
    noteChain: " (la chaîne).",
    bikeDays: "🚴 jours",
    bikeSpeed: "🚴 vitesse",
    carDays: "🚗 jours",
    carSpeed: "🚗 vitesse",
    footLead: "🚶 à pied : ",
    footTail: " jours (le reste, à ×1).",
  },
  // 5b-parameters-3d (slide interactive)
  paramCloud: {
    title: "4192 points au hasard",
    gaussPanel:
      "Chaque point = <strong>3 paramètres</strong> (x, y, z). Comme ils sont tirés d'une <strong>gaussienne</strong>, l'ensemble forme une <strong>boule</strong> centrée sur zéro.",
    sfxAll: "C'est tout !",
    chancePanel:
      "Au départ, le modèle ne « sait » rien : ce nuage est <strong>pur hasard</strong>. L'entraînement va déplacer chaque point pour mieux deviner la lettre suivante.",
    hint: 'Glisse pour tourner · <span class="tag">nouveau tirage</span> rejoue le hasard · <span class="tag">grouper par rôle</span> sépare embeddings / attention / MLP / sortie.',
    newDraw: "↻ nouveau tirage",
    mix: "● mélanger",
    groupByRole: "▦ grouper par rôle",
    paramsCount: "4192 paramètres",
    legendOutput: "sortie",
  },
};

export type Dict = typeof fr;
