# يقصّ صور تعابير عمّ سالم (بلا شبكة منتظمة): كل صورة مكوّن متصل، والنافذة ٣:٤ بحجم موحّد حول الرأس.
# الاستخدام: python3 brand/crop_expr.py <image> [الأسماء بالترتيب (يمين←يسار لا؛ صفاً صفاً من اليسار)]
import sys, os
import numpy as np
from PIL import Image
src = sys.argv[1]
names = (sys.argv[2] if len(sys.argv) > 2 else 'salem_happy,salem_sad,salem_proud,salem_thinking,x_worried_a,salem_worried,salem_cheer').split(',')
im = Image.open(src).convert('RGB'); W, H = im.size; a = np.asarray(im).astype(int)
mask = np.abs(a - a[6, 6]).sum(2) > 70
K = 8; h, w = H // K, W // K
m = mask[:h * K, :w * K].reshape(h, K, w, K).any(axis=(1, 3))
lab = np.zeros((h, w), int); n = 0; comps = []
for y in range(h):
    for x in range(w):
        if m[y, x] and not lab[y, x]:
            n += 1; st = [(y, x)]; lab[y, x] = n; cells = []
            while st:
                cy, cx = st.pop(); cells.append((cy, cx))
                for dy in (-2, -1, 0, 1, 2):
                    for dx in (-2, -1, 0, 1, 2):
                        yy, xx = cy + dy, cx + dx
                        if 0 <= yy < h and 0 <= xx < w and m[yy, xx] and not lab[yy, xx]: lab[yy, xx] = n; st.append((yy, xx))
            if len(cells) > 400: comps.append(cells)
boxes = []; cmasks = []
for c in comps:
    cm = np.zeros((h, w), bool)
    for (cy, cx) in c: cm[cy, cx] = True
    cmasks.append(cm)
    ys = [p[0] for p in c]; xs = [p[1] for p in c]; boxes.append((min(xs) * K, min(ys) * K, (max(xs) + 1) * K, (max(ys) + 1) * K))
# ترتيب: صفوف (تقريب y إلى سطور) ثم x من اليسار
rows = sorted(zip(boxes, cmasks), key=lambda t: t[0][1]); line = []; cur = []; last = None
for b, cm in rows:
    if last is None or b[1] - last < 260: cur.append((b, cm)); last = b[1] if last is None else last
    else: line.append(cur); cur = [(b, cm)]; last = b[1]
line.append(cur); ordered = [t for r in line for t in sorted(r, key=lambda t: t[0][0])]
print(len(ordered), 'portraits')
root = os.path.dirname(os.path.abspath(__file__)); out = os.path.join(root, 'img', 'hero'); extra = os.path.join(root, 'extra'); os.makedirs(out, exist_ok=True); os.makedirs(extra, exist_ok=True)
white = (a.min(axis=2) > 205)
CW = int(W * 0.40); CH = int(CW * 4 / 3)
bgc = tuple(int(v) for v in a[6, 6])
for (b, cm), nm in zip(ordered, names):
    x0, y0, x1, y1 = b; sub = white[y0:y1, x0:x1]
    rowsum = sub.sum(axis=1); top = next((i for i, v in enumerate(rowsum) if v > 25), 0)
    ys, xs = np.nonzero(sub[top:top + 140]); cx = x0 + int(np.median(xs)) if len(xs) else (x0 + x1) // 2
    ty = y0 + top; left = max(0, min(W - CW, cx - CW // 2)); t = max(0, min(H - CH, ty - int(CH * 0.10)))
    clean = Image.new('RGB', im.size, bgc); clean.paste(im.crop((max(0, x0 - 6), max(0, y0 - 6), min(W, x1 + 6), min(H, y1 + 6))), (max(0, x0 - 6), max(0, y0 - 6)))
    tile = clean.crop((left, t, left + CW, t + CH)).resize((389, 520), Image.LANCZOS)
    dest = os.path.join(extra if nm.startswith('x_') else out, nm + '.jpg'); tile.save(dest, quality=82); print(nm, b, '→', os.path.relpath(dest, root))
