"""يقصّ صفحة مدن (٤ شرائح أفقية فوق بعض) إلى city/<id>.jpg
الاستعمال: python3 -I brand/crop_cities.py الصفحة.jpg id1,id2,id3,id4 [عرض الناتج=1600]
يكشف الفواصل الداكنة بين الشرائح، وإن لم يجدها قسّم الصفحة إلى أربعة أجزاء متساوية، ثم يقصّ الحواف الداكنة."""
import sys, numpy as np
from PIL import Image
src, ids = sys.argv[1], sys.argv[2].split(','); W = int(sys.argv[3]) if len(sys.argv) > 3 else 1600
im = Image.open(src).convert('RGB'); a = np.asarray(im).astype(int); h, w, _ = a.shape
rows = a.mean(axis=(1, 2)); dark = rows < max(40, np.percentile(rows, 8) + 8)
# أطول ٣ مقاطع داكنة داخل الصفحة = الفواصل
runs, i = [], 0
while i < h:
    if dark[i]:
        j = i
        while j < h and dark[j]: j += 1
        if 0.1 * h < (i + j) / 2 < 0.9 * h: runs.append((i, j))
        i = j
    else: i += 1
runs = sorted(sorted(runs, key=lambda r: r[0] - r[1])[:3])
cuts = [0] + [(r[0] + r[1]) // 2 for r in runs] + [h]
if len(cuts) != 5: cuts = [round(h * k / 4) for k in range(5)]; print('تعذّر كشف الفواصل: تقسيم متساوٍ')
for k, cid in enumerate(ids):
    t, b = cuts[k], cuts[k + 1]; strip = a[t:b]
    cm = strip.mean(axis=(0, 2)); rm = strip.mean(axis=(1, 2)); th = 38
    xs = np.where(cm > th)[0]; ys = np.where(rm > th)[0]
    x0, x1 = (xs[0] + 3, xs[-1] - 3) if len(xs) else (0, w); y0, y1 = (ys[0] + 3, ys[-1] - 3) if len(ys) else (0, b - t)
    c = im.crop((x0, t + y0, x1, t + y1)); c = c.resize((W, round(c.height * W / c.width)), Image.LANCZOS)
    c.save(f'brand/img/city/{cid}.jpg', quality=82, optimize=True); print(cid, c.size)
