#!/bin/sh
# Capture pleine page d'une vue de la maquette : capturer.sh <chemin#hash> <largeur> <hauteur> <sortie.png>
CH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
"$CH" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
  --virtual-time-budget=6000 --window-size="$2,$3" --screenshot="$4" "http://127.0.0.1:4827/$1" >/dev/null 2>&1
