"""Lecteur minimal TrueType (.ttf ou .woff) : contours de glyphes et crénage GPOS, pour vectoriser un mot."""
import struct, zlib
class Font:
    def __init__(self, path):
        b = open(path,'rb').read(); self.t = {}
        if b[:4] == b'wOFF':
            num = struct.unpack('>H', b[12:14])[0]
            for i in range(num):
                tag, off, clen, olen, _ = struct.unpack('>4sIIII', b[44+20*i:64+20*i])
                data = b[off:off+clen]
                self.t[tag.decode()] = zlib.decompress(data) if clen < olen else data
        else:  # TrueType ordinaire (.ttf)
            num = struct.unpack('>H', b[4:6])[0]
            for i in range(num):
                tag, _, off, ln = struct.unpack('>4sIII', b[12+16*i:28+16*i])
                self.t[tag.decode()] = b[off:off+ln]
        h = self.t['head']; self.upm = struct.unpack('>H', h[18:20])[0]; self.locfmt = struct.unpack('>h', h[50:52])[0]
        self.nglyphs = struct.unpack('>H', self.t['maxp'][4:6])[0]
        nhm = struct.unpack('>H', self.t['hhea'][34:36])[0]
        hm = self.t['hmtx']; self.adv = []
        for g in range(self.nglyphs):
            i = min(g, nhm-1); self.adv.append(struct.unpack('>H', hm[4*i:4*i+2])[0])
        lo = self.t['loca']
        if self.locfmt == 0: self.loca = [2*struct.unpack('>H', lo[2*i:2*i+2])[0] for i in range(self.nglyphs+1)]
        else: self.loca = [struct.unpack('>I', lo[4*i:4*i+4])[0] for i in range(self.nglyphs+1)]
        self.cmap = self._cmap(); self.kern = self._gpos_kern()
    def _cmap(self):
        c = self.t['cmap']; n = struct.unpack('>H', c[2:4])[0]; m = {}
        for i in range(n):
            pid, eid, off = struct.unpack('>HHI', c[4+8*i:12+8*i])
            fmt = struct.unpack('>H', c[off:off+2])[0]
            if fmt == 4:
                seg = struct.unpack('>H', c[off+6:off+8])[0]//2
                ends = struct.unpack(f'>{seg}H', c[off+14:off+14+2*seg]); p = off+16+2*seg
                starts = struct.unpack(f'>{seg}H', c[p:p+2*seg]); p += 2*seg
                deltas = struct.unpack(f'>{seg}h', c[p:p+2*seg]); p += 2*seg
                ro_off = p; ros = struct.unpack(f'>{seg}H', c[p:p+2*seg])
                for s in range(seg):
                    for ch in range(starts[s], ends[s]+1):
                        if ch == 0xFFFF: continue
                        if ros[s] == 0: g = (ch + deltas[s]) & 0xFFFF
                        else:
                            a = ro_off + 2*s + ros[s] + 2*(ch-starts[s]); g = struct.unpack('>H', c[a:a+2])[0]
                            if g: g = (g + deltas[s]) & 0xFFFF
                        m.setdefault(ch, g)
        return m
    def contours(self, g, dx=0, dy=0, sc=(1,0,0,1)):
        gl = self.t['glyf']; s, e = self.loca[g], self.loca[g+1]
        if s == e: return []
        d = gl[s:e]; nc = struct.unpack('>h', d[:2])[0]
        if nc < 0:
            out = []; p = 10
            while True:
                flags, gi = struct.unpack('>HH', d[p:p+4]); p += 4
                if flags & 1: a1, a2 = struct.unpack('>hh', d[p:p+4]); p += 4
                else: a1, a2 = struct.unpack('>bb', d[p:p+2]); p += 2
                m = (1,0,0,1)
                if flags & 8: v = struct.unpack('>h', d[p:p+2])[0]/16384; p += 2; m = (v,0,0,v)
                elif flags & 0x40: x, y = struct.unpack('>hh', d[p:p+4]); p += 4; m = (x/16384,0,0,y/16384)
                elif flags & 0x80: m = tuple(v/16384 for v in struct.unpack('>hhhh', d[p:p+8])); p += 8
                out += self.contours(gi, dx+a1, dy+a2, m)
                if not flags & 0x20: break
            return out
        ends = struct.unpack(f'>{nc}H', d[10:10+2*nc]); p = 10+2*nc
        il = struct.unpack('>H', d[p:p+2])[0]; p += 2+il
        npts = ends[-1]+1; flags = []
        while len(flags) < npts:
            f = d[p]; p += 1; flags.append(f)
            if f & 8: r = d[p]; p += 1; flags += [f]*r
        xs = []; v = 0
        for f in flags:
            if f & 2: dd = d[p]; p += 1; v += dd if f & 16 else -dd
            elif not f & 16: v += struct.unpack('>h', d[p:p+2])[0]; p += 2
            xs.append(v)
        ys = []; v = 0
        for f in flags:
            if f & 4: dd = d[p]; p += 1; v += dd if f & 32 else -dd
            elif not f & 32: v += struct.unpack('>h', d[p:p+2])[0]; p += 2
            ys.append(v)
        a,b,c_,dd_ = sc
        pts = [(a*x+c_*y+dx, b*x+dd_*y+dy, bool(f & 1)) for x,y,f in zip(xs,ys,flags)]
        res = []; st = 0
        for en in ends: res.append(pts[st:en+1]); st = en+1
        return res
    def _gpos_kern(self):
        k = {}
        if 'GPOS' not in self.t: return k
        G = self.t['GPOS']; ll = struct.unpack('>H', G[8:10])[0]
        n = struct.unpack('>H', G[ll:ll+2])[0]
        def cov(o):
            fmt = struct.unpack('>H', G[o:o+2])[0]; n = struct.unpack('>H', G[o+2:o+4])[0]
            if fmt == 1: return list(struct.unpack(f'>{n}H', G[o+4:o+4+2*n]))
            r = []
            for i in range(n):
                s, e, si = struct.unpack('>HHH', G[o+4+6*i:o+10+6*i]); r += list(range(s, e+1))
            return r
        def cls(o):
            fmt = struct.unpack('>H', G[o:o+2])[0]; m = {}
            if fmt == 1:
                s, n = struct.unpack('>HH', G[o+2:o+6])
                for i in range(n): m[s+i] = struct.unpack('>H', G[o+6+2*i:o+8+2*i])[0]
            else:
                n = struct.unpack('>H', G[o+2:o+4])[0]
                for i in range(n):
                    s, e, c = struct.unpack('>HHH', G[o+4+6*i:o+10+6*i])
                    for g in range(s, e+1): m[g] = c
            return m
        def vsize(f): return 2*bin(f & 0xFF).count('1')
        def xadv(o, f):
            p = o
            for bit in range(8):
                if f & (1 << bit):
                    if bit == 2: return struct.unpack('>h', G[p:p+2])[0]
                    p += 2
            return 0
        def pair(o):
            fmt, co, f1, f2 = struct.unpack('>HHHH', G[o:o+8]); first = cov(o+co); s1, s2 = vsize(f1), vsize(f2)
            if fmt == 1:
                n = struct.unpack('>H', G[o+10:o+12])[0]
                for i, g in enumerate(first[:n]):
                    ps = o + struct.unpack('>H', G[o+12+2*i:o+14+2*i])[0]; c = struct.unpack('>H', G[ps:ps+2])[0]
                    for j in range(c):
                        r = ps+2+j*(2+s1+s2); g2 = struct.unpack('>H', G[r:r+2])[0]
                        v = xadv(r+2, f1)
                        if v: k.setdefault((g, g2), v)
            else:
                cd1, cd2, n1, n2 = struct.unpack('>HHHH', G[o+8:o+16]); c1 = cls(o+cd1); c2 = cls(o+cd2)
                rec = s1+s2
                for g in first:
                    a = c1.get(g, 0)
                    for g2, b_ in list(c2.items()) + [(None, 0)]:
                        if g2 is None: continue
                        r = o+16+(a*n2+b_)*rec; v = xadv(r, f1)
                        if v: k.setdefault((g, g2), v)
        for i in range(n):
            lo = ll + struct.unpack('>H', G[ll+2+2*i:ll+4+2*i])[0]
            typ, flag, sc = struct.unpack('>HHH', G[lo:lo+6])
            for j in range(sc):
                so = lo + struct.unpack('>H', G[lo+6+2*j:lo+8+2*j])[0]
                if typ == 9:
                    et, eo = struct.unpack('>HI', G[so+2:so+8])
                    if et == 2: pair(so+eo)
                elif typ == 2: pair(so)
        return k
def contour_to_d(pts, sx, sy, ox, oy):
    def P(p): return (ox + p[0]*sx, oy - p[1]*sy)
    n = len(pts); 
    if not n: return ''
    # point de départ sur la courbe
    st = next((i for i,p in enumerate(pts) if p[2]), None)
    if st is None:
        a, b = pts[0], pts[1]; start = ((a[0]+b[0])/2, (a[1]+b[1])/2, True); seq = pts[1:]+pts[:1]
    else:
        start = pts[st]; seq = pts[st+1:]+pts[:st]
    x, y = P(start); out = [f'M{x:.1f} {y:.1f}']; ctrl = None
    for p in seq + [start]:
        if p[2]:
            x, y = P(p)
            out.append(f'Q{P(ctrl)[0]:.1f} {P(ctrl)[1]:.1f} {x:.1f} {y:.1f}' if ctrl else f'L{x:.1f} {y:.1f}'); ctrl = None
        else:
            if ctrl:
                mid = ((ctrl[0]+p[0])/2, (ctrl[1]+p[1])/2); mx, my = P(mid)
                out.append(f'Q{P(ctrl)[0]:.1f} {P(ctrl)[1]:.1f} {mx:.1f} {my:.1f}')
            ctrl = p
    return ' '.join(out) + ' Z'
def word_path(font, text, size, x0, baseline, tracking=0, extra=None):
    """Chemin SVG d'un mot ; extra = {index: décalage en unités} pour les retouches d'espacement."""
    s = size / font.upm; x = 0; ds = []; prev = None
    for i, ch in enumerate(text):
        g = font.cmap.get(ord(ch), 0)
        if prev is not None: x += font.kern.get((prev, g), 0)
        if extra and i in extra: x += extra[i]
        for c in font.contours(g): ds.append(contour_to_d(c, s, s, x0 + x*s, baseline))
        x += font.adv[g] + tracking; prev = g
    return ' '.join(ds), x*s
def shaped_path(font, path, text, size, x0, baseline):
    """Comme word_path, mais mis en forme par HarfBuzz (attaques, liaisons, crénage de la police) :
    indispensable pour une cursive. Demande le paquet Python `uharfbuzz`."""
    import uharfbuzz as hb
    face = hb.Face(hb.Blob.from_file_path(path)); hf = hb.Font(face)
    buf = hb.Buffer(); buf.add_str(text); buf.guess_segment_properties()
    hb.shape(hf, buf, {})
    s = size / font.upm; x = 0; ds = []
    for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
        ox, oy = x + pos.x_offset, pos.y_offset
        for c in font.contours(info.codepoint): ds.append(contour_to_d(c, s, s, x0 + ox*s, baseline - oy*s))
        x += pos.x_advance
    return ' '.join(ds), x*s
