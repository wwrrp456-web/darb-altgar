#!/usr/bin/env python3
"""034 الخريطة الحية: يولّد مسارات العرض على اللوحة الجديدة (brand/lazy/map/board.webp، 2048×1024).
تصنيف الماء واليابسة بعتبات لون ثم أقصر طريق على شبكة خلايا 4px: برّاً لكل أزواج المدن، وبحراً لكل أزواج الموانئ
(مع ممرّات السويس وباب المندب وملقا). الناتج src/engine/09e-board-routes.js + test/fixtures/board-mask.json.
للعرض فقط: المحاكاة لا تقرأ هذه المسارات أبداً (المحاكاة على 09d-routes.js).
التشغيل: python3 scripts/gen-board-routes.py  (يحتاج Pillow وnumpy)
عتبات اللون (معايَرة على اللوحة): ماء = (b > r+8) و(g > r+3)؛ فتح 3×3 لإزالة الأنهار الرفيعة؛
يابسة بهامش = ما بعد توسيع الماء 9px؛ ماء بهامش = ما بعد توسيع اليابسة 3px؛ خلية البحر تُقبل بنسبة ماء ≥ 0.5."""
import heapq, json, math, os
import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W, H, CELL = 2048, 1024, 4
TH_B_R, TH_G_R = 8, 3
im = Image.open(os.path.join(ROOT, 'brand/lazy/map/board.webp')).convert('RGB')
assert im.size == (W, H)
a = np.asarray(im).astype(int); r, g, b = a[..., 0], a[..., 1], a[..., 2]
water0 = ((b > r + TH_B_R) & (g > r + TH_G_R)).astype('uint8') * 255
water = np.asarray(Image.fromarray(water0).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.MaxFilter(3))) > 0

CITIES = json.load(open(os.path.join(ROOT, 'brand/next/map-final/3/cities.json')))
pos = {k: (v['x'] * W, v['y'] * H) for k, v in CITIES.items()}
ports = ['jeddah', 'jazan', 'alex', 'mumbai', 'kolkata', 'guangzhou', 'shanghai']

def dil(mask, k):
    return np.asarray(Image.fromarray(mask.astype('uint8') * 255).filter(ImageFilter.MaxFilter(k))) > 0
landOK = ~dil(water, 9)
seaOK = ~dil(~water, 3)
# ممرّات (إحداثيات اللوحة 2048×1024): السويس بين المتوسط والبحر الأحمر، باب المندب، ملقا
SUEZ = [(216, 300), (216, 340), (216, 380), (216, 424)]
BAB = [(380, 756), (392, 768), (404, 780)]
MALACCA = [(1536, 792), (1556, 792), (1576, 792)]
def corridor(mask, pts, rad):
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        n = int(max(abs(x1 - x0), abs(y1 - y0)) * 2)
        for i in range(n + 1):
            x = x0 + (x1 - x0) * i / n; y = y0 + (y1 - y0) * i / n
            mask[int(y) - rad:int(y) + rad + 1, int(x) - rad:int(x) + rad + 1] = True
corridor(seaOK, SUEZ, 8); corridor(seaOK, BAB, 8); corridor(seaOK, MALACCA, 8)
corr = np.zeros((H, W), bool)
for _c in (SUEZ, BAB, MALACCA): corridor(corr, _c, 12)

GW, GH = W // CELL, H // CELL
def grid(ok, frac=1.0):
    blk = ok.reshape(GH, CELL, GW, CELL)
    return blk.all(axis=(1, 3)) if frac >= 1 else blk.mean(axis=(1, 3)) >= frac
def los(ok, p, q):
    n = int(math.hypot(q[0] - p[0], q[1] - p[1]) * 2) + 1
    t = np.linspace(0, 1, n + 1)
    xs = np.clip((p[0] + (q[0] - p[0]) * t).astype(int), 0, W - 1); ys = np.clip((p[1] + (q[1] - p[1]) * t).astype(int), 0, H - 1)
    return bool(ok[ys, xs].all())
def largest(gm):
    """أكبر مكوّن متصل (حتى لا تلتقط المدينة جزيرة صغيرة أو بحيرة قرب الساحل)"""
    from collections import deque
    lab = np.zeros((GH, GW), int); n = 0; sizes = {}
    for j in range(GH):
        for i in range(GW):
            if gm[j, i] and not lab[j, i]:
                n += 1; q = deque([(i, j)]); lab[j, i] = n; c = 1
                while q:
                    x, y = q.popleft()
                    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                        u, v = x + dx, y + dy
                        if 0 <= u < GW and 0 <= v < GH and gm[v, u] and not lab[v, u]: lab[v, u] = n; q.append((u, v)); c += 1
                sizes[n] = c
    return lab == max(sizes, key=sizes.get)
def snap(gm, x, y):
    ci, cj = int(x // CELL), int(y // CELL); best = None
    for rad in range(0, 40):
        for j in range(max(0, cj - rad), min(GH, cj + rad + 1)):
            for i in range(max(0, ci - rad), min(GW, ci + rad + 1)):
                if gm[j, i]:
                    d = math.hypot(i - ci, j - cj)
                    if best is None or d < best[0]: best = (d, i, j)
        if best: return best[1], best[2]
    raise SystemExit('لا خلية قريبة: %s,%s' % (x, y))
def dijkstra(gm, s):
    dist = {s: 0.0}; par = {}; pq = [(0.0, s)]
    while pq:
        d, u = heapq.heappop(pq)
        if d > dist.get(u, 1e18): continue
        ui, uj = u
        for di in (-1, 0, 1):
            for dj in (-1, 0, 1):
                if not di and not dj: continue
                vi, vj = ui + di, uj + dj
                if 0 <= vi < GW and 0 <= vj < GH and gm[vj, vi]:
                    if di and dj and not (gm[uj, vi] and gm[vj, ui]): continue
                    nd = d + math.hypot(di, dj)
                    if nd < dist.get((vi, vj), 1e18): dist[(vi, vj)] = nd; par[(vi, vj)] = u; heapq.heappush(pq, (nd, (vi, vj)))
    return dist, par
def dp(pts, tol):
    if len(pts) < 3: return pts
    (x0, y0), (x1, y1) = pts[0], pts[-1]; L = math.hypot(x1 - x0, y1 - y0) or 1e-9
    idx, md = 0, -1
    for i in range(1, len(pts) - 1):
        d = abs((y1 - y0) * pts[i][0] - (x1 - x0) * pts[i][1] + x1 * y0 - y1 * x0) / L
        if d > md: md, idx = d, i
    if md <= tol: return [pts[0], pts[-1]]
    return dp(pts[:idx + 1], tol)[:-1] + dp(pts[idx:], tol)
def build(ids, gm, ok, label):
    out = {}; snaps = {i: snap(gm, *pos[i]) for i in ids}
    for ai, a_ in enumerate(ids):
        dist, par = dijkstra(gm, snaps[a_])
        for b_ in ids[ai + 1:]:
            t = snaps[b_]
            if t not in dist: raise SystemExit('%s: لا مسار %s ← %s' % (label, a_, b_))
            cells = [t]
            while cells[-1] != snaps[a_]: cells.append(par[cells[-1]])
            cells.reverse()
            pts = [pos[a_]] + [((i + .5) * CELL, (j + .5) * CELL) for i, j in cells[1:-1]] + [pos[b_]]
            sm = [pts[0]]; k = 0
            while k < len(pts) - 1:
                m = len(pts) - 1
                while m > k + 1 and not los(ok, pts[k], pts[m]): m -= 1
                sm.append(pts[m]); k = m
            sm = dp(sm, 3.0)
            key = '|'.join(sorted([a_, b_]))
            pl = [[x / W, y / H] for x, y in sm]
            if key != a_ + '|' + b_: pl.reverse()
            out[key] = pl
    return out
def check(land, sea):
    """كل نقطة (مأخوذة كل 2px على المقاطع) برية على اليابسة وبحرية على الماء، خارج محيط المدن والممرّات"""
    bad = []
    for kind, routes in (('land', land), ('sea', sea)):
        for k, pl in routes.items():
            a_, b_ = k.split('|'); pts = [(p[0] * W, p[1] * H) for p in pl]
            ends = [pos[a_], pos[b_]]; n = tot = wrong = 0
            rad = {e: 14 for e in ends}
            if kind == 'sea':
                ys_, xs_ = np.nonzero(seaOK)
                for e in ends: rad[e] = max(14, float(np.hypot(xs_ - e[0], ys_ - e[1]).min()) + 16)
            for p, q in zip(pts, pts[1:]):
                m = int(math.hypot(q[0] - p[0], q[1] - p[1]) / 2) + 1
                for i in range(m + 1):
                    x = p[0] + (q[0] - p[0]) * i / m; y = p[1] + (q[1] - p[1]) * i / m
                    if any(math.hypot(x - ex, y - ey) < rad[(ex, ey)] for ex, ey in ends) or (kind == 'sea' and corr[min(H - 1, int(y)), min(W - 1, int(x))]): continue
                    tot += 1; isw = water[min(H - 1, int(y)), min(W - 1, int(x))]
                    if (kind == 'land' and isw) or (kind == 'sea' and not isw): wrong += 1
            if tot and wrong / tot > 0.02: bad.append('%s %s: %d من %d نقطة في الوسط الخطأ' % (kind, k, wrong, tot))
    return bad

ids = sorted(CITIES.keys())
land = build(ids, largest(grid(landOK)), landOK, 'بر')
sea = build(sorted(ports), largest(grid(seaOK, 0.5)), seaOK, 'بحر')
bad = check(land, sea)
if bad: print('\n'.join(bad)); raise SystemExit('مسارات تلمس الوسط الخطأ')
assert len(land) == len(ids) * (len(ids) - 1) // 2 and len(sea) == len(ports) * (len(ports) - 1) // 2
r3 = lambda v: round(v, 3)
def fix(d):
    o = {}
    for k, pl in d.items():
        a_, b_ = k.split('|'); first, last = (a_, b_) if k == a_ + '|' + b_ else (a_, b_)
        q = [[r3(x), r3(y)] for x, y in pl]
        q[0] = [CITIES[a_]['x'], CITIES[a_]['y']]; q[-1] = [CITIES[b_]['x'], CITIES[b_]['y']]
        o[k] = q
    return o
land, sea = fix(land), fix(sea)
js = lambda d: json.dumps(d, separators=(',', ':'))
src = """/* ---------- مسارات لوحة الخريطة الحية (034؛ مولَّدة بـ scripts/gen-board-routes.py من brand/lazy/map/board.webp، لا تُعدَّل يدوياً) ----------
   للعرض فقط: نسب 0–1 من اللوحة 2048×1024، أول نقطة وآخرها إحداثيات المدينتين. المحاكاة لا تقرؤها أبداً (هي على 09d-routes.js). */
const BOARD_ROUTES = { land: %s, sea: %s };
""" % (js(land), js(sea))
open(os.path.join(ROOT, 'src/engine/09e-board-routes.js'), 'w').write(src)
print('كُتب src/engine/09e-board-routes.js', len(src), 'حرفاً؛ برّي', len(land), 'بحري', len(sea))

# قناع منخفض الدقة للاختبار: خلية 16px، رقم 0-9 = نسبة الماء، والممرّات حرف c
MC = 16; mw, mh = W // MC, H // MC
wf = water.reshape(mh, MC, mw, MC).mean(axis=(1, 3)); cf = corr.reshape(mh, MC, mw, MC).any(axis=(1, 3))
rows = [''.join('c' if cf[j, i] else str(min(9, int(wf[j, i] * 10))) for i in range(mw)) for j in range(mh)]
os.makedirs(os.path.join(ROOT, 'test/fixtures'), exist_ok=True)
json.dump({'w': mw, 'h': mh, 'cell': MC, 'note': 'رقم = نسبة الماء في الخلية (0-9)، c = ممرّ (سويس/باب المندب/ملقا). من scripts/gen-board-routes.py', 'rows': rows},
          open(os.path.join(ROOT, 'test/fixtures/board-mask.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
print('كُتب test/fixtures/board-mask.json')
