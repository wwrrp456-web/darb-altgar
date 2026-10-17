# يضغط صور brand/img إلى WebP ويصغّرها إلى حجم العرض الفعلي: python3 brand/optimize_images.py
# الأسماء بلا امتداد تبقى هي المفاتيح، فلا يتغير شيء في الشيفرة.
import os, sys
from PIL import Image
CAP = {'ui': 256, 'goods': 256, 'nav': 192}   # الباقي: ١٢٨٠ بكسل على الأطول
Q = 80
root = os.path.join(os.path.dirname(__file__), 'img')
before = after = 0
for d, _, fs in os.walk(root):
    for f in sorted(fs):
        p = os.path.join(d, f); ext = os.path.splitext(f)[1].lower()
        if ext not in ('.png', '.jpg', '.jpeg', '.webp'): continue
        top = os.path.relpath(d, root).split(os.sep)[0]
        cap = CAP.get(top, 1280); sz = os.path.getsize(p); before += sz
        im = Image.open(p); im.load()
        if max(im.size) > cap: r = cap / max(im.size); im = im.resize((round(im.width * r), round(im.height * r)), Image.LANCZOS)
        if im.mode not in ('RGB', 'RGBA'): im = im.convert('RGBA' if 'A' in im.mode or 'transparency' in im.info else 'RGB')
        out = os.path.splitext(p)[0] + '.webp'; tmp = out + '.tmp'
        im.save(tmp, 'WEBP', quality=Q, method=6)
        n = os.path.getsize(tmp)
        if ext == '.webp' and n >= sz: os.remove(tmp); after += sz; continue   # لا نكبّر ما صغُر أصلاً
        os.replace(tmp, out)
        if ext != '.webp': os.remove(p)
        after += n
print('قبل %.2f MB  بعد %.2f MB' % (before / 1048576, after / 1048576))
