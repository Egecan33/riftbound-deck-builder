#!/bin/sh
# Serial fetch of Piltover Archive tournament pages listed in its sitemap; keeps only <title> and meta description.
UA='Mozilla/5.0 (compatible; deck-research/1.0)'
: > pa-tournaments-meta.tsv
while read -r U; do
  H=$(curl -s -m 30 -A "$UA" "$U")
  T=$(printf '%s' "$H" | grep -o '<title>[^<]*</title>' | head -1 | sed 's/<[^>]*>//g')
  D=$(printf '%s' "$H" | grep -o '<meta name="description" content="[^"]*"' | head -1 | sed 's/.*content="//; s/"$//')
  printf '%s\t%s\t%s\n' "$U" "$T" "$D" >> pa-tournaments-meta.tsv
  sleep 1.5
done < pa-tournament-urls.txt
