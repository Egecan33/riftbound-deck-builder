#!/bin/sh
# Rebuild both halves, the markdown fragments and the document. No network. Run from this directory.
set -e
CARDS="${CARDS:-$HOME/github_repositories/GameLab/data/cards/cards.json}"
SAMPLE="${SAMPLE:-$HOME/github_repositories/GameLab/data/decks/samples/piltover-archive-2026-09-06.json}"
python3 -I build_legend_profiles.py --cards "$CARDS" --gallery raw/gallery-2026-11-11.json \
  --engine-scripts ../interactions/engine-scripts.json --bans data/bans-known.json --out data/legend-profiles.text.json
python3 -I build_legend_meta.py --cards "$CARDS" --local-sample "$SAMPLE" --pa-list ../raw/pa-list.jsonl \
  --pa-decks data/pa-decks.jsonl --pa-shared ../raw/pa-decks.jsonl \
  --r1-parsed raw/riftbound-one-decklists-parsed-2026-11-11.json --r1-qty raw/riftbound-one-decklists-qty-2026-11-11.json \
  --official raw/official-rq-top-decks-2026-11-11.json --arch-labels ../out/results.json --bans data/bans-known.json \
  --results data/results-riftboundgg-2026-11.json --out data/legend-profiles.meta.json
python3 -I report.py --text data/legend-profiles.text.json --meta data/legend-profiles.meta.json --out-dir data/md
python3 -I assemble_doc.py --out ../../legend-profiles.md
