// Mini-highlighter syntaxique pour notre pseudo-TS du snapshot.
// Pas de dépendance lourde (shiki, prism). On parse les tokens d'un
// petit sous-ensemble du langage et on les wrap dans des `<span>` aux
// classes alignées avec le thème slidev-theme-light-icons (variables
// `--prism-*` du fichier styles/code.css de cette dépendance).

const KEYWORDS = new Set([
  "const",
  "let",
  "var",
  "true",
  "false",
  "null",
  "undefined",
  "void",
  "function",
  "return",
]);

// Échappe les caractères HTML dangereux dans une portion textuelle.
const esc = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Ordre crucial : commentaire, string, keyword, number, punctuation, identifier, whitespace.
// On capture chaque alternative dans un groupe ; le 1er groupe matché donne le type.
// L'alternance des mots-clés est CONSTRUITE depuis KEYWORDS : une seule
// source de vérité (le Set sert aussi à l'heuristique « clé d'objet »).
const TOKEN_RX = new RegExp(
  `(\\/\\/[^\\n]*)|("[^"]*"|'[^']*')|(\\b(?:${[...KEYWORDS].join("|")})\\b)|(-?\\d+(?:\\.\\d+)?)|([{}[\\](),:;=·→])|([A-Za-z_$][\\w$]*)|(\\s+)`,
  "g",
);

export const highlight = (src: string): string => {
  let out = "";
  let lastIndex = 0;
  for (const m of src.matchAll(TOKEN_RX)) {
    if (m.index > lastIndex) {
      // Texte non matché (ex. ponctuation exotique) → on l'ajoute brut, escapé.
      out += esc(src.slice(lastIndex, m.index));
    }
    const [match, comment, str, kw, num, punct, ident, ws] = m;
    if (comment !== undefined) out += `<span class="hl-comment">${esc(comment)}</span>`;
    else if (str !== undefined) out += `<span class="hl-string">${esc(str)}</span>`;
    else if (kw !== undefined) out += `<span class="hl-keyword">${esc(kw)}</span>`;
    else if (num !== undefined) out += `<span class="hl-number">${esc(num)}</span>`;
    else if (punct !== undefined) out += `<span class="hl-punctuation">${esc(punct)}</span>`;
    else if (ident !== undefined) {
      // Heuristique : si l'identifiant est suivi de `:` (au-delà d'espaces),
      // c'est probablement une clé d'objet → on le colorise comme propriété.
      const after = src.slice(m.index + ident.length);
      const isKey = /^\s*:/.test(after) && !KEYWORDS.has(ident);
      out += `<span class="${isKey ? "hl-property" : "hl-identifier"}">${esc(ident)}</span>`;
    } else if (ws !== undefined) out += ws;
    else out += esc(match);
    lastIndex = m.index + match.length;
  }
  if (lastIndex < src.length) out += esc(src.slice(lastIndex));
  return out;
};
