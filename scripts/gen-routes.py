#!/usr/bin/env python3
"""يولّد مسارات القوافل البرية والبحرية من صورة الخريطة (brand/img/map/world.webp):
تصنيف الماء واليابسة بالألوان ثم أقصر طريق على شبكة. الناتج src/engine/09d-routes.js.
التشغيل: python3 scripts/gen-routes.py  (يحتاج Pillow وnumpy)"""
import heapq, json, math, os, subprocess, sys
import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W, H, Y0, CELL = 1000, 560, 60, 4
im = Image.open(os.path.join(ROOT, 'brand/img/map/world.webp')).convert('RGB').resize((W, H), Image.LANCZOS)
a = np.asarray(im).astype(int); r, g, b = a[..., 0], a[..., 1], a[..., 2]
water0 = ((b > r + 8) & (g > r + 3)).astype('uint8') * 255
opened = Image.fromarray(water0).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.MaxFilter(3))  # فتح: يزيل الأنهار الرفيعة
water = np.asarray(opened) > 0

# المدن من المحرك
cities = json.loads(subprocess.check_output(['node', '-e', "const E=require('./src/engine.js');const S=E.newGame(3);console.log(JSON.stringify(S.order.map(i=>({id:i,x:S.cities[i].x,y:S.cities[i].y}))))"], cwd=ROOT))
ports = ['jeddah', 'jazan', 'alex', 'mumbai', 'kolkata', 'guangzhou', 'shanghai']

def dil(mask, k):
    return np.asarray(Image.fromarray(mask.astype('uint8') * 255).filter(ImageFilter.MaxFilter(k))) > 0
landOK = ~dil(water, 5)          # يابسة بهامش عن الساحل
seaOK = ~dil(~water, 3)          # ماء بهامش أصغر لتبقى المضائق مفتوحة
# ثغرة السويس: ممر ضيق يصل المتوسط بالبحر الأحمر لسفن الخريطة (تبسيط: القاعدة الحالية تعدّ الإسكندرية وجدة بحراً واحداً)
SUEZ = [(172, 124), (166, 136), (158, 148), (161, 160), (165, 171), (170, 184)]
BAB = [(288, 394), (294, 404), (299, 412)]          # باب المندب
MALACCA = [(845, 462), (862, 480), (878, 497), (892, 510), (905, 520)]   # مضيق ملقا بين شبه الجزيرة وسومطرة
def corridor(mask, pts, rad):
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        n = int(max(abs(x1 - x0), abs(y1 - y0)) * 2)
        for i in range(n + 1):
            x = x0 + (x1 - x0) * i / n; y = y0 + (y1 - y0) * i / n
            mask[int(y) - rad:int(y) + rad + 1, int(x) - rad:int(x) + rad + 1] = True
corridor(seaOK, SUEZ, 4); corridor(seaOK, BAB, 3); corridor(seaOK, MALACCA, 3)
corr = np.zeros((H, W), bool)
for _c in (SUEZ, BAB, MALACCA): corridor(corr, _c, 6)

GW, GH = W // CELL, H // CELL
def grid(ok, frac=1.0):
    gm = np.zeros((GH, GW), bool)
    for j in range(GH):
        for i in range(GW):
            blk = ok[j * CELL:(j + 1) * CELL, i * CELL:(i + 1) * CELL]
            gm[j, i] = blk.all() if frac >= 1 else blk.mean() >= frac
    return gm
def los(ok, p, q):
    n = int(math.hypot(q[0] - p[0], q[1] - p[1]) * 2) + 1
    for k in range(n + 1):
        x = p[0] + (q[0] - p[0]) * k / n; y = p[1] + (q[1] - p[1]) * k / n
        if not ok[min(H - 1, max(0, int(y))), min(W - 1, max(0, int(x)))]: return False
    return True
def snap(gm, x, y):
    ci, cj = int(x // CELL), int(y // CELL)
    best = None
    for rad in range(0, 30):
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
    pos = {c['id']: (c['x'], c['y'] - Y0) for c in cities}
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
            sm = dp(sm, 0.8)
            key = '|'.join(sorted([a_, b_]))
            pl = [[round(x, 1), round(y + Y0, 1)] for x, y in sm]
            if key != a_ + '|' + b_: pl.reverse()
            out[key] = pl
    return out
def check(land, sea):
    """يتحقق أن كل مقطع بري على اليابسة وكل مقطع بحري على الماء (خارج محيط المدن والممرات الثلاثة)"""
    pos = {c['id']: (c['x'], c['y'] - Y0) for c in cities}; bad = []
    def near_corr(x, y):
        return bool(corr[min(H - 1, int(y)), min(W - 1, int(x))])
    for kind, routes in (('land', land), ('sea', sea)):
        for k, pl in routes.items():
            a_, b_ = k.split('|'); pts = [(p[0], p[1] - Y0) for p in pl]
            if math.hypot(pts[0][0] - pos[pl and (a_ if math.hypot(pts[0][0]-pos[a_][0], pts[0][1]-pos[a_][1]) < 1e-6 else b_)][0], 0) > 1e-6 and False: pass
            ends = [pos[a_], pos[b_]]; n = tot = wrong = 0
            rad = {e: 10 for e in ends}
            if kind == 'sea':   # الميناء قد يبعد عن الماء في الرسم (شنغهاي داخل اليابسة)، فيُستثنى محيطه بقدر بعده
                ys_, xs_ = np.nonzero(seaOK)
                for e in ends: rad[e] = max(10, float(np.hypot(xs_ - e[0], ys_ - e[1]).min()) + 12)
            for p, q in zip(pts, pts[1:]):
                m = int(math.hypot(q[0] - p[0], q[1] - p[1])) + 1
                for i in range(m + 1):
                    x = p[0] + (q[0] - p[0]) * i / m; y = p[1] + (q[1] - p[1]) * i / m
                    if any(math.hypot(x - ex, y - ey) < rad[(ex, ey)] for ex, ey in ends) or (kind == 'sea' and near_corr(x, y)): continue
                    tot += 1; isw = water[min(H - 1, int(y)), min(W - 1, int(x))]
                    if (kind == 'land' and isw) or (kind == 'sea' and not isw): wrong += 1
            if tot and wrong / tot > 0.01: bad.append('%s %s: %d من %d نقطة في الوسط الخطأ' % (kind, k, wrong, tot))
    return bad
ids = sorted(c['id'] for c in cities)
if '--check' in sys.argv:
    txt = subprocess.check_output(['node', '-e', "const s=require('fs').readFileSync('src/engine/09d-routes.js','utf8');const R=eval('('+s.match(/const ROUTES = (\\{[\\s\\S]*?\\});\\nfunction/)[1]+')');console.log(JSON.stringify(R))"], cwd=ROOT)
    R = json.loads(txt); bad = check(R['land'], R['sea'])
    nland = len(ids) * (len(ids) - 1) // 2; nsea = len(ports) * (len(ports) - 1) // 2
    if len(R['land']) != nland or len(R['sea']) != nsea: bad.append('عدد المسارات ناقص: بر %d من %d، بحر %d من %d' % (len(R['land']), nland, len(R['sea']), nsea))
    print('\n'.join(bad) if bad else 'المسارات سليمة'); sys.exit(1 if bad else 0)
land = build(ids, grid(landOK), landOK, 'بر')
sea = build(sorted(ports), grid(seaOK, 0.5), seaOK, 'بحر')
bad = check(land, sea)
if bad: print('\n'.join(bad)); sys.exit('مسارات تلمس الوسط الخطأ')
def plen(pl): return sum(math.hypot(p[0] - q[0], p[1] - q[1]) for p, q in zip(pl, pl[1:]))
pos = {c['id']: (c['x'], c['y']) for c in cities}
rat = []
for k, pl in land.items():
    a_, b_ = k.split('|'); st = math.hypot(pos[a_][0] - pos[b_][0], pos[a_][1] - pos[b_][1]); rat.append((plen(pl) / st, k))
rat.sort(); print('نسبة طول المسار البري إلى المستقيم: أدنى %.2f، وسيط %.2f، أعلى %.2f' % (rat[0][0], rat[len(rat) // 2][0], rat[-1][0]))
print('الأعلى:', [(round(x, 2), k) for x, k in rat[-6:]])
srat = []
for k, pl in sea.items():
    a_, b_ = k.split('|'); st = math.hypot(pos[a_][0] - pos[b_][0], pos[a_][1] - pos[b_][1]); srat.append((plen(pl) / st, k))
srat.sort(); print('البحر: أدنى %.2f أعلى %.2f' % (srat[0][0], srat[-1][0]), [(round(x, 2), k) for x, k in srat[-4:]])
js = lambda d: json.dumps(d, separators=(',', ':'))
src = """/* ---------- مسارات القوافل (مولَّدة بـ scripts/gen-routes.py من صورة الخريطة، لا تُعدَّل يدوياً) ----------
   مسارات برية على اليابسة فقط، ومسارات بحرية بين الموانئ على الماء فقط (تُقرأ بالاتجاهين). */
const ROUTES = { land: %s, sea: %s };
function routePath(a, b, sea) { const k = a < b ? a + '|' + b : b + '|' + a, pl = (sea ? ROUTES.sea : ROUTES.land)[k]; if (!pl) return null; return a < b ? pl : pl.slice().reverse(); }
function routeLen(a, b, sea) { const pl = routePath(a, b, sea); if (!pl) return 0; let s = 0; for (let i = 1; i < pl.length; i++) s += Math.hypot(pl[i][0] - pl[i - 1][0], pl[i][1] - pl[i - 1][1]); return s; }
""" % (js(land), js(sea))
open(os.path.join(ROOT, 'src/engine/09d-routes.js'), 'w').write(src)
print('كُتب src/engine/09d-routes.js', len(src) // 1024, 'KB')
