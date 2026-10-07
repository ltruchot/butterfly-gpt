// ═══════════════════════════════════════════════════════════════════════════
// Dictionnaire EN — mêmes clés que fr.ts (garanti par le type `Dict`).
// ═══════════════════════════════════════════════════════════════════════════
// Chaînes recopiées VERBATIM depuis les anciennes pages EN (deck butterfly-gpt-en).
import type { Dict } from "./fr.ts";

export const en: Dict = {
  cover: {
    title: "Karpathy's MicroGPT",
    shareLead: "Let's share the",
    sharePill: "red pill!",
  },
  leSage: {
    title: "The butterfly and the sage",
    quote:
      '"When he woke, he no longer knew whether he was a man who had dreamed of a butterfly, or a butterfly dreaming it was a man."',
    attribution: "Zhuangzi (莊子), On the Equality of Things (300 BC)",
  },
  common: {
    mathBoss: "The math boss",
  },
  singularite: {
    title: "Butterfly",
    subtitle: "Close encounter of the third kind",
    azur: "Meet Azur",
    butler: "my <strong>OpenClaw</strong>, my friend?",
    psychosis: "AI Psychosis: a thirst for knowledge",
    discovery: "Karpathy talks about Dobby",
  },
  carpates: {
    subtitle: "Andrej Karpathy - The man from the Carpathians",
    journey:
      "Born in Bratislava (Slovakia) in 1986<br /> → PhD at <strong>Stanford</strong> (California)<br /> under <strong>Fei-Fei Li</strong><br /> → co-founder of <strong>OpenAI</strong><br /> → <strong>Tesla</strong> Autopilot<br />  → <strong>Anthropic</strong> (May 2026)",
  },
  microgptImage: {
    alt: "microgpt.py — the full code",
  },
  execMicrogpt: {
    alt: "Output of vp run gpt (Karpathy's original microgpt.py)",
  },
  butterflyExec: {
    alt: "Running the butterfly GPT — generating names",
  },
  neurones: {
    title: "Neurons",
    lead: "Large Language Models (LLMs) - neurobiology-inspired… but the result:",
    aiPanel:
      "<strong>Artificial Intelligence?</strong><br />Ability to solve problems, emerging from a VERY LARGE network of artificial neurons.",
    gen: "Generates content",
    pretrain: "Pre-trained on a huge corpus",
    transform: "Gradually turns information into weights",
  },
  transformes: {
    title: "Transformers",
    band: 'A "simple", ubiquitous architecture that grants',
    superpowers: "superpowers!",
  },
  briques: {
    title: "Building blocks",
    capDataset: "Butterfly names",
    capTokenizer: "Splits names into small letters",
    capParameters: "Adjustable knobs",
    capAutograd: "Spies on the errors",
    capOptimizer: "Adam turns the knobs",
    capTraining: "Guess, miss, adjust",
    capInference: '"Dream up" new names',
    archi: "Transformer architecture",
    cite: '"Attention Is All You Need" — Vaswani, Shazeer, Parmar et al. · Google, 2017',
  },
  nettoyer: {
    title: "Cleaner",
    fuel: "Fuel",
    li1: "Stream of <strong>tokens</strong>: pixels, words, letters…",
    li2: "Microgpt: <strong>~30,000 first names</strong>",
    li3: "Butterflygpt: <strong>~6,000 butterfly names</strong>",
    always:
      "Always <strong>more</strong> data, more <strong>varied</strong>, more <strong>clean</strong> ",
  },
  atomiser: {
    title: "Atomizer",
    vocab: "Vocabulary",
    li1: "List of unique <strong>tokens</strong>",
    li2: "LLMs handle <strong>numbers</strong>, their ids",
    li3: "<strong>Microgpt:</strong> 1 id per letter of the alphabet",
    li4: "<strong>Butterflygpt:</strong> + space + accents + hyphen + apostrophe",
    bosSpan: " = Name boundary <code>[BOS, a, z, u, r, BOS]</code>",
  },
  parametersDef: {
    title: "VECTOR",
    intro:
      "Parameter = weight = <strong>piece of knowledge</strong> - e.g. <code>-0.19</code><br />LLM = <strong>Matrices</strong> of <strong>billions of frozen params</strong>",
    sfxDimensions: "Other dimensions",
    dimToken:
      'A token ("a", "z"...) → <strong>vector</strong>: <code>[0.23, 0.61, -0.17, ...]</code>',
    dimPosition:
      "A position in the name → <strong>vector</strong>: <code>[-0.19, -0.76, ...]</code>",
    dimDirections: "As many <strong>directions</strong> to enrich",
    sfxGalaxy: "Galaxy",
    galGpt4: "<strong>GPT4</strong> = <strong>1,760 billion</strong> params",
    galMilkyway: "Milky Way = 300 billion ⭐",
    galBrain: "🧠 = ~86 billion neurons",
    matContext: "- context",
    matDecide: "- decide",
    matScores: "- final scores",
  },
  tirageGaussien: {
    title: "The Gaussian draw",
    gaussLabel: "Meet Gauss",
    gaussSum: "Sum of small <strong>chances</strong> around a strong trend",
    gaussFact:
      "A <strong>physical</strong> fact; formalized in <strong>math</strong><br><br><strong>Gauss's law</strong>: a gentle spread",
    bmU: "<strong>u<sub>1</sub></strong>, <strong>u<sub>2</sub></strong> = two random numbers",
    bm1: '<strong>1.</strong> <span class="codechip">√(−2·<span class="fn">ln</span> u<sub>1</sub>)</span> = <strong style="color: var(--teal)">flattened distance</strong>',
    bm2: '<strong>2.</strong> <span class="codechip"><span class="fn">cos</span>(2π·u<sub>2</sub>)</span> = <strong style="color: var(--crimson)">chosen angle</strong>',
    bm3: '<strong>3.</strong> <span class="codechip">× σ</span> = <strong style="color: var(--amber)">small σ → small bell</strong>',
    btnThrow: "🎯 throw",
    shots: "shots",
    radius: "radius",
    formula: "Formula",
  },
  mortVivant: {
    title: "The living dead",
    intro:
      "During training, we <strong>unlock</strong> the params: <ul> <li><strong>bionic armor</strong>: each weight becomes a graph <strong>Node</strong></li> <li>every operation is <strong>recorded</strong></li> </ul> Training done: back to <strong>locked params</strong>.",
    sfxDead: "dead",
    inference: ": inference",
    deadReadonly: "<strong>Read-only</strong>",
    deadFrozen: "Param values frozen",
    deadFile: "LLM: <strong>1 weights file</strong>",
    deadHarness: "A <strong>harness</strong> for the rest",
    sfxAlive: "alive",
    training: ": training",
    aliveWrite: "Read and <strong>write</strong>",
    aliveRam: "Load a param graph into RAM",
    aliveForward: "<strong>Forward pass</strong>: every operation is spied on",
    aliveBackward: "<strong>Backward pass</strong>: spies trace back contributions",
  },
  passeAvant: {
    title: "The forward pass",
    lead: "A vector x transforms: we build a graph of operations",
    predAdd: 'Add embeddings: <span class="codechip">+</span>',
    predAttn: 'Fire the attention: <span class="codechip">*</span>',
    predPerceptron:
      'Into the perceptrons: <span class="codechip"><span class="fn">relu()</span></span>',
    predLoss: "<strong>Loss</strong>: error, model's <strong>surprise</strong>",
    sfxBlame: "Blame",
    blameNotes: "Scratchpad: not useful for now",
    blameGradients:
      "What do we note? <br>Local <strong>gradients</strong> = <strong>derivatives ∂</strong>",
  },
  passeAvantCode: {
    codeTag: "(the forward pass)",
  },
  passeArriere: {
    title: "The backward pass",
    lead: "We start from the last operation and <strong>hand out the blame</strong>",
    p1Label: "1 · Start at the top",
    p1a: "The final error gets <strong>∂ 1</strong>",
    p1b: "<strong>Backpropagation</strong> begins",
    p1c: "Prelude to <strong>gradient descent</strong>",
    p2Label: "2 · Propagate the error",
    p2a: "<strong>Butterfly effect</strong> in reverse",
    p2b: "Sum of <strong>∂<br />(local gradients)</strong>",
    p2c: "<strong>Chain rule</strong>",
    p3Label: "3 · Assign responsibility",
    p3a: "<em>In the end</em> each <strong>param</strong> holds its error gradient",
    p3b: "The <strong>optimizer</strong> updates the weights",
  },
  regleChaine: {
    title: "The chain rule",
    defLabel: "Definition",
    defText:
      "The <strong>chain rule</strong>: the total rate is the <strong>product</strong> of the rates along the path.",
    formulaLabel: "Formula",
    so: "So",
    fastA: "goes",
    fastB: "faster than",
    alsoLabel: "also…",
    alsoText:
      "<strong>Several paths</strong>? They <strong>add up</strong><br /><code>*</code> along a path, <code>+</code> between paths <br/> <br/> See appendix",
  },
  passeArriereCode: {
    codeTag: "03-autograd.ts — the backward pass",
  },
  pipeline: {
    puritySfx: "purity",
    modelPure: "The model is a <strong>pure function</strong>",
    gptSig: "gpt (letter, position, parameters, cache)",
    scoresNote: "<strong>scores</strong> = every letter is a candidate",
    cacheSfx: "hide & seek",
    cacheLi1: "useful for <strong>attention</strong> matrices",
    cacheLi2: "the only part that knows the previous letters",
    journey: "A vector's journey",
    box1Title: "① embedding vectors",
    box1Sub: '"letter z" + "position 2"',
    box2Title: "② attention matrices",
    box2Sub: "links between distant letters",
    box3Sub: "pattern detectors → pruners",
    box4Title: "④ projection vectors",
    box4Sub: "1 score per letter",
  },
  embeddings: {
    diveSfx: "Diving in",
    li1: "Text becomes math",
    li2: "<strong>Embedding</strong> = <em>embeds</em> each <strong>letter</strong> as a vector <strong>+</strong> its <strong>position</strong> vector",
    li3: 'no connection between letters:<br /><span class="tag">a z u r</span> = <span class="tag">r u z a</span>',
  },
  softmax: {
    defLabel: "Definition",
    def1: "Turns values into <strong>probabilities</strong><br /><strong>Accentuates</strong> the largest",
    def2: "The sum equals 100%",
    formulaLabel: "Formula",
  },
  attention: {
    mindfulnessSfx: "Mindfulness",
    query:
      '<strong>query</strong>: what am I after? <ol class="text-xs mt-0" style="padding:0; padding-left: 1.5rem;"><li style="margin: 0; padding: 0;"><span class="codechip" style="margin: 0.5rem 0 0 0;">vecQ = <span class="fn">linear</span>(vecX, matQ)</span></li><li style="margin: 0; padding: 0;"><em>(= sums of products of <span class="codechip">vecX</span> and <span class="codechip">matQ</span>)</em></li></ol>',
    keys: '<strong style="color: var(--teal)">keys</strong> <span class="codechip">vecK</span>: where do I look?',
    weights:
      'Which <strong style="color: var(--teal)">keys</strong> match my <strong>query</strong>?<br /><span class="codechip">vecWeights = <span class="fn">Softmax</span>(vecQ · each vecK)</span>',
    values:
      '<strong style="color: var(--amber)">values</strong> <span class="codechip">vecV</span>: what do I find? <ul class="text-xs" style=" padding-left: 1.5rem;"></ul>',
    context:
      'Which <strong style="color: var(--amber)">values</strong> get tuned?<br /><span class="codechip">vecContext = vecWeights · each vecV</span>',
    residual:
      'Attention residual<br /><span class="codechip">vecAttn = <span class="fn">linear</span>(vecContext, matO)</span>',
    headsSfx: "heads",
    splitP:
      'We split <span class="codechip">vecQ</span>/<span class="codechip">vecK</span>/<span class="codechip">vecV</span> into equal slices:',
    head0: "head 0",
    head1: "head 1",
    headsNote:
      " → Each head attends to <strong>its slices</strong> <br /> → We <strong>concat</strong> it all at the end ",
    kvNote:
      '<span class="codechip">vecK</span> and <span class="codechip">vecV</span> <strong>memorized</strong><br /><br />→ <strong>distant tokens matter</strong>',
  },
  mlp: {
    clarify: "Clarify the concepts",
    before: "Before",
    after: "After",
    twoLayers: "<strong>2 layers</strong> and an <strong>elbow</strong>:",
    li1: '<strong style="color: var(--teal)">fc1  →  "unfold"</strong>: more room for patterns',
    li2: '<strong style="color: var(--crimson)">elbow (ReLU)</strong>: we keep what lights up',
    li3: '<strong style="color: var(--amber)">fc2 → fold</strong>: patterns caught in a residual',
    fcNote: "<strong>fc</strong> = <em>fully connected</em>, dense layer",
    tag: "08-mlp.ts — simplified version",
  },
  rms: {
    title: "Root mean square",
    airPressure: "<strong>Air pressure</strong> in a mic: ",
    pushed: 'pushed = <strong style="color: var(--crimson)">+</strong>',
    pulled: 'pulled = <strong style="color: var(--crimson)">−</strong>',
    meanZero:
      "<strong>Mean ≈ 0</strong>, even singing loud!<br />The <strong>RMS</strong> computes a <strong>real volume</strong>",
    formula: "Formula",
    formulaText: "RMS = √( mean of squares )",
    pushedAxis: "+ pushed",
    pulledAxis: "− pulled",
    meanLabel: "mean ≈ ",
    normBefore: " — Points ÷ ",
    normAfter: " are normalized around ",
  },
  loss: {
    sfx: "cross-entropy /  Error",
    intro:
      '<strong>27 probabilities, one per letter</strong><br/> Loss = <strong>ONE last number</strong>: <span class="codechip"><span class="fn">−ln</span>(<span class="num">true letter</span>)</span><br /> → how <strong>wrong</strong> were we?',
    surprise:
      'The <span class="codechip">−ln(p)</span> measures the <strong>surprise</strong><br /> Right prediction → <strong>0 loss</strong><br /> Unsure → ~0.7 loss<br /> sure & wrong → <strong>3+ loss</strong><br />',
  },
  entrainement: {
    title: "Training",
    zip: "Training = a <strong>giant, lossy zip</strong>?",
    moves: "5 moves, repeated 1000 times",
    s1: "<strong>①</strong> take a name",
    s2: "<strong>②</strong> forward pass on its letters",
    s3: "<strong>③</strong> measure the <strong>loss</strong>",
    s4: "<strong>④</strong> backward pass → gradients",
    s5: "<strong>⑤</strong> adjust the parameters (Adam)",
  },
  adam: {
    stepByStep: "Step by step",
    pipe1: "a name in <br> the dataset",
    pipe2: 'forward pass<br><span style="opacity: .85">gpt(params) → scores</span>',
    pipe3: 'loss = the error<br><span style="opacity: .85">−ln p("u")</span>',
    pipe4: 'backward pass<br><span style="opacity: .85">fills each p.grad</span>',
    pipe5:
      'ADAM<br><span style="font-weight: 400">each p.data −= gradient (smoothed and slowed)</span>',
    gradient:
      "Read the scores and push each param in the direction of its <strong>gradient</strong>",
  },
  trainCode: {
    title: "Trainer",
    surpriseLabel: 'Loss = the "surprise"',
    lossFormula:
      '<span class="codechip">−<span class="fn">log</span> p(right letter)</span> <br />We seek a balance between <strong>randomness</strong> and <strong>determinism</strong>',
  },
  inferenceA: {
    title: "Hangman",
    intro:
      '<p>Model = <strong>2 files</strong></p><ul style="color: var(--slate)"><li>the <strong>weights</strong> (dead)</li><li>the <strong>run</strong> (the program that animates them)</li></ul><p>Picks a token, steers toward another token, re-picks, etc.</p>',
    sfxGenerator: "Generator",
    genFrozen:
      "Parameters <strong>frozen</strong>: nothing left to learn.<br> We loop the forward pass",
    startStop:
      '<div>start: <span class="codechip">BOS</span> ("begin")</div><div>stop: <span class="codechip">BOS</span> ("end")</div>',
    sfxTemperature: "Temperature",
    tempDesc:
      'The model\'s <strong>creativity knob</strong><br> We <strong>divide the scores</strong> by <span class="codechip">temperature</span>',
    tempScale:
      '<div><strong>≈ 0</strong> — always the most probable (realistic)</div><div><strong style="color: var(--crimson)">0.5</strong> — conservative (dreamy)</div><div><strong>&gt; 1</strong> — bold (nightmarish)</div>',
    conclusion:
      "Inference: like training… <strong>without autograd, without the backward pass</strong>. Only the predicted letter is left",
  },
  inferenceCode: {
    tag: "13-sample.ts — generate, letter by letter",
  },
  inferenceLive: {
    title: "Generation",
    dream:
      'The model <strong>dreams</strong> (hallucinates) butterfly names <strong>it has never seen</strong><br><br> It learned their "music".',
    temperature: "temperature",
  },
  conclusion: {
    story:
      "GPT is the journey of a token vector trying to reach its betrothed. It climbs mountains, descends valleys, then at last meets its beloved, and never forgets it.",
  },
  merci: {
    title: "Thanks",
    sfxSponsors: "The sponsors",
    sponsors:
      "<strong>Shodo Rennes</strong> &amp; <strong>Actian Zeenea</strong> — for the resources, the rehearsals, the encouragement and the valuable advice",
    sfxLoved: "Loved ones",
    loved:
      '<div><strong>Sonemany Nigole</strong> — for the patience, support and outreach</div><div class="mt-1"><strong>Kelly Resche</strong> — the maths boss, for proofreading the slides</div>',
    sfxMachines: "The machines",
    machines: "My butler agent <strong>“Azur”</strong> and <strong>Claude Opus&nbsp;4.8</strong>",
    sfxInspirations: "Inspirations",
    inspirations:
      '<div><strong>A. Karpathy</strong> — for his sharing and his teaching.</div><div class="mt-1"><strong>Dave Gibbons</strong> — for the Matrix webtoon illustrating these slides</div>',
  },
  bibliographie: {
    title: "Bibliography",
    slidesOnline:
      'These slides are online at <a href="https://developers.gods.academy/loic-truchot/projects/butterfly-gpt/en">https://developers.gods.academy/loic-truchot/projects/butterfly-gpt/en</a>',
    sfxSource: "The source",
    source:
      '<div>Karpathy\'s <strong><a href="https://karpathy.github.io/2026/02/12/microgpt/">microgpt article</a></strong></div><div class="mt-1">The <strong><a href="https://gist.github.com/karpathy/8627fe009c40f57531cb18360106ce95">original code gist</a></strong></div><div class="mt-1"><strong><a href="https://github.com/iamyb/microgpt-excel">microgpt-excel</a></strong> — the same GPT, cell by cell, in a spreadsheet</div><div class="mt-2">The <strong><a href="https://github.com/ltruchot/butterfly-gpt">butterfly-gpt source</a></strong> and these slides</div>',
    sfxPodcasts: "The podcasts",
    podcasts:
      '<div><strong><a href="https://www.dwarkesh.com/p/andrej-karpathy">Karpathy on Dwarkesh Patel</a></strong></div><div class="mt-2"><strong><a href="https://lexfridman.com/andrej-karpathy/">Karpathy on Lex Fridman</a></strong></div><div class="mt-2"><strong><a href="https://www.superdatascience.com/podcast">Super Data Science</a></strong></div>',
    sfxCuisine: "Under the hood",
    cuisine:
      '<div><strong>TypeScript</strong> — the rewrite, zero dependencies</div><div><strong><a href="https://viteplus.dev/">Vite+</a></strong> — the unified toolchain</div><div><strong><a href="https://sli.dev/">Slidev</a></strong> — these slides</div><div><strong><a href="https://data-star.dev/">Datastar</a></strong> — the demos\' interactivity</div><div><strong><a href="https://threejs.org/">Three.js</a></strong> — the 3D parameter cloud</div>',
    licence:
      'Content under <strong><a href="https://creativecommons.org/licenses/by-nc-sa/4.0/">CC BY-NC-SA 4.0</a></strong>, code under <strong><a href="https://polyformproject.org/licenses/noncommercial/1.0.0/">PolyForm Noncommercial 1.0.0</a></strong>; Karpathy\'s microgpt remains his exclusive intellectual property (<a href="https://gist.github.com/karpathy/8627fe009c40f57531cb18360106ce95">public gist</a>, <a href="https://github.com/karpathy/micrograd/blob/master/LICENSE">micrograd MIT notice</a>). All "Butterfly" images by Dave Gibbons were collected from fan sites sharing excerpts under a CC-BY-SA license and from the Internet Archive (they were published without a paywall during the promotion of the Matrix movies), but I own neither their license nor any exploitation rights. This presentation is an open-access "MOOC" that may not be used for commercial purposes. I hold no rights over these image excerpts and will remove them upon simple request (my emails went unanswered): the same applies to anyone using this presentation.',
  },

  annexeTitre: {
    sfx: "APPENDIX",
  },

  annexeSchema: {
    title: "The model in one diagram",
    hint: 'One full forward pass, brick by brick — <strong>hover each brick</strong> to discover its role. Diagram inspired by <strong><a href="https://github.com/iamyb/microgpt-excel">microgpt-excel</a></strong>: the same GPT, cell by cell, in a spreadsheet.',
    colIn: "① the embeddings",
    colAttn: "② the attention",
    colMlp: "③ the perceptron (MLP)",
    colOut: "④ the output",
    brickInput: '"z" · position 2',
    subInput: "the current letter",
    tipInput:
      "Everything the model sees at this step: <strong>one letter</strong> and <strong>its position</strong>. The previous letters already live in the K/V cache.",
    tipTokenEmb:
      'The table of <strong>vector ID cards</strong>: one row of 16 numbers per letter of the vocabulary (44). Learned during training — this is where "z" becomes math.',
    tipPositionEmb:
      'The same idea for the <strong>position</strong>: one vector per possible slot (64). Without it, "a z u r" = "r u z a".',
    subX: "the current vector (16 numbers)",
    tipX: 'The <strong>adventurer</strong> of the pipeline: the sum of both embeddings. These 16 numbers summarize "z at position 2" and will be reworked step after step.',
    tipRmsIn:
      "<strong>rmsnorm</strong> brings the vector's volume back to ~1: repeated additions and multiplications make the numbers drift, so we reset the scale before the block.",
    tipRmsAttn:
      "<em>Pre-norm</em>: attention receives a copy of x at volume ~1. The original x waits by the residual.",
    tipWq:
      'The slides\' "matQ" alias — builds the <strong>query</strong>: "what am I looking for?".',
    tipWk:
      'The "matK" alias — builds the <strong>key</strong>: "where am I looking?". The key of "z" goes to the cache for the next letters.',
    tipWv:
      'The "matV" alias — builds the <strong>value</strong>: "what do I find?", the information to pass along if the key matches.',
    brickCache: "K/V cache",
    tipCache:
      "The <strong>memory</strong>: the keys and values of every letter seen so far. It is the only mechanism that knows the past.",
    subAttn: "4 heads",
    tipHeads:
      "The heart: softmax(vecQ · each vecK) weighs the values of the past → a context vector. Split into <strong>4 heads</strong>, each watching its own slices, concatenated at the end.",
    tipWo:
      'The "matO" alias — recombines what the 4 heads report into a single <strong>correction</strong> of 16 numbers.',
    brickResidual: "+ residual",
    tipResidual1:
      "We never replace x: we <strong>keep x and add the attention's correction</strong>. An express lane for the gradient → deep networks become trainable.",
    tipRmsMlp:
      "Same ritual as before attention: a copy of x at volume ~1 for the MLP, the original waits by the residual.",
    tipFc1: "The <strong>unfolding</strong>: 16 → 64 numbers, more room to detect patterns.",
    tipRelu: "The <strong>elbow</strong>: negatives become 0 — we only keep what lights up.",
    tipFc2:
      "The <strong>refolding</strong>: 64 → 16, the caught patterns go back into a correction.",
    tipResidual2:
      "Second residual: x + the MLP's correction. Block ② + ③ could be stacked N times; here, one layer is enough.",
    tipOutputProj:
      'Karpathy\'s "lm_head" — the final projection: the 16 numbers of x become <strong>44 scores</strong>, one per letter of the vocabulary (the "logits").',
    brickScores: "scores",
    subScores: "1 per letter (44)",
    tipScores:
      "Raw scores: <strong>every letter is a candidate</strong> for the next position — the big values are the favorites.",
    tipSoftmax:
      "Turns the scores into <strong>probabilities</strong> (sum = 100%) while amplifying the biggest ones. The <strong>temperature</strong> is dialed in right before.",
    brickNext: "🎲 next letter",
    tipNext:
      "We <strong>draw at random</strong> according to these probabilities, and the winning letter goes back to ① — that is the generation loop.",
  },

  annexeEnVrai: {
    title: 'And "for real"?',
    lead: "microgpt has <strong>all the essence</strong> of a GPT. It's already GPT-2 — just <strong>simplified</strong>, and tiny. The rest is <strong>scaling engineering</strong>.",
    labelSimpler: "microgpt = a simpler GPT-2",
    amberNote:
      '<span class="codechip"><span class="ty">RMSNorm</span></span> instead of LayerNorm · <span class="tag">no bias</span> · <span class="codechip"><span class="ty">ReLU</span></span> instead of GeLU. At scale, we do the opposite: we <strong>add</strong> blocks (RoPE, GQA, MoE, gated activations…).',
    sfxBuild: "BUILD THE MODEL",
    data: "not ~5,900 names but <strong>trillions</strong> of tokens, filtered.",
    tokenizer: "<strong>BPE</strong> (~100,000 tokens), not letters.",
    autograd: "<strong>tensors on GPU</strong> (PyTorch, FlashAttention), not scalars.",
    architecture: "<strong>hundreds of billions</strong> of params, 100+ layers.",
    sfxScale: "SCALE IT UP",
    training: "big batches, mixed precision, <strong>thousands of GPUs</strong> for months.",
    optimization: "scaling laws (<strong>Chinchilla</strong>), finely tuned settings.",
    postTraining:
      "<strong>SFT</strong> (conversations) then <strong>RL</strong> (feedback) → a chatbot.",
    inference: "batching, <strong>vLLM</strong>, quantization, speculative decoding.",
  },

  annexeLeHarnais: {
    title: "Everything… and nothing",
    lead: "The model you just saw <strong>predicts the next token</strong>. That's <strong>all</strong> it can do. And that's both huge… and very little.",
    sfxEverything: "EVERYTHING",
    everythingP1:
      "The model is <strong>the essence</strong>: predict what's next, again and again. You saw all of it — tokenizer, attention, training, generation.",
    everythingP2: "The <strong>engine</strong>. Essential. Beautiful.",
    sfxNothing: "… AND NOTHING",
    nothingP1:
      'On its own, it <strong>does</strong> nothing useful. Between <span class="codechip"><span class="fn">gpt</span>()</span> and ChatGPT or Claude Code: a giant <strong>harness</strong>.',
    tools: "<strong>tools</strong> — read a file, run code, search the web",
    loop: "<strong>an agentic loop</strong> — think → act → observe → repeat",
    context: "<strong>context & memory</strong> — the right info at the right time",
    guardrails: "<strong>guardrails</strong> — safety, permissions, don’t break your machine",
  },

  annexeResiduelsRmsnorm: {
    title: "Residuals",
    labelResidual: "The residual",
    residualP1:
      'A <strong>block</strong> (attention, the MLP) doesn\'t redo everything: it just computes the <strong>rest to fix</strong> — the "residual" — which we <strong>add</strong> to the vector.',
    formula: "x = x + block(x)",
    residualP2:
      "x is <strong>never erased</strong> → the info flows without getting lost. A <strong>fast lane</strong> that makes deep networks trainable.",
    labelRmsnorm: "rmsnorm: bring the volume back to level",
    rmsnormP:
      'With repeated <span class="codechip">+</span> and <span class="codechip">×</span>, numbers <strong>swell or fade out</strong>. We bring them back <strong>around 1</strong> before the next step — training stays on track.',
    tagResidual: "the residual, executed",
  },

  annexeHelpers: {
    title: "The toolbox",
    tagFile: "lib/matrix-helpers.ts — attention's little helpers",
    intro:
      "Attention invents nothing: it <strong>stacks</strong> these tiny algebra moves. Click them to watch them run.",
    footnote:
      'Bare <span class="codechip"><span class="ty">number[]</span></span>, no gradient — just the math. In the core, these blocks carry <span class="codechip"><span class="ty">Node</span></span>s (autograd).',
  },
  logarithme: {
    expoTitle: "Exponential",
    logTitle: "Logarithm",
    expLabel: "The exponential",
    expGrowth: "Its growth <strong>speeds up</strong>",
    expEx: "<strong>e.g.:</strong> Spread of a contagious disease",
    lnLabel: "The natural logarithm",
    lnGrowth: "Its growth <strong>slows down</strong>",
    lnEx: "<strong>e.g.: </strong> dB, pH, Richter scale",
    mirror: " mirror of",
    introA: "-ln(x%) ",
    introStrong: "denotes the surprise",
    introB: " when training the LLM…",
    winLead: "I have a ",
    winTail: "% chance to win, if I win:",
  },
  laDerivee: {
    title: "The derivative",
    defLabel: "Definition",
    defText: "The <strong>derivative</strong>: how fast a function changes at a point",
    slopeLabel: "slope:",
    formulaLabel: "Formula",
    addLine: "addition:&nbsp;<strong>(x + a)' = 1</strong>",
    mulLine: "multiplication:&nbsp;<strong>(a * x)' = a</strong>",
    time: "time",
    slopeSpeed: "slope speed =",
  },
  partielle: {
    title: "The partial derivative",
    defLabel: "Definition",
    defText:
      "The <strong>partial derivative</strong>: the derivative when you push <strong>only one input at a time</strong> — the others stay frozen.",
    formulaLabel: "Formula",
    width: "width",
    height: "height",
    areaPrefix: "area = ",
    footer:
      "Widen the bed a hair: the area gains a thin strip whose surface equals the <strong>height</strong>. For a <strong>multiplication</strong>, the derivative of one input = <strong>the other</strong>.",
  },
  chaineMulti: {
    title: "The multivariable chain rule",
    intro:
      "I go to work <strong>6 days</strong>: 2× walking, 2× biking, 2× by car. Each trip <strong>amplifies</strong> my speed (×, the chain); it serves <strong>all</strong> of them, so its blame = the <strong>sum of the 6 derivatives</strong> — we <strong>add</strong>, we don't average.",
    slopePrefix: "slope = sum of derivatives = ",
    noteBase: " of base ⇒ ",
    noteWeek: " on my week · floor (all on foot): ",
    noteChain: " (the chain).",
    bikeDays: "🚴 days",
    bikeSpeed: "🚴 speed",
    carDays: "🚗 days",
    carSpeed: "🚗 speed",
    footLead: "🚶 on foot: ",
    footTail: " days (the rest, at ×1).",
  },
  paramCloud: {
    title: "4192 random points",
    gaussPanel:
      "Each point = <strong>3 parameters</strong> (x, y, z). Since they're drawn from a <strong>Gaussian</strong>, the whole forms a <strong>ball</strong> centered on zero.",
    sfxAll: "That's all!",
    chancePanel:
      'At first, the model "knows" nothing: this cloud is <strong>pure chance</strong>. Training will move each point to better guess the next letter.',
    hint: 'Drag to rotate · <span class="tag">new draw</span> replays chance · <span class="tag">group by role</span> splits embeddings / attention / MLP / output.',
    newDraw: "↻ new draw",
    mix: "● mix",
    groupByRole: "▦ group by role",
    paramsCount: "4192 parameters",
    legendOutput: "output",
  },
};
