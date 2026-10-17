"""يقصّ شبكات الأيقونات (٤ أعمدة × صفّين) المولَّدة بأدوات خارجية إلى أيقونات مفردة.
الاستخدام: python3 brand/crop_sheets.py  (مسارات الصور داخل الملف)"""
from PIL import Image
import numpy as np, os
def runs(prof, thr, mingap=12, minlen=40):
    on = prof > thr; segs = []; s = None
    for i, v in enumerate(on):
        if v and s is None: s = i
        if not v and s is not None: segs.append([s, i]); s = None
    if s is not None: segs.append([s, len(on)])
    out = []
    for sg in segs:
        if out and sg[0] - out[-1][1] < mingap: out[-1][1] = sg[1]
        else: out.append(sg)
    return [s for s in out if s[1] - s[0] >= minlen]
def process(path, names, rowbands, outdir, lthr=75, pad=1.1, size=384, bg=(26, 26, 31), ext='jpg'):
    im = Image.open(path).convert('RGB'); a = np.asarray(im).astype(int); lum = a.max(axis=2)
    k = 24; corners = np.concatenate([a[:k, :k].reshape(-1, 3), a[:k, -k:].reshape(-1, 3), a[-k:, :k].reshape(-1, 3), a[-k:, -k:].reshape(-1, 3)]); bg = tuple(int(v) for v in np.median(corners, axis=0)); print(os.path.basename(path), 'bg', bg)
    os.makedirs(outdir, exist_ok=True)
    for (y0, y1), rn in zip(rowbands, names):
        band = lum[y0:y1] > lthr
        segs = runs(band.sum(axis=0), max(3, 0.01 * band.sum(axis=0).max()))
        assert len(segs) == len(rn), (path, rn, segs)
        for (x0, x1), n in zip(segs, rn):
            sub = band[:, x0:x1]; ys = np.where(sub.any(axis=1))[0]
            by0, by1 = ys.min() + y0, ys.max() + y0
            work = Image.new('RGB', im.size, bg); work.paste(im.crop((x0, by0, x1, by1 + 1)), (x0, by0))
            cx, cy = (x0 + x1) / 2, (by0 + by1) / 2; s = max(x1 - x0, by1 - by0) * pad
            box = (int(cx - s / 2), int(cy - s / 2), int(cx + s / 2), int(cy + s / 2))
            work.crop(box).resize((size, size), Image.LANCZOS).save('%s/%s.%s' % (outdir, n, ext), quality=90)
def portrait(path, grid, outdir, aspects=None, lthr=70, pad=1.08, maxdim=520):
    """قصّ شبكات الشخصيات (صفوف × أعمدة) بنسبة ٣:٤؛ grid = قائمة صفوف من الأسماء."""
    im = Image.open(path).convert('RGB'); a = np.asarray(im).astype(int); lum = a.max(axis=2); H, W = lum.shape
    k = 24; cs = np.concatenate([a[:k, :k].reshape(-1, 3), a[:k, -k:].reshape(-1, 3), a[-k:, :k].reshape(-1, 3), a[-k:, -k:].reshape(-1, 3)])
    bgc = tuple(int(v) for v in np.median(cs, axis=0)); rows = len(grid); os.makedirs(outdir, exist_ok=True)
    for r, names in enumerate(grid):
        y0, y1 = int(r * H / rows), int((r + 1) * H / rows)
        band = lum[y0:y1] > lthr; col = band.sum(axis=0)
        segs = runs(col, max(3, 0.01 * col.max()), mingap=20, minlen=60)
        assert len(segs) == len(names), (path, names, segs)
        for (x0, x1), n in zip(segs, names):
            ys = np.where(band[:, x0:x1].any(axis=1))[0]; by0, by1 = ys.min() + y0, ys.max() + y0
            work = Image.new('RGB', im.size, bgc); work.paste(im.crop((x0, by0, x1, by1 + 1)), (x0, by0))
            asp = (aspects or {}).get(n, 0.75); bw, bh = x1 - x0, by1 - by0
            h = max(bh * pad, bw * pad / asp); w = h * asp; cx, cy = (x0 + x1) / 2, (by0 + by1) / 2
            t = work.crop((int(cx - w / 2), int(cy - h / 2), int(cx + w / 2), int(cy + h / 2)))
            s = maxdim / max(t.size); t.resize((int(t.size[0] * s), int(t.size[1] * s)), Image.LANCZOS).save('%s/%s.jpg' % (outdir, n), quality=90)
if __name__ == '__main__':
    U = '/root/.claude/uploads/d8d26f1b-f35c-5f35-b07b-2a4aed9a7384/'
    O = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'img/goods')
    process(U + '22135f59-image.jpg', [['dates', 'wheat', 'wood', 'iron'], ['wool', 'cotton', 'coffee', 'incense']], [(0, 384), (384, 768)], O)
    process(U + '8c874d1a-image.jpg', [['pearls', 'papyrus', 'glass', 'saffron'], ['turquoise', 'spice', 'gems', 'goldbar']], [(0, 384), (384, 768)], O)
    process(U + '679af446-image.jpg', [['silk', 'tea', 'porcelain', 'perfume'], ['textile', 'carpet', 'jewelry', 'tools']], [(40, 745), (850, 1490)], O)
