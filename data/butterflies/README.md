# Butterflies dataset

Listes de noms de papillons (ordre Lepidoptera), un par ligne, UTF-8, triées.

## Fichiers

### Refined (normalisés — usage entraînement LLM)

Charset garanti : `[a-z àâäæçèéêëîïôöùûüÿœñ <espace> -]`. Lowercase only. Ces
fichiers sont prêts pour un tokenizer.

| Fichier               | Lignes  | Contenu                                            |
| --------------------- | ------- | -------------------------------------------------- |
| `latin.refined.txt`   | ~9 000  | Noms scientifiques alignés avec ≥1 vernaculaire EN |
| `english.refined.txt` | ~10 800 | Noms vernaculaires anglais                         |
| `french.refined.txt`  | ~4 700  | Noms vernaculaires français                        |

### Raw (avant normalisation — référence)

| Fichier                 | Lignes   | Contenu                                                  |
| ----------------------- | -------- | -------------------------------------------------------- |
| `latin.raw.txt`         | ~395 000 | TOUS les noms Lepidoptera (avec synonymes, sous-espèces) |
| `latin.aligned.raw.txt` | ~9 000   | Sous-ensemble avec vernaculaire EN                       |
| `english.raw.txt`       | ~10 800  | EN avant normalisation (casse mixte)                     |
| `french.raw.txt`        | ~5 300   | FR avant normalisation                                   |
| `pairs.tsv`             | ~9 100   | Mapping latin ↔ EN ↔ FR (TSV)                            |

## Sources

- **GBIF Backbone Taxonomy** ([dataset](https://www.gbif.org/dataset/d7dddbf4-2cf0-4f39-9b2a-bb099caae36c)) — taxons scientifiques + VernacularName.tsv
- **Wikidata SPARQL** — labels FR/EN sur descendants de [Lepidoptera Q28319](https://www.wikidata.org/wiki/Q28319)
- **Wikipedia EN** — langlinks FR pour les noms anglais
- **Wikipedia FR** — titres d'articles via Wikidata
- **iNaturalist API** (`?taxon_id=47157&locale=fr`) — `preferred_common_name` en FR

## Normalisation appliquée

Voir `scripts/butterflies-list-dataset-builder/lib/normalize.ts`. Étapes :

1. Strip du contenu entre parenthèses : `Damier de la succise (aurinia)` → `damier de la succise`
2. Split sur `, ; /` (multiples noms dans une entrée)
3. Lowercase
4. Remplace apostrophes / ponctuation par espace
5. Filtre regex `[^a-zàâäæçèéêëîïôöùûüÿœñ \-]` → espace
6. Collapse espaces, trim
7. Drop entrées <2 ou >100 caractères

## Regénération

```bash
# Pipeline complet (~30 minutes)
vp run butterflies

# Étapes individuelles
vp run butterflies:fetch          # GBIF API + Wikidata SPARQL
vp run butterflies:enrich         # Parse backbone.zip VernacularName.tsv
vp run butterflies:clean          # Dédup + filtrage des fuites latin→fr/en
vp run butterflies:build-aligned  # Construit pairs.tsv + latin.aligned
vp run butterflies:enrich-french  # Wikipedia EN→FR + Wikidata FR articles
vp run butterflies:enrich-french-inat  # iNaturalist (gros gain)
vp run butterflies:normalize      # Produit les *.refined.txt
```

Requiert `.cache/backbone.zip` (970 MB) :

```bash
curl -L --create-dirs -o .cache/backbone.zip \
  https://hosted-datasets.gbif.org/datasets/backbone/current/backbone.zip
```
