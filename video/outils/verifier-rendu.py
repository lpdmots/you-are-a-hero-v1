"""Contrôle d'un rendu de tuto, sans bibliothèque (ffmpeg seul) :

  python3 outils/verifier-rendu.py rendus/<tuto>-web.mp4

1. Les images isolées : une image qui diffère de ses deux voisines, elles-mêmes semblables (la
   caméra à une autre place le temps d'une image, tuto 8), sur l'écran entier puis sur les bandes
   du haut et du bas.
2. La bande de la table en bas de l'écran alors que le milieu est la feuille (le bas de la feuille
   grossie coupé au rendu, tutos 8 à 10 rendus à deux processus). Un vrai bord de la feuille, voulu
   quand la caméra regarde le bas d'un écran, est relevé aussi : regarder l'image (coin arrondi et
   ombre : voulu ; coupe droite à travers le contenu : défaut).
"""
import subprocess
import sys

video = sys.argv[1]
FPS = 30


def images(w, h, fmt):
    raw = subprocess.run(
        ["ffmpeg", "-loglevel", "error", "-i", video, "-vf", f"fps={FPS},scale={w}:{h}:flags=area,format={fmt}", "-f", "rawvideo", "-"],
        capture_output=True, check=True,
    ).stdout
    taille = w * h * (3 if fmt == "rgb24" else 1)
    return [raw[i * taille:(i + 1) * taille] for i in range(len(raw) // taille)]


# 1. Images isolées
W, H = 96, 54
grises = images(W, H, "gray")


def ecart(a, b, y0, y1):
    return sum(abs(a[i] - b[i]) for i in range(y0 * W, y1 * W)) / ((y1 - y0) * W)


isolees = []
for zone, (y0, y1) in {"écran": (0, H), "haut": (0, 8), "bas": (H - 8, H)}.items():
    for i in range(1, len(grises) - 1):
        a = ecart(grises[i - 1], grises[i], y0, y1)
        b = ecart(grises[i], grises[i + 1], y0, y1)
        c = ecart(grises[i - 1], grises[i + 1], y0, y1)
        if a > 4 and b > 4 and c < min(a, b) / 3:
            isolees.append(f"{zone} {i / FPS:.2f} s")
print(f"{len(grises)} images ; images isolées : {', '.join(isolees) if isolees else 'aucune'}")

# 2. Bande de la table en bas, la feuille au milieu
W, H = 64, 36
couleurs = images(W, H, "rgb24")


def table(img, x, y):
    o = (y * W + x) * 3
    r, b = img[o], img[o + 2]
    return r - b >= 7 and r > 200


bandes, debut = [], None
for i, img in enumerate(couleurs + [None]):
    oui = img is not None and (
        sum(table(img, x, H - 1) for x in range(W)) / W > 0.9
        and sum(table(img, x, H // 2) for x in range(W)) / W < 0.3
        and not table(img, 0, H // 2)
    )
    if oui and debut is None:
        debut = i
    elif not oui and debut is not None:
        if i - debut > 3:
            bandes.append(f"{debut / FPS:.2f}–{(i - 1) / FPS:.2f} s")
        debut = None
print(f"table en bas, la feuille au milieu (à regarder) : {', '.join(bandes) if bandes else 'jamais'}")
