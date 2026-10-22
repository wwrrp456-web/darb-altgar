# برومتات مراحل العمر للشخصيات الخمس + الوريث (٣ شبكات)

لكل شخصية ثلاث مراحل في اللعبة: الشباب (الصورة المعتمدة الحالية)، ثم **منتصف العمر** (شيب خفيف)، ثم **الشيخوخة والتقاعد** (شيب كامل، عصا)، ثم **الوريث** (ابنه الشاب الذي يكمل). المطلوب ٣ شبكات، كل شبكة بالشخصيات الخمس بالترتيب نفسه: التاجر المتجول، الصرّاف، قائد القوافل، صاحب الدكان، المفاوض.

أرفق في كل مرة الصورة المرجعية للشخصيات الخمس (شبكة الشخصيات المعتمدة) ليبقى الوجه والزي والأسلوب متطابقين.

## سطر الأسلوب الثابت (يُلصق في أول كل برومت)
Polished hand-painted 2D game art in the style of the attached reference image: premium mobile strategy-RPG character art, rich saturated colors, soft painterly shading, crisp clean silhouettes, subtle rim light, soft contact shadow under each figure. Warm Arabian trade-caravan theme. Plain solid very dark charcoal background (#1A1A1F), flat, NO glow, NO vignette, NO texture, NO scenery. Each character full body standing, never cropped, in its own equal vertical 3:4 cell with wide empty margins between cells. Respectful, realistic-leaning proportions, not caricature. No text, letters, numbers, labels, logos, watermarks, frames.

## الشبكة ١: منتصف العمر (يبدو أكبر بنحو ١٥ سنة)
```
[سطر الأسلوب الثابت]
The SAME five men as in the attached reference, EXACTLY the same faces, builds, costumes, colors and accessories, but about 15 years older: salt-and-pepper hair and beard (gray at the temples and in the beard), faint wrinkles around the eyes, a slightly heavier and more settled build, calmer more experienced expression. Same signature items in hand.
Grid of 5 characters in ONE row, 5 columns x 1 row, left to right: 1. wandering merchant, 2. money changer, 3. caravan leader, 4. shopkeeper, 5. negotiator.
```

## الشبكة ٢: الشيخوخة والتقاعد (بعمر ٩٥ تقريباً)
```
[سطر الأسلوب الثابت]
The SAME five men as in the attached reference, EXACTLY the same faces and costume colors, now very old retired elders in their mid-90s: fully white hair and beard, deep gentle wrinkles, slightly stooped posture, each leaning on a simple wooden walking cane with one hand, wearing a softer looser version of his costume, a warm peaceful content smile. Instead of work tools, each holds one small keepsake that hints at his trade: merchant a worn leather ledger, changer a small brass scale, caravan leader a rolled old map, shopkeeper a small wooden scoop, negotiator a sealed scroll.
Grid of 5 characters in ONE row, 5 columns x 1 row, left to right: 1. wandering merchant, 2. money changer, 3. caravan leader, 4. shopkeeper, 5. negotiator.
```

## الشبكة ٣: الوريث (الابن الشاب)
```
[سطر الأسلوب الثابت]
Five young men in their late teens or early twenties, each the SON of the corresponding man in the attached reference: clearly inherits his father's face shape, eyebrows and nose, a fresh youthful look with a light or no beard, bright hopeful eyes, an eager determined smile. Each wears a fresher, brighter version of his father's costume in the SAME color scheme, and holds his father's signature item (merchant: the ledger scroll and coin pouch, changer: the brass balance scale, caravan leader: the leather map and staff, shopkeeper: the wooden crate of goods, negotiator: the sealed contract scroll). Slightly lighter, more energetic build than the father.
Grid of 5 characters in ONE row, 5 columns x 1 row, left to right: 1. merchant's son, 2. changer's son, 3. caravan leader's son, 4. shopkeeper's son, 5. negotiator's son.
```

## إن خلطت الشبكة
ولّد كل شخصية وحدها: أرفق صورتها الأصلية وأضف سطر الأسلوب ثم: "Single character, full body, centered, vertical 3:4" مع وصف المرحلة من البرومت أعلاه لتلك الشخصية فقط.

## أسماء الملفات بعد القصّ (أقصّها أنا بـ`brand/crop_chars.py`)
`hero/c_<id>_mid.jpg` و`hero/c_<id>_old.jpg` و`hero/c_<id>_heir.jpg` حيث `<id>` أحد: trader, changer, leader, shopkeeper, negotiator.

## ملاحظات
- لا أعدّل أي صورة منك؛ إن لم تعجبني صورة أخبرك بما يعيبها.
- المرحلة تتبدل في اللعبة حسب العمر: الشباب حتى نحو ٤٠، منتصف العمر من ٤٠ إلى ٧٠، الشيخوخة من ٧٠ حتى التقاعد، ثم الوريث.

## قادة الأسواق الستة عشر
للقادة مرحلتان إضافيتان بنفس طريقة شبكات الزعماء (٤ شبكات ٢×٢ بالترتيب المعتمد لهم): `boss/<cityId>_old.jpg` (الوجه والزي نفسهما، أكبر بنحو ٣٠ سنة، شيب كامل وعصا) ثم `boss/<cityId>_heir.jpg` (الابن الشاب). التبديل: الشيخوخة تبدأ حين يبلغ اللاعب ٨٥، والابن عند التقاعد ٩٥.
