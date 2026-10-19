# مهمة كودكس: رسومات العناصر الجديدة (المواشي والسلع والأحداث وواجهات المراحل)

هذا الملف تعليمات كاملة لكودكس لتوليد الرسومات الجديدة للعبة «درب التجّار» بالهوية المعتمدة، وإيداعها في المستودع. لا يغيّر الملف شيئاً في اللعبة نفسها؛ دمج الأصول في الشيفرة يفعله Claude على مراحل بعد مراجعتها.

## ١) اقرأ قبل البدء

اقرأ هذه الملفات بالترتيب، وإن تعارضت فالمرجع الأحدث هو الأول:

1. `brand/STYLE.md` (دليل الأسلوب الحالي والرفض)، ثم `brand/IDENTITY.md`.
2. `brand/ICONS.md` و`brand/ICON_TRANSPARENCY.md` (قواعد الشفافية والأحجام).
3. `brand/PROMPTS.md` و`brand/PROMPTS_GEMINI.md` (صياغات سابقة ناجحة، واللغة المشتركة للمشاهد).
4. `brand/CHARACTERS.md` (قواعد الشخصيات).

**مراجع الأسلوب البصرية** (أرفقها بكل طلب توليد): `brand/img/goods/` (أيقونات السلع الحالية، خاصة `wool` و`tools` و`carpet` و`dates`)، و`brand/img/icons/` (أيقونات الواجهة)، و`brand/img/scene/sa.webp` (للمشاهد)، و`brand/img/cutouts/hero/` (للشخصيات).

## ٢) قواعد غير قابلة للتفاوض

- **لا تعدّل ولا تضغط ولا تعِد توليد أي صورة موجودة** في `brand/img/`. الصور الحالية ملك المالك. أضف ملفات جديدة فقط.
- **لا تلمس الشيفرة** (`src/`، `index.html`، `build.js`، `pwa/`، `sw.js`). مهمتك الأصول والـ manifest فقط.
- **لا نصوص ولا أرقام ولا حروف ولا علامات ولا شعارات** داخل أي رسمة (التسميات تأتي من الواجهة).
- **لا خنزير ولا لحم خنزير ولا خمر** في أي رسمة. لا مشاهد ذبح أو دماء. الحيوانات تُصوَّر محترمة وسليمة التشريح (عدد الأطراف والقرون والأذان صحيح).
- ثقافات الدول تُصوَّر باحترام بلا كاريكاتير.
- الشخصيات بالغة وقورة، والتعابير مقروءة عند التصغير.
- مكان التسليم **`brand/next/`** وليس `brand/img/` (حتى لا تنتفخ الصفحة بصور غير مستعملة بعد). ينقلها Claude إلى `brand/img/` عند دمج المرحلة المناسبة.

## ٣) الأسلوب (سطر ثابت يُلصق في أول كل طلب)

```
Polished hand-painted 2D game art in the style of the attached reference images: premium mobile strategy-RPG item art, rich saturated colors, soft painterly shading, crisp clean silhouettes, subtle rim light, clean confident outlines, no ground plane or rectangular shadow around subjects. Warm Arabian trade-caravan theme. Palette anchors: warm sand #F6EFE0, oasis teal #1F6F6B, lapis blue #2B3F6B, honey gold #D19A2A, clay red #B8402F, ink #2B2A26. No text, no letters, no digits, no labels, no logos, no watermark, no frames. Every subject fully inside its cell with wide empty margins, never cropped. Readable at 32x32 pixels.
```

## ٤) طريقة العمل والشفافية

1. ولّد **شبكات 4×2** (8 خلايا) كما في الجداول أدناه، خلية لكل عنصر، بترتيب اليسار لليمين ثم الأعلى للأسفل. للمشاهد والشخصيات الشبكات مذكورة في بابها.
2. إن لم يدعم مولّد الصور قناة alpha حقيقية، ولّد على **خلفية مسطحة بلون مفتاح واحد غير موجود في العناصر** (يُقترح مغنتا `#FF00FF`) بلا تدرجات ولا ظلال أرضية. ثم فرّغ بسكربت (إزالة اللون المفتاح مع تنعيم الحواف وإزالة انسكاب اللون على الحواف)، ولا تستخدم حذف الألوان الداكنة لأنها تأكل القهوة والحديد والجلد والشعر.
3. اقصّ كل خلية على حدود موضوعها الفعلية (مع بقاء الأجزاء المنفصلة التابعة له)، ثم صدّر WebP بقناة alpha حقيقية، جودة نحو 85.
4. **الأحجام:** أيقونات السلع والحيوانات والأحداث `192×192`، وأيقونات الواجهة الصغيرة `128×128`، والشخصيات `390×520`، والمشاهد عرض `1600` بنسبة 21:9.
5. **الحجم الأقصى للملف:** أيقونة ≤ 14KB، شخصية ≤ 60KB، مشهد ≤ 140KB.
6. أعد توليد أي خلية معيبة **منفردة** بدل الشبكة كلها.

## ٥) قائمة الرفض عند المراجعة الذاتية

أطراف مشوهة أو زائدة، حيوان بقرنين غير متماثلين بلا سبب، ذيل أو أذن ناقصة، تفاصيل مزدحمة تضيع عند 32 بكسلاً، حيوانان يتشابهان حتى لا يُفرق بينهما (الغنم والماعز، البقر والجاموس، الدجاج والبط)، كتابة مولّدة، لون مفتاح متسرب على الحواف، قص جزء من الموضوع، توهج مبالغ، أو اختلاف واضح عن أسلوب الأصول الحالية.

افحص كل ناتج **فوق الرمل `#F6EFE0` وفوق الأخضر الداكن `#103B39`** وليس على الأسود وحده.

## ٦) الدفعات (بترتيب الأولوية)

سلّم كل دفعة بمفردها (commit واحد لكل دفعة).

### الدفعة أ — المواشي والسلع (المرحلة ٢)

**الشبكة G1 — سلع جديدة (أيقونات 192)** → `brand/next/goods/<id>.webp`

| # | المعرّف | الوصف (للبرومت) |
|---|---|---|
| 1 | `salt` | coarse white sea-salt crystals heaped in a small wooden bowl with a burlap sack behind |
| 2 | `sugar` | two cone-shaped pressed sugar loaves wrapped in blue paper with a few white crystals |
| 3 | `honey` | clay honey jar with a wooden dipper dripping golden honey and a honeycomb piece |
| 4 | `oliveoil` | round-bellied clay oil jug with a sprig of green olives and a small dark-green olive heap |
| 5 | `rice` | open burlap sack overflowing with white rice grains and a small wooden scoop |
| 6 | `driedfish` | three dried silver fish tied on a string with a small woven basket |
| 7 | `leather` | rolled tanned brown leather hides with a stitched leather satchel on top |
| 8 | `cheese` | wheel of pale cheese with a cut wedge and a small bundle of dried milk balls in cloth |

**الشبكة G2 — سلع ومنتجات (أيقونات 192)** → `brand/next/goods/<id>.webp`

| # | المعرّف | الوصف |
|---|---|---|
| 1 | `raisins` | woven basket of dark raisins with green dried apricots and a vine leaf |
| 2 | `paper` | stack of cream handmade paper sheets tied with cord with a reed pen |
| 3 | `soap` | three olive-oil soap bars stamped with a plain pattern (no text) stacked with a sprig of olive |
| 4 | `herbs` | bundle of dried medicinal herbs tied with string, a small glass vial and a mortar |
| 5 | `jerky` | strips of dried meat hanging on a wooden rack, with a small cloth bundle |
| 6 | `eggs` | woven basket of brown and cream eggs with a little straw |
| 7 | `milk` | clay milk jug with a wooden lid, a pouring bowl of white milk |
| 8 | `hay` | tied bundle of golden hay with a wooden pitchfork leaning on it |

**الشبكة A1 — المواشي (أيقونات 192)** → `brand/next/animals/<id>.webp`  (وضعية ثلاثة أرباع للأمام، الجسم كاملاً)

| # | المعرّف | الوصف |
|---|---|---|
| 1 | `sheep` | woolly cream sheep with a rounded fleece and short black face, standing |
| 2 | `goat` | lean brown-and-white goat with a small beard and curved horns, standing alert |
| 3 | `cow` | sturdy brown-and-white cow with short horns, calm expression |
| 4 | `buffalo` | dark gray water buffalo with wide swept-back horns, heavy build |
| 5 | `camel` | single-humped golden dromedary camel, side three-quarter view, with a plain teal halter |
| 6 | `horse` | slim elegant chestnut Arabian horse with a high tail and a plain teal halter |
| 7 | `chicken` | plump rooster in warm brown and red with a green tail |
| 8 | `duck` | white duck with an orange bill and feet, standing |

**الشبكة F1 — واجهة المزرعة (أيقونات 128)** → `brand/next/farm/<id>.webp`

| # | المعرّف | الوصف |
|---|---|---|
| 1 | `farm` | small mud-brick farmhouse with a wooden fence, a palm tree and a hay roof shed |
| 2 | `stable` | wooden stable with an open half-door and a horse head peeking out |
| 3 | `shears` | iron sheep shears beside a tuft of white wool |
| 4 | `crook` | shepherd's wooden crook staff with a small bell tied on |
| 5 | `pedigree` | round gold medal with a ribbon bearing a horse-head silhouette (no text) |
| 6 | `young` | a lamb and a calf side by side, small and gentle |
| 7 | `pen` | wooden animal pen with a gate half open |
| 8 | `trough` | stone water trough with a bucket and a drop of water |

### الدفعة ب — الأحداث الاقتصادية (المرحلة ٤)

**الشبكة E1 (أيقونات 192)** → `brand/next/events/<id>.webp`

| # | المعرّف | الوصف |
|---|---|---|
| 1 | `war` | crossed curved swords over a round shield with a torn banner (no emblem text) |
| 2 | `plague` | yellow quarantine flag on a wooden pole planted beside a closed wooden gate |
| 3 | `famine` | empty woven basket tipped over with a few scattered grains and cracked ground |
| 4 | `bandits` | two masked riders in dark cloaks on horses galloping, daggers raised |
| 5 | `pirates` | small ship with dark ragged sails and an unmarked black flag |
| 6 | `flood` | river wave rising over a mud-brick wall and a palm tree |
| 7 | `drought` | cracked dry earth with a dead bush and a harsh sun |
| 8 | `border` | wooden barrier gate lowered across a road with a small watchtower |

**الشبكة E2 (أيقونات 192)** → `brand/next/events/<id>.webp`

| # | المعرّف | الوصف |
|---|---|---|
| 1 | `fair` | festive trade fair: two striped tents with bunting flags and a stack of goods |
| 2 | `fire` | warehouse corner on fire with flames and a puff of smoke |
| 3 | `sickcrew` | caravan crew member resting on a mat with a cloth bandage on the forehead |
| 4 | `taxraid` | official's scroll with a wax seal and a small pile of coins on a table |
| 5 | `dumping` | cart tipping a large pile of goods onto the ground with a falling price arrow (no digits) |
| 6 | `discovery` | unrolled old map with a glowing star and a dotted path |
| 7 | `eyes` | stylized open eye on a gold-and-teal disc (market-eyes watch) |
| 8 | `rumor` | brass hourglass beside a whispering speech-bubble shape (no letters) |

### الدفعة ج — واجهات المرحلتين ١ و٣ والإعدادات

**الشبكة U1 — المنتج الخاص والجودة (أيقونات 128)** → `brand/next/ui/<id>.webp`

| # | المعرّف | الوصف |
|---|---|---|
| 1 | `special` | gold crest with a single bright star (the city's special product) |
| 2 | `q1` | plain bronze round seal with a ribbon (low quality) |
| 3 | `q2` | silver round seal with a ribbon (medium quality) |
| 4 | `q3` | gold round seal with a ribbon and tiny gems (high quality) |
| 5 | `bosskey` | ornate brass key with a teal tassel |
| 6 | `exclusive` | rolled contract with a wax seal and a small key (exclusive contract) |
| 7 | `repboard` | wooden notice board with five small colored plaques (no text) |
| 8 | `premium` | brass compass with a long dotted road behind it and a coin (distance premium) |

**الشبكة U2 — سمعة المصنع (أيقونات 128)** → `brand/next/ui/<id>.webp`

| # | المعرّف | الوصف |
|---|---|---|
| 1 | `rep_trust` | two hands clasped in a handshake |
| 2 | `rep_quality` | gem-studded round seal |
| 3 | `rep_zakat` | open hand dropping a gold coin into a small cloth bag |
| 4 | `rep_honesty` | open ledger book with a clean quill |
| 5 | `rep_service` | lantern lighting a small road sign post (no text) |
| 6 | `factory_ok` | small workshop with chimney smoke rising and a teal roof |
| 7 | `factory_worn` | the same workshop with cracked walls and a tilted roof |
| 8 | `manager` | seated clerk's desk with ledger and a bag of coins (city business manager) |

> الأيقونات الخمس للسمعة **مقترحة** وتُراجع مع المالك قبل الدمج.

**الشبكة D — الإعدادات (أيقونات 128، 6 خلايا من 8)** → `brand/next/ui/<id>.webp`

| # | المعرّف | الوصف |
|---|---|---|
| 1 | `diff_calm` | a soft white feather on teal |
| 2 | `diff_normal` | a round shield on teal |
| 3 | `diff_hard` | a flame inside a shield on clay red |
| 4 | `save_export` | a scroll with an arrow leaving a box |
| 5 | `save_import` | a scroll with an arrow entering a box |
| 6 | `freeplay` | open sun-and-road emblem, an endless winding path |

### الدفعة د — المشاهد (21:9، عرض 1600)

اكتب كل مشهد على نمط كتلة المدن في `brand/PROMPTS_GEMINI.md` (نسبة 21:9، العناصر المهمة في الـ70٪ الوسطى، أعلى 15٪ سماء، أسفل 15٪ أرض، بلا نص). → `brand/next/scene/<id>.webp`

| المعرّف | المشهد |
|---|---|
| `farm` | green oasis farm: low mud-brick farmhouse, fenced pasture with sheep, goats and cows grazing, a well, palms behind |
| `herd` | caravan walking a desert road with a flock of sheep and a few goats beside it, one shepherd with a crook, golden light |
| `livemarket` | lively livestock market in a walled courtyard: pens of sheep and goats, camels tied at a rail, a few traders bargaining |
| `horsefair` | horse fair: elegant Arabian horses held by grooms in a sandy arena, tents and banners (no writing), small crowd |

### الدفعة هـ — شخصيات (390×520 مفرغة)

أرفق `brand/img/cutouts/hero/` مرجعاً. وقفة كاملة، وجوه مختلفة الأعمار والبنية، لا تشبه بطل اللاعب (شماغ أحمر وعباءة لازوردية). → `brand/next/char/<id>.webp`

| المعرّف | الوصف |
|---|---|
| `herder` | lean sunburnt shepherd, 40s, gray stubble, brown wool cloak, turban, crook staff, calm eyes |
| `worker` | young shop worker, 20s, rolled sleeves, teal apron, carrying a small crate, friendly face |
| `citymanager` | composed elderly city business manager, trimmed white beard, teal robe with gold trim, ledger under arm |

## ٧) ما يُسلَّم مع كل دفعة

- الملفات تحت `brand/next/` بالمعرّفات أعلاه بالضبط.
- `brand/next/MANIFEST.md` يضاف إليه سطر لكل ملف: المعرّف، المسار، الحجم، تاريخ التسليم، وحالة (`تم`/`أُعيد توليده`/`يحتاج مراجعة`) مع سبب أي إعادة.
- صورة معاينة `brand/next/preview-<الدفعة>.png` فيها كل أصول الدفعة مرتبة على رمل `#F6EFE0` وعلى أخضر `#103B39` جنباً إلى جنب.
- تعليق في رسالة الـ commit بما وجدته من مشاكل بأسلوب المولّد (إن وُجدت) كي نعدّل البرومت.

## ٨) قواعد المستودع

- ادفع إلى `main` ولا تلمس غير `brand/next/`. نفّذ `git pull --rebase origin main` قبل الدفع (المالك وClaude يدفعان أيضاً).
- رسالة commit بالعربية واضحة، مثل «رسومات الدفعة أ: سلع جديدة».
- لا حاجة لتشغيل `node build.js` لأن `brand/next/` لا يدخل في البناء.
- بعد التسليم يراجع Claude الأصول ويدمجها (نقلها إلى `brand/img/`، ربط `src/icons.js`، واختبار `test/icons.test.js`) على مراحل التنفيذ.

## ٩) مؤجل (لا يُولَّد الآن)

أيقونات الإنجازات والأوسمة (القائمة لم تُعتمد بعد)، ورسومات الجيل الثاني والعصور الحديثة، وأدوار قادة القوافل (تُضاف عند اعتماد تصميمها)، وشخصية الخصم المسمّى، وتحسينات الدكاكين.
