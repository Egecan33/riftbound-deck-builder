#!/bin/sh
# Rebuild both halves and the markdown fragments. No network. Run from this directory.
set -e
CARDS="${CARDS:-$HOME/github_repositories/GameLab/data/cards/cards.json}"
SAMPLE="${SAMPLE:-$HOME/github_repositories/GameLab/data/decks/samples/piltover-archive-2026-09-06.json}"
python3 -I build_legend_profiles.py --cards "$CARDS" --gallery raw/gallery-2026-11-11.json \
  --engine-scripts ../interactions/engine-scripts.json --bans data/bans-known.json --out data/legend-profiles.text.json
python3 -I build_legend_meta.py --cards "$CARDS" --local-sample "$SAMPLE" --pa-list ../raw/pa-list.jsonl \
  --pa-decks data/pa-decks.jsonl --results data/results-riftboundgg-2026-11.json --out data/legend-profiles.meta.json
python3 -I report.py --text data/legend-profiles.text.json --meta data/legend-profiles.meta.json --out-dir data/md
