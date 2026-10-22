"""Construit les fichiers maîtres du logo « Il était une classe » (dragon-livre)."""
import os, math, sys
ICI = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, ICI)
from geom import transform, mul, T, S, bbox, stroke_outline, fmt
from glyphs import Font, shaped_path
CANARD, GRAPHITE = '#0B6A73', '#1E2226'
import sys
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ICI, 'sortie'); os.makedirs(OUT, exist_ok=True)
def hole(x,y,r): return f' M{x-r} {y} A{r} {r} 0 1 0 {x+r} {y} A{r} {r} 0 1 0 {x-r} {y} Z'
def disc(x,y,r): return 'M' + hole(x,y,r)[2:]
MIRROR = (-1,0,0,1,256,0)

# ---- dessin (coordonnées de conception) ----
PAGE = 'M122 120 C100 104 66 96 30 96 L18 82 L26 102 V200 C66 196 100 200 122 216 Z'
HEAD = ('M124 66 A28 28 0 0 1 162 40 C176 42 190 54 198 64 C204 72 200 84 190 86 L164 90 C150 96 142 106 140 122 H122 C118 104 118 86 124 66 Z'
        + hole(150,58,7.5) + hole(191,69,2.6))
PUPIL = disc(152,59,3.4)
HORNS = ['M136 50 C122 38 108 30 94 30 C104 38 114 50 123 62 Z', 'M152 44 C142 28 130 18 118 14 C126 24 132 36 137 48 Z']
SPIKES = 'M121 82 L108 86 L119 95 Z M119 99 L106 104 L118 112 Z'
SMOKE = [disc(214,68,6), disc(228,56,4)]
TAIL_CUBICS = [((128,212),(127,224),(122,232),(110,231)), ((110,231),(98,230),(94,215),(82,215)),
               ((82,215),(70,215),(66,230),(54,229)), ((54,229),(50,229),(47,226),(45,223))]
def arrow(E, d):
    L = math.hypot(*d); dx, dy = d[0]/L, d[1]/L; nx, ny = -dy, dx
    p = lambda a,b: f'{fmt(a)} {fmt(b)}'
    return (f'M{p(E[0]+17*dx, E[1]+17*dy)} L{p(E[0]-5*dx+11*nx, E[1]-5*dy+11*ny)} L{p(E[0]+dx, E[1]+dy)} '
            f'L{p(E[0]-5*dx-11*nx, E[1]-5*dy-11*ny)} Z')
TAIL = [stroke_outline(TAIL_CUBICS, 9), arrow((45,223), (-0.8,-0.6))]

# version petite : livre plus ouvert au dos, tête agrandie, sans détails fins
PAGE_S = 'M117 122 C97 108 64 100 28 100 L14 82 L24 106 V204 C64 200 96 204 117 220 Z'
HEAD_S = ('M124 66 A28 28 0 0 1 162 40 C176 42 190 54 198 64 C204 72 200 84 190 86 L164 90 C150 96 142 106 140 122 H122 C118 104 118 86 124 66 Z'
          + hole(151,58,8))
SPIKES_S = 'M121 80 L106 86 L119 96 Z'
def scaled(d, s, cx, cy): return transform(d, mul(T(cx,cy), mul(S(s), T(-cx,-cy))))

def pieces(kind):
    """Liste de chemins (couleur unique) d'une version du symbole."""
    if kind == 'petit':
        ps = [PAGE_S, transform(PAGE_S, MIRROR)]
        ps += [transform(scaled(d, 1.26, 131, 122), T(0, 12)) for d in [HEAD_S] + HORNS + [SPIKES_S]]
        return ps
    ps = [PAGE, transform(PAGE, MIRROR), HEAD, PUPIL] + HORNS + [SPIKES] + TAIL
    if kind == 'grand': ps += SMOKE
    return ps
def fit(ds, box=256, pad=14, lift=0.012):
    x0,y0,x1,y1 = bbox(ds); w, h = x1-x0, y1-y0; s = (box-2*pad)/max(w,h)
    tx = (box - w*s)/2 - x0*s; ty = (box - h*s)/2 - y0*s - lift*box
    m = (s,0,0,s,tx,ty); return [transform(d, m) for d in ds]

def svg(w, h, body, title, vb_x=0, vb_y=0):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{fmt(vb_x)} {fmt(vb_y)} {fmt(w)} {fmt(h)}" width="{fmt(w)}" height="{fmt(h)}" '
            f'role="img" aria-labelledby="titre"><title id="titre">{title}</title>{body}</svg>\n')
def group(ds, color, gid): return f'<g id="{gid}" fill="{color}" fill-rule="evenodd">' + ''.join(f'<path d="{d}"/>' for d in ds) + '</g>'

SYMBOLS = {k: fit(pieces(k)) for k in ('grand', 'moyen', 'petit')}
NOMS = {'grand': 'grand, avec fumée', 'moyen': 'moyen, sans fumée', 'petit': 'petit, pour les icônes'}
for k, ds in SYMBOLS.items():
    open(f'{OUT}/dragon-{k}.svg','w').write(svg(256, 256, group(ds, CANARD, 'symbole'), f'Il était une classe — dragon {NOMS[k]}'))

# ---- nom ----
# Cursive traditionnelle des écoles françaises, celle de tout le site (décidé le 22 octobre 2026),
# mise en forme par HarfBuzz et au trait épaissi d'un contour de sa couleur.
POLICE = os.environ.get('POLICE', os.path.join(ICI, 'PlaywriteFRTrad-400.ttf'))
F = Font(POLICE)
EPAIS = 0.035                                      # épaississement, en fraction du corps
def x_height(size):
    c = F.contours(F.cmap[ord('x')]); return max(p[1] for cc in c for p in cc) * size / F.upm
def nom(text, size, x0, base): return shaped_path(F, POLICE, text, size, x0, base)
def groupe_nom(d, size):
    return (f'<g id="nom" fill="{GRAPHITE}" stroke="{GRAPHITE}" stroke-width="{fmt(EPAIS*size)}" '
            f'stroke-linejoin="round"><path d="{d}"/></g>')
NAMES = {'fr': ('Il était une classe', ('Il était', 'une classe')), 'en': ('Once Upon a Classroom', ('Once Upon', 'a Classroom'))}

def horizontal(lang, kind='moyen'):
    ds = fit(pieces(kind), pad=0, lift=0)          # symbole sans marge, hauteur 256
    sx0, sy0, sx1, sy1 = bbox(ds); sh = sy1 - sy0
    px0, py0, px1, py1 = bbox(ds[:2])              # les deux pages
    size = 132; xh = x_height(size)
    base = (py0 + py1)/2 + xh/2 + 6                # minuscules centrées sur le livre
    gap = 0.14 * sh; pad = 0.12 * sh
    d, w = nom(NAMES[lang][0], size, sx1 + gap, base)
    tx0, ty0, tx1, ty1 = bbox([d]); m = EPAIS*size
    x0, y0 = sx0 - pad, min(sy0, ty0 - m) - pad
    x1, y1 = max(sx1 + gap + w, tx1 + m) + pad, max(sy1, ty1 + m) + pad
    body = group(ds, CANARD, 'symbole') + groupe_nom(d, size)
    return svg(x1 - x0, y1 - y0, body, NAMES[lang][0], vb_x=x0, vb_y=y0)

def stacked(lang, kind='grand'):
    ds = fit(pieces(kind), pad=0, lift=0); sx0, sy0, sx1, sy1 = bbox(ds); scx = (sx0 + sx1)/2; sh = sy1 - sy0
    size = 104; l1, l2 = NAMES[lang][1]
    t1, w1 = nom(l1, size, 0, 0); t2, w2 = nom(l2, size, 0, 0)
    _, a1, _, d1_ = bbox([t1]); _, a2, _, _ = bbox([t2])   # hampes au-dessus (négatif), jambages au-dessous
    b1 = sy1 + 0.12*sh - a1; b2 = b1 + d1_ - a2 + 0.06*size  # les lignes ne se touchent pas
    d1, _ = nom(l1, size, scx - w1/2, b1); d2, _ = nom(l2, size, scx - w2/2, b2)
    tx0, ty0, tx1, ty1 = bbox([d1, d2]); m = EPAIS*size; pad = 0.12 * sh
    x0 = min(sx0, tx0 - m) - pad; x1 = max(sx1, tx1 + m) + pad; y1 = ty1 + m + pad
    body = group(ds, CANARD, 'symbole') + groupe_nom(d1 + ' ' + d2, size)
    return svg(x1 - x0, y1 - (sy0 - pad), body, NAMES[lang][0], vb_x=x0, vb_y=sy0 - pad)

def wordmark(lang):
    size = 132; d, w = nom(NAMES[lang][0], size, 0, 0)
    tx0, ty0, tx1, ty1 = bbox([d]); m = EPAIS*size + 12
    return svg(tx1 - tx0 + 2*m, ty1 - ty0 + 2*m, groupe_nom(d, size), NAMES[lang][0], vb_x=tx0 - m, vb_y=ty0 - m)

for lang, slug in (('fr', 'il-etait-une-classe'), ('en', 'once-upon-a-classroom')):
    open(f'{OUT}/{slug}-horizontal.svg','w').write(horizontal(lang))
    open(f'{OUT}/{slug}-empile.svg','w').write(stacked(lang))
    open(f'{OUT}/{slug}-nom.svg','w').write(wordmark(lang))
print('ok', sorted(os.listdir(OUT)))
