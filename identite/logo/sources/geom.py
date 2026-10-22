"""Outils de géométrie : transformer des chemins SVG absolus, contourner un trait, boîte englobante."""
import re, math
TOK = re.compile(r'[MLHVCQAZ]|-?\d*\.?\d+(?:e-?\d+)?')
def parse(d):
    t = TOK.findall(d); out = []; i = 0; cmd = None
    ar = {'M':2,'L':2,'H':1,'V':1,'C':6,'Q':4,'A':7,'Z':0}
    while i < len(t):
        if t[i].isalpha(): cmd = t[i]; i += 1
        if cmd == 'Z': out.append(('Z',[])); continue
        n = ar[cmd]; out.append((cmd, [float(v) for v in t[i:i+n]])); i += n
        if cmd == 'M': cmd = 'L'
    return out
def fmt(v): s = f'{v:.2f}'.rstrip('0').rstrip('.'); return '0' if s in ('-0','') else s
def transform(d, m):
    a,b,c,dd,e,f = m; det = a*dd-b*c; sc = math.sqrt(abs(det))
    P = lambda x,y: (a*x+c*y+e, b*x+dd*y+f)
    out = []; cx = cy = 0
    for cmd, v in parse(d):
        if cmd == 'Z': out.append('Z'); continue
        if cmd == 'H': v = [v[0], cy]; cmd = 'L'
        elif cmd == 'V': v = [cx, v[0]]; cmd = 'L'
        if cmd == 'A':
            rx, ry, rot, la, sw, x, y = v; X, Y = P(x, y)
            if det < 0: sw = 1 - sw
            out.append(f'A{fmt(rx*sc)} {fmt(ry*sc)} {fmt(rot)} {int(la)} {int(sw)} {fmt(X)} {fmt(Y)}'); cx, cy = x, y; continue
        pts = [P(v[k], v[k+1]) for k in range(0, len(v), 2)]
        out.append(cmd + ' '.join(f'{fmt(x)} {fmt(y)}' for x,y in pts)); cx, cy = v[-2], v[-1]
    return ' '.join(out)
def mul(m1, m2):
    a1,b1,c1,d1,e1,f1 = m1; a2,b2,c2,d2,e2,f2 = m2
    return (a1*a2+c1*b2, b1*a2+d1*b2, a1*c2+c1*d2, b1*c2+d1*d2, a1*e2+c1*f2+e1, b1*e2+d1*f2+f1)
def T(x,y): return (1,0,0,1,x,y)
def S(s,sy=None): return (s,0,0,s if sy is None else sy,0,0)
def points(d):
    """Points d'ancrage et de contrôle (boîte englobante prudente ; arcs approchés)."""
    pts = []; cx = cy = 0
    for cmd, v in parse(d):
        if cmd == 'Z': continue
        if cmd == 'A':
            rx, ry, _, la, sw, x, y = v
            mx, my = (cx+x)/2, (cy+y)/2
            pts += [(x, y), (mx-rx, my), (mx+rx, my), (mx, my-ry), (mx, my+ry)] if la else [(x,y)]
            # arc court : on approxime par le point milieu bombé
            if not la:
                dx, dy = x-cx, y-cy; L = math.hypot(dx, dy) or 1; h = rx - math.sqrt(max(rx*rx-(L/2)**2, 0))
                n = (dy/L, -dx/L) if sw else (-dy/L, dx/L); pts.append((mx+n[0]*h, my+n[1]*h))
            cx, cy = x, y; continue
        if cmd == 'H': v = [v[0], cy]
        if cmd == 'V': v = [cx, v[0]]
        pts += [(v[k], v[k+1]) for k in range(0, len(v), 2)]; cx, cy = v[-2], v[-1]
    return pts
def bbox(ds):
    p = [q for d in ds for q in points(d)]
    return min(x for x,_ in p), min(y for _,y in p), max(x for x,_ in p), max(y for _,y in p)
# --- contour d'un trait (Tiller-Hanson sur cubiques subdivisées) ---
def split(c, t=.5):
    (x0,y0),(x1,y1),(x2,y2),(x3,y3) = c
    L = lambda a,b: (a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t)
    p01, p12, p23 = L(c[0],c[1]), L(c[1],c[2]), L(c[2],c[3]); a, b = L(p01,p12), L(p12,p23); m = L(a,b)
    return (c[0],p01,a,m), (m,b,p23,c[3])
def offset_cubic(c, r):
    def nrm(p, q):
        dx, dy = q[0]-p[0], q[1]-p[1]; L = math.hypot(dx, dy) or 1e-9; return (-dy/L*r, dx/L*r)
    p0,p1,p2,p3 = c
    if math.hypot(p1[0]-p0[0], p1[1]-p0[1]) < 1e-6: p1 = p2
    if math.hypot(p3[0]-p2[0], p3[1]-p2[1]) < 1e-6: p2 = p1
    n0, n1, n2 = nrm(p0,p1), nrm(p1,p2), nrm(p2,p3)
    a = (p0[0]+n0[0], p0[1]+n0[1]); d_ = (p3[0]+n2[0], p3[1]+n2[1])
    def inter(pa, va, pb, vb):
        den = va[0]*vb[1]-va[1]*vb[0]
        if abs(den) < 1e-9: return None
        t = ((pb[0]-pa[0])*vb[1]-(pb[1]-pa[1])*vb[0])/den; return (pa[0]+va[0]*t, pa[1]+va[1]*t)
    m1 = (p1[0]+n1[0], p1[1]+n1[1]); m2 = (p2[0]+n1[0], p2[1]+n1[1])
    b = inter(a, (p1[0]-p0[0], p1[1]-p0[1]), m1, (p2[0]-p1[0], p2[1]-p1[1])) or (p1[0]+n0[0], p1[1]+n0[1])
    c_ = inter(d_, (p2[0]-p3[0], p2[1]-p3[1]), m2, (p1[0]-p2[0], p1[1]-p2[1])) or (p2[0]+n2[0], p2[1]+n2[1])
    return (a, b, c_, d_)
def stroke_outline(cubics, w, depth=2):
    """Contour fermé d'un trait de largeur w : bout de départ rond, bout d'arrivée droit."""
    segs = list(cubics)
    for _ in range(depth): segs = [h for c in segs for h in split(c)]
    r = w/2; left = [offset_cubic(c, r) for c in segs]; right = [offset_cubic(tuple(reversed(c)), r) for c in reversed(segs)]
    P = lambda p: f'{fmt(p[0])} {fmt(p[1])}'
    d = 'M' + P(left[0][0]) + ''.join(f' C{P(c[1])} {P(c[2])} {P(c[3])}' for c in left)
    d += ' L' + P(right[0][0]) + ''.join(f' C{P(c[1])} {P(c[2])} {P(c[3])}' for c in right)
    d += f' A{fmt(r)} {fmt(r)} 0 0 0 ' + P(left[0][0]) + ' Z'
    return d
