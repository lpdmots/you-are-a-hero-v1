#!/bin/bash
# Rendu complet de la visite : recompose index.html depuis les passages (sinon les retouches des
# scenes/*.html n'y entrent pas), refait la bande-son, rend la vidéo puis sa version pour le site.
#   outils/rendre.sh <nom>        → rendus/<nom>.mp4 et rendus/<nom>-web.mp4
# Le studio doit tourner (configuration « video-studio », port 4850) : le mixage y lit les temps.
set -euo pipefail
cd "$(dirname "$0")/.."
VOIX=${VOIX:-jUHQdLfy668sllNiNTSW}   # Clément, retenu par le porteur le 23 octobre 2026
export VIDEO=${VIDEO:-visite}         # le dossier de la vidéo dans V1/video
NOM=${1:?nom du rendu}
export PATH="$HOME/Projets/hyperframes-shorts/.tools/bin:$PATH"
node outils/preparer.mjs --voix "$VOIX" --vitesse 1
node outils/mixer.mjs
(cd "$VIDEO" && "$HOME/Projets/hyperframes-shorts/node_modules/.bin/hyperframes" render --quality high --output "../rendus/$NOM.mp4" | grep -E "completed|rror" || true)
ffmpeg -hide_banner -loglevel error -y -i "rendus/$NOM.mp4" -c:v libx264 -preset slow -crf 21 -pix_fmt yuv420p -c:a aac -b:a 160k -movflags +faststart "rendus/$NOM-web.mp4"
cp "$VIDEO"/*.vtt rendus/ 2>/dev/null || true
# l'affiche (image d'attente du lecteur et image du VideoObject) : le titre du passage 1 écrit, rien en mouvement
ffmpeg -hide_banner -loglevel error -y -ss "${AFFICHE:-8.45}" -i "rendus/$NOM.mp4" -frames:v 1 -c:v libwebp -quality 82 "rendus/$NOM.webp"
ls -la "rendus/$NOM-web.mp4" "rendus/$NOM.webp"
