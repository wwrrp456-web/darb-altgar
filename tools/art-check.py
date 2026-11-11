#!/usr/bin/env python3
"""فحص أصول كودكس قبل الرفع. icons: WebP RGBA بأبعاد ثابتة وزوايا شفافة وحواف ناعمة وحد للحجم. map: مقاسات اللوحة والإطار وcities.json."""
import sys, os, json, glob
from PIL import Image

def icon(p, side, target, hard):
    im = Image.open(p); kb = os.path.getsize(p) / 1024; errs = []
    if im.format != 'WEBP': errs.append('ليس WebP')
    if im.mode != 'RGBA': errs.append('بلا ألفا (' + im.mode + ')'); return kb, errs
    if im.size != (side, side): errs.append('الأبعاد %dx%d' % im.size)
    a = im.getchannel('A'); w, h = im.size
    if any(a.getpixel(c) for c in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]): errs.append('زاوية غير شفافة')
    hist = a.histogram()
    if sum(hist[1:255]) == 0: errs.append('لا حواف ناعمة')
    if sum(hist[200:]) < w * h * 0.08: errs.append('الجسم المرئي أقل من 8٪')
    if kb > hard: errs.append('الحجم %.1f > %g KB' % (kb, hard))
    elif kb > target: errs.append('تنبيه: الحجم %.1f > %g KB' % (kb, target))
    return kb, errs

def mapdir(d):
    errs = []
    for f, size, alpha in [('board.webp', (4096, 2048), False), ('board-1024.webp', (2048, 1024), False), ('frame.webp', (4096, 2048), True)]:
        p = os.path.join(d, f)
        if not os.path.exists(p): errs.append('ناقص ' + f); continue
        im = Image.open(p)
        if im.size != size: errs.append('%s أبعاده %dx%d' % ((f,) + im.size))
        if alpha:
            if im.mode != 'RGBA': errs.append('الإطار بلا ألفا')
            elif im.getchannel('A').getpixel((size[0] // 2, size[1] // 2)) != 0: errs.append('وسط الإطار غير شفاف')
    p = os.path.join(d, 'cities.json')
    if not os.path.exists(p): errs.append('ناقص cities.json')
    else:
        c = json.load(open(p, encoding='utf-8')); need = sys.argv[3].split(',') if len(sys.argv) > 3 else []
        miss = [k for k in need if k not in c]
        if miss: errs.append('مدن ناقصة: ' + ','.join(miss))
        bad = [k for k, v in c.items() if not (0 <= v.get('x', -1) <= 1 and 0 <= v.get('y', -1) <= 1)]
        if bad: errs.append('إحداثيات خارج 0..1: ' + ','.join(bad))
    return errs

if __name__ == '__main__':
    mode, target = sys.argv[1], sys.argv[2]; fail = 0
    if mode == 'icons':
        side = int(os.environ.get('SIDE', 128)); print('| الملف | KB | النتيجة |\n|---|---|---|')
        for p in sorted(glob.glob(os.path.join(target, '*.webp'))):
            kb, errs = icon(p, side, float(os.environ.get('TARGET_KB', 5)), float(os.environ.get('MAX_KB', 8))); hard = [e for e in errs if not e.startswith('تنبيه')]; fail |= bool(hard)
            print('| %s | %.1f | %s |' % (os.path.basename(p), kb, '; '.join(errs) or 'سليم'))
    else:
        for d in sorted(glob.glob(os.path.join(target, '*/'))):
            errs = mapdir(d); fail |= bool(errs); print('%s: %s' % (d, '; '.join(errs) or 'سليم'))
    sys.exit(1 if fail else 0)
