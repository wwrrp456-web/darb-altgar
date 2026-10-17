# يقصّ شبكة الشخصيات (٤×٢) إلى صور عمودية ٣:٤ حول كل شخصية: python3 brand/crop_chars.py <image> [<الأسماء مفصولة بفاصلة>]
import sys, os
from PIL import Image, ImageChops
src = sys.argv[1]
names = (sys.argv[2] if len(sys.argv) > 2 else 'c_trader,c_changer,c_leader,x_extra1,c_shopkeeper,c_negotiator,x_extra2,salem').split(',')
im = Image.open(src).convert('RGB'); W, H = im.size; cw, ch = W // 4, H // 2
root = os.path.dirname(os.path.abspath(__file__)); out = os.path.join(root, 'img', 'hero'); extra = os.path.join(root, 'extra')
os.makedirs(out, exist_ok=True); os.makedirs(extra, exist_ok=True)
bg = Image.new('RGB', im.size, im.getpixel((8, 8)))
diff = ImageChops.difference(im, bg).convert('L').point(lambda v: 255 if v > 28 else 0)
for i, n in enumerate(names):
    r, c = divmod(i, 4); x0, y0 = c * cw, r * ch
    box = diff.crop((x0, y0, x0 + cw, y0 + ch)).getbbox() or (0, 0, cw, ch)
    cx = x0 + (box[0] + box[2]) // 2; top = y0 + max(0, box[1] - 12); bot = y0 + min(ch, box[3] + 12)
    h = bot - top; w = int(h * 0.75)
    if w < (box[2] - box[0]) + 20: w = (box[2] - box[0]) + 20; h = int(w / 0.75)
    l = max(x0, min(cx - w // 2, x0 + cw - w)); t = max(y0, min(top, y0 + ch - h))
    tile = im.crop((l, t, l + w, t + h)).resize((389, 520), Image.LANCZOS)
    dest = os.path.join(extra if n.startswith('x_') else out, n + '.jpg'); tile.save(dest, quality=82); print(n, (l, t, w, h), '→', os.path.relpath(dest, root))
