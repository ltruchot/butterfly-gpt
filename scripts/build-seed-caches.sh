#!/usr/bin/env bash
# build-seed-caches.sh
# ────────────────────────────────────────────────────────────────────────────
# Construit, l'un après l'autre, les caches de poids
#   packages/microgpt-ts/by_seeds/<seed>-<epochs>.json
# pour toutes les graines 1..10 × {1000, 2000, 5000, 10000} pas (40 modèles).
#
# IDEMPOTENT : si un cache existe déjà, le runner le RECHARGE (aucun
# ré-entraînement) → on peut relancer le script pour reprendre après une
# interruption, ça saute ce qui est déjà fait.
#
# On appelle `node` DIRECTEMENT (pas `vp run`) : pas de cache de tâche, pas
# d'env propre, et c'est ce qui exécute vraiment l'entraînement. `--samples=0`
# = on ne génère pas de noms ici (on ne veut que les poids).
#
# Lancer depuis la racine du repo, détaché, pour que ça tourne des heures :
#   nohup bash scripts/build-seed-caches.sh > /tmp/seed-caches.log 2>&1 &
#   tail -f /tmp/seed-caches.log
# ────────────────────────────────────────────────────────────────────────────
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/packages/microgpt-ts" || {
  echo "package microgpt-ts introuvable"
  exit 1
}

SEEDS="1 2 3 4 5 6 7 8 9 10"
EPOCHS="1000 2000 5000 10000"
TOTAL=40
START=$(date +%s)
i=0

for s in $SEEDS; do
  for e in $EPOCHS; do
    i=$((i + 1))
    echo "════════ [$i/$TOTAL] seed=$s epochs=$e  $(date '+%Y-%m-%d %H:%M:%S') ════════"
    node src/microgpt.ts "$s" --epochs="$e" --samples=0 2>&1 \
      | grep -E 'sauvegardés|chargés|terminé en' || true
  done
done

MINS=$(((  $(date +%s) - START ) / 60))
echo "════════ TERMINÉ — $i runs en ${MINS} min ════════"
echo "Caches présents :"
ls -1 by_seeds/ | sort -V
