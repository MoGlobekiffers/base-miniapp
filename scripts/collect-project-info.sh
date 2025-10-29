#!/usr/bin/env bash
set -euo pipefail

mkdir -p docs
OUT="docs/PROJECT_INFO.md"

echo "# base-miniapp — Snapshot d'informations" > "$OUT"
echo "" >> "$OUT"
echo "Genere le: $(date)" >> "$OUT"

echo "" >> "$OUT"
echo "## A) Environnement local" >> "$OUT"
echo -n "- Node: " >> "$OUT"; (node -v 2>/dev/null || echo "N/A") >> "$OUT"
echo -n "- NPM: "  >> "$OUT"; (npm -v  2>/dev/null || echo "N/A") >> "$OUT"
echo -n "- Yarn: " >> "$OUT"; (yarn -v 2>/dev/null || echo "N/A") >> "$OUT"
echo -n "- PNPM: " >> "$OUT"; (pnpm -v 2>/dev/null || echo "N/A") >> "$OUT"

echo "" >> "$OUT"
echo "## B) package.json (scripts et deps)" >> "$OUT"
if [ -f package.json ]; then
  echo "---- package.json ----" >> "$OUT"
  cat package.json >> "$OUT"
fi

echo "" >> "$OUT"
echo "## C) Next/Tailwind/TS config" >> "$OUT"
for f in next.config.js next.config.mjs next.config.ts tsconfig.json tailwind.config.js tailwind.config.ts postcss.config.js postcss.config.cjs; do
  if [ -f "$f" ]; then
    echo "" >> "$OUT"
    echo "---- $f ----" >> "$OUT"
    cat "$f" >> "$OUT"
  fi
done

echo "" >> "$OUT"
echo "## D) Arborescence (selection)" >> "$OUT"
echo "" >> "$OUT"
echo "### Dossiers de routage" >> "$OUT"
echo "---- app/ ----" >> "$OUT";   if [ -d app ];   then find app   -maxdepth 2 -print >> "$OUT"; fi
echo "---- pages/ ----" >> "$OUT"; if [ -d pages ]; then find pages -maxdepth 2 -print >> "$OUT"; fi

echo "" >> "$OUT"
echo "### Public/" >> "$OUT"
if [ -d public ]; then find public -maxdepth 2 -print >> "$OUT"; fi

echo "" >> "$OUT"
echo "## E) Manifest Farcaster" >> "$OUT"
if [ -f public/.well-known/farcaster.json ]; then
  echo "---- farcaster.json ----" >> "$OUT"
  cat public/.well-known/farcaster.json >> "$OUT"
fi

echo "" >> "$OUT"
echo "## F) Routes utiles (dev local)" >> "$OUT"
echo "- /wheel" >> "$OUT"
echo "- /embed" >> "$OUT"
echo "- /preview-wheel.png, /dailywheel.png, /wheel-pointer.svg" >> "$OUT"
echo "- /.well-known/farcaster.json" >> "$OUT"

echo "" >> "$OUT"
echo "## G) Variables d'environnement attendues (NOMS seulement)" >> "$OUT"
echo "Renseigner ici les noms sans valeurs, ex: NEXT_PUBLIC_BASE_URL, BASE_API_KEY" >> "$OUT"

echo "" >> "$OUT"
echo "## H) TODO / Decisions" >> "$OUT"
echo "- UI roue: image finale ou CSS segments" >> "$OUT"
echo "- Logique spin: aleatoire, seede, API" >> "$OUT"
echo "- 1 spin par jour par FID, stockage et anti-abus" >> "$OUT"
echo "- Webhook/Base events si besoin" >> "$OUT"

find . -maxdepth 4 -print > docs/TREE_SNAPSHOT.txt

echo "OK"
