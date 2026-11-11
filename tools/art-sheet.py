#!/usr/bin/env python3
"""لوحة مراجعة: كل أيقونة في صف بأحجام 28 و44 و68 على خلفية عاجية ثم زرقاء داكنة، واسم الملف بجانبها. الاستعمال: art-sheet.py <مجلد> <ناتج.png>"""
import sys, os, glob
from PIL import Image, ImageDraw
src, out = sys.argv[1], sys.argv[2]; files = sorted(glob.glob(os.path.join(src, '*.webp')))
sizes, bgs, rowh, pad = [28, 44, 68], [(246, 239, 224), (27, 42, 64)], 84, 12
w = 230 + len(bgs) * (sum(sizes) + pad * (len(sizes) + 1)); sheet = Image.new('RGB', (w, max(1, len(files)) * rowh), (255, 255, 255)); d = ImageDraw.Draw(sheet)
for i, f in enumerate(files):
    y = i * rowh; im = Image.open(f).convert('RGBA'); d.text((8, y + rowh // 2 - 6), os.path.basename(f), fill=(20, 20, 20)); x = 230
    for bg in bgs:
        bw = sum(sizes) + pad * (len(sizes) + 1); d.rectangle([x, y + 4, x + bw, y + rowh - 4], fill=bg); cx = x + pad
        for s in sizes:
            t = im.resize((s, s), Image.LANCZOS); sheet.paste(t, (cx, y + (rowh - s) // 2), t); cx += s + pad
        x += bw
os.makedirs(os.path.dirname(out) or '.', exist_ok=True); sheet.save(out); print(out, len(files))
