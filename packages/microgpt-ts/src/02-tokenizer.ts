// ======================================================================
// 02 - Tokenizer : l'atomiseur (caractère ⇄ id)
// ======================================================================
// un GPT manipule des nombres, pas du texte
//
//   « azur »  --encode-->  [1, 26, 21, 18]  --decode-->  « azur »
//
// - caractères distincts du corpus (uchars), triés, numérotés
// - BOS, la frontière des noms : [BOS, a, z, u, r, BOS]
//   pas un caractère du texte, id ajouté après les vrais (d'où le +1 de vocabSize)
//   tirer BOS à l'inférence = le mot est fini
// - une fabrique, pas des globales : module pur, navigateur comme serveur

/** vocabulaire (uchars, BOS, vocabSize) + encode/decode */
export type Tokenizer = {
  /** caractères distincts du corpus, triés : uchars[i] a l'id i */
  readonly uchars: readonly string[];
  /** id du token sentinelle BOS (= uchars.length) */
  readonly BOS: number;
  /** caractères + BOS = uchars.length + 1 */
  readonly vocabSize: number;
  /** chaîne → suite d'ids */
  readonly encode: (s: string) => number[];
  /** suite d'ids → chaîne (ignore BOS et les ids hors plage) */
  readonly decode: (ids: readonly number[]) => string;
};

/** rang de tri : 0 espace, 1 lettre a-z, 2 le reste */
const rank = (c: string): number => (c === " " ? 0 : c >= "a" && c <= "z" ? 1 : 2);

/**
 * makeTokenizer : construit le tokenizer à partir d'un corpus
 *
 *   const { uchars, BOS, vocabSize, encode, decode } = makeTokenizer(getAllDocs());
 *
 * une divergence assumée avec microgpt.py : le tri
 * le tri Unicode brut place le tiret avant « a » et casse le repère « 1 = a, 26 = z »
 * → trois tranches : espace (0), lettres a-z (1 à 26), le reste (27+)
 * pour le modèle, simple permutation des ids
 */
export const makeTokenizer = (docs: readonly string[]): Tokenizer => {
  // tri alphabétique puis par tranche : le tri JS est stable,
  // l'alphabétique survit à l'intérieur des tranches
  const uchars: readonly string[] = Array.from(new Set(docs.join("")))
    .sort()
    .sort((a, b) => rank(a) - rank(b));

  const BOS = uchars.length;

  // un caractère = un id, aucun BOS ajouté ici car tokenize encadre
  // hors du corpus d'origine, caractère inconnu → -1 silencieux
  const encode = (s: string): number[] => Array.from(s, (ch) => uchars.indexOf(ch));

  // ids hors plage (dont BOS) écartés : BOS sert à s'arrêter, pas à s'afficher
  const decode = (ids: readonly number[]): string =>
    ids
      .filter((id) => id >= 0 && id < uchars.length)
      .map((id) => uchars[id])
      .join("");

  return { uchars, BOS, vocabSize: uchars.length + 1, encode, decode };
};
