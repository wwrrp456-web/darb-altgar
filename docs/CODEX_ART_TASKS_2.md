# مهمة كودكس (٢): أصناف المواشي وواجهات التنويع والملحمة والسوق

تكملة لـ `docs/CODEX_ART_TASKS.md` (الدفعات أ–هـ سُلّمت). الاعتماد هنا على **كل القواعد نفسها**: لا تعدّل صورة موجودة، لا تلمس الشيفرة، لا نصوص في الصور، لا خنزير ولا ذبح دموي، التسليم في `brand/next/` وتحديث `brand/next/MANIFEST.md` وصورة معاينة لكل دفعة، ثم `git pull --rebase origin main` قبل الدفع إلى `main`.

اقرأ قبل البدء: `docs/CODEX_ART_TASKS.md` (الأقسام ١–٥ والبند ٨)، و`brand/STYLE.md`، و`brand/ICONS.md`. المراجع البصرية: أيقونات الأنواع المعتمدة في `brand/img/goods/` (`sheep`, `goat`, `cow`, `buffalo`, `camel`, `horse`, `chicken`, `duck`) وأيقونات السلع الحديثة في `brand/img/goods/` و`brand/next/`.

## ١) ما المطلوب ولماذا

اللعبة تُنوِّع المواشي: لكل نوع **أصناف** معروفة، يشتريها اللاعب بتحديد الصنف والجنس (ذكر، أنثى، أنثى حامل)، ويهجّن بينها. كل صنف يحتاج **أيقونة تميّزه بصرياً** عن بقية أصناف نوعه بنظرة واحدة عند حجم ٣٢ بكسلاً، مع بقاء النوع معروفاً.

> **قاعدة التمييز:** الصنف يُعرف بلون الجسم والرأس ونمط الفرو أو الشعر وشكل القرون أو الذيل أو الأذن وحجم الجسم. لا يُشترط الدقة العلمية الكاملة؛ المطلوب التمييز البصري الواضح بين الأصناف دون أن تخرج عن شكل نوعها المعتمد. وصف كل صنف أدناه تقريبي للتوجيه.

## ٢) السطر الثابت للأسلوب

استعمل **سطر الأسلوب نفسه** في القسم ٣ من `docs/CODEX_ART_TASKS.md`، وطريقة الشفافية والتفريغ في القسم ٤ منه، وأحجام الملفات وحدودها.

وأضف لكل شبكة أصناف:

```
Each cell shows ONE animal, full body, three-quarter front view, standing, same camera distance and scale as the attached species reference. The animals of one grid must be clearly different breeds of the same species: change coat color and pattern, horn shape, ear shape, tail shape and body build, but keep the same painting style, outline weight and lighting as the reference. Respectful, healthy animals, correct anatomy (correct number of legs, ears, horns). No halter text, no tags, no riders, no scenery.
```

## ٣) الدفعات (بترتيب الأولوية)

سلّم كل دفعة في commit مستقل. المجلد `brand/next/breeds/<id>.webp` (192×192، بقناة alpha).

### الدفعة و — الأصناف الأساسية (تُفتح من المستويات الأولى) — ٣ شبكات × ٨

**الشبكة B1: الغنم والماعز**

| # | المعرّف | الوصف |
|---|---|---|
| 1 | `najdi` | Najdi sheep: white woolly body with a distinctly black head and neck, medium build |
| 2 | `rahmani` | Rahmani sheep: cream wool body with a reddish-brown face and legs, long-legged |
| 3 | `karakul` | Karakul sheep: dark charcoal tightly-curled wool, broad fat tail, stocky |
| 4 | `marwari` | Marwari sheep: white body with a black face, long hanging ears, lean |
| 5 | `hu` | Hu sheep: all-white compact fluffy sheep, hornless, small ears, round and plump |
| 6 | `jabali` | Jabali mountain goat: dark brown-black rugged goat with long swept-back horns, sturdy legs |
| 7 | `aardi` | Aardi goat: long-haired black goat with drooping ears and curled horns |
| 8 | `goat_baladi` | Baladi goat: short-haired brown-and-white goat, medium horns, ordinary build |

**الشبكة B2: الماعز الهندي والبقر والجاموس والجمال**

| # | المعرّف | الوصف |
|---|---|---|
| 1 | `jamnapari` | Jamnapari goat: tall tan-and-white goat with long drooping ears and a convex Roman nose |
| 2 | `cow_baladi` | Baladi Egyptian cow: small brown cow with short horns, slightly humped shoulder |
| 3 | `cow_sistani` | Sistani cow: heat-hardy gray-tan humped cow with a visible shoulder hump and loose dewlap |
| 4 | `cow_yellow` | Chinese yellow ox: sturdy golden-yellow bull-ox, strong neck, short curved horns |
| 5 | `buf_egypt` | Egyptian water buffalo: dark gray-black with wide swept-back horns |
| 6 | `buf_murrah` | Murrah buffalo: jet-black glossy buffalo with tightly curled short horns |
| 7 | `majaheem` | Majaheem camel: dark brown-black dromedary, heavy powerful build |
| 8 | `safar` | Safar camel: light golden-yellow dromedary, taller and leaner |

**الشبكة B3: الخيل والدواجن**

| # | المعرّف | الوصف |
|---|---|---|
| 1 | `arab_kuhaylan` | Arabian horse, Kuhaylan strain: dark bay with a dished face, arched neck, high tail carriage, elegant |
| 2 | `akhal_teke` | Akhal-Teke horse: very lean tall golden horse with a metallic sheen and a long neck |
| 3 | `mongolian` | Mongolian horse: short stocky shaggy dun horse with a thick mane and short legs |
| 4 | `ch_baladi` | Baladi hen: plump mixed brown country hen, small red comb |
| 5 | `fayoumi` | Fayoumi hen: small slim barred black-and-white speckled hen with a tall alert stance |
| 6 | `silkie` | Silkie hen: fluffy all-white puffball hen with a feathered crest and dark skin tones on the face |
| 7 | `duck_pekin` | Pekin duck: pure white duck with a bright orange bill, upright stance |
| 8 | `duck_baladi` | Baladi duck: brown mottled mallard-type duck with a green-tinted neck |

### الدفعة ز — الأصناف المتقدمة (تُفتح من المستويات المتأخرة) — شبكتان × ٨

**الشبكة B4: الغنم والماعز المتقدم**

| # | المعرّف | الوصف |
|---|---|---|
| 1 | `naeemi` | Naeemi sheep: white body with a brown face and ears, very broad fat tail, large frame |
| 2 | `harri` | Harri sheep: stocky tan-and-white sheep with a small fat tail and a dark nose |
| 3 | `ossimi` | Ossimi sheep: heavy white woolly sheep with a long wool coat and a white face |
| 4 | `barki` | Barki sheep: lean sandy-brown desert sheep with a dark face and thin legs |
| 5 | `tan` | Tan sheep: white sheep with long curly lustrous locks of wool on the body |
| 6 | `kashmiri` | Kashmiri cashmere goat: white goat with a very long soft flowing coat and gently curved horns |
| 7 | `liaoning` | Liaoning cashmere goat: cream fluffy long-haired goat, sturdy, with a thick undercoat |
| 8 | `aseel` | Aseel rooster: tall muscular upright reddish-brown rooster with a short comb and a proud stance |

**الشبكة B5: البقر والجمال والخيل المتقدم**

| # | المعرّف | الوصف |
|---|---|---|
| 1 | `cow_domiati` | Domiati cow: pale cream-white dairy cow with a full udder and short horns |
| 2 | `cow_mazandarani` | Mazandarani cow: small dark brown-black cow, compact, with a white face blaze |
| 3 | `humr` | Humr camel: reddish-brown dromedary with a graceful build |
| 4 | `shaele` | Shaele camel: gray-tan very lean tall racing dromedary with long legs |
| 5 | `wadh` | Wadh camel: pale cream-white dromedary, elegant and rare looking |
| 6 | `arab_saqlawi` | Arabian horse, Saqlawi strain: light chestnut, very refined and slender with a long arched neck |
| 7 | `kurdish` | Kurdish horse: sturdy powerful gray horse with a broad chest and thick legs |
| 8 | `ili` | Ili horse: strong medium bay horse with a short back and sturdy build |

### الدفعة ح — واجهات التنويع والملحمة والسوق (أيقونات 128 إلا ما ذُكر)

→ `brand/next/ui/<id>.webp`. **بلا أي رمز نصي أو علامة ذكر وأنثى مكتوبة**: ارسم رموزاً بصرية مصوّرة بنفس الأسلوب.

**الشبكة G1: التنويع**

| # | المعرّف | الوصف |
|---|---|---|
| 1 | `sex_male` | round teal badge with a stylized male ram-head silhouette in honey gold |
| 2 | `sex_female` | round badge with a stylized ewe-head silhouette with softer lines in warm rose-sand |
| 3 | `pregnant` | gentle female ewe silhouette with a rounded belly and a small heart-shaped glow on the belly |
| 4 | `hybrid` | two different animal silhouettes (a darker and a lighter horse head) merging into one |
| 5 | `trait_milk` | clay milk jug with a single drop, teal outline |
| 6 | `trait_wool` | tuft of wool with a small spindle |
| 7 | `trait_meat` | stylized lamb leg joint on a small cutting board (no blood) |
| 8 | `trait_speed` | running horse silhouette with three motion lines |

**الشبكة G2: الصفات والملحمة**

| # | المعرّف | الوصف |
|---|---|---|
| 1 | `trait_endurance` | camel head with a small water drop and a sun |
| 2 | `trait_fertility` | an animal pair with two small young beside them |
| 3 | `pair` | two animals facing each other with a thin golden link between them (mating assignment) |
| 4 | `butcher` | small butcher shop front with a striped awning, hanging cloth-wrapped cuts and a scale (no blood, no text) |
| 5 | `freshmeat` | **192×192 goods icon**: fresh cuts of lamb on a wooden board with a small knife, appetizing but clean |
| 6 | `cull` | herd of sheep with one animal leaving through a small gate (selling the surplus) |
| 7 | `stud` | single noble stallion silhouette with a gold ribbon |
| 8 | `foal` | mare and foal side by side, gentle |

**الشبكة G3: أقسام السوق وقرار اليوم**

| # | المعرّف | الوصف |
|---|---|---|
| 1 | `cat_all` | four small different goods (basket, log, gem, sheep head) grouped in a tight cluster |
| 2 | `cat_food` | woven basket with bread, dates and a wheat sheaf |
| 3 | `cat_raw` | stacked logs, an iron ingot and a wool tuft |
| 4 | `cat_lux` | a gem, a silk bolt and a small perfume bottle |
| 5 | `cat_live` | a sheep head and a camel head side by side |
| 6 | `cat_hold` | open leather satchel with goods peeking out (what I am carrying) |
| 7 | `decide_sell` | small coin purse with an arrow coming out of a crate (sell what I carry here) |
| 8 | `decide_trade` | loaded camel on a winding road with a distant city (buy and travel) |

> أيقونة قرار «ابنِ أو استأجر هنا» (`decide_build`) تُرسم ضمن شبكة منفردة: small stall with a striped awning and a key. → `brand/next/ui/decide_build.webp`

### الدفعة ط — مشهد وشخصية الملحمة

- **المشهد** `brand/next/scene/butcher.webp` (21:9، عرض 1600): lively city butcher street: a clean stone shop with an awning, a butcher in a clean apron behind a counter, hanging cloth-wrapped cuts, a few customers, warm golden light. No blood, no text. اتبع كتلة المشاهد في `brand/PROMPTS_GEMINI.md`.
- **الشخصية** `brand/next/char/butcher.webp` (390×520 مفرغة): stout friendly adult butcher, 40s, trimmed mustache, clean white-and-teal apron, rolled sleeves, holding a wooden cutting board with neatly wrapped cuts, kind confident face. لا يشبه بطل اللاعب.

## ٤) نقاط المراجعة الذاتية الخاصة بهذه المهمة

- ضع صنفين متجاورين في الشبكة وانظر إليهما بحجم ٣٢ بكسلاً: إن لم يتميّزا فأعد توليد الأضعف تميّزاً.
- الجمل واحد السنام (جمل عربي) في أصنافه الخمسة. الجاموس غير البقر بالقرون العريضة واللون الداكن.
- لا يظهر في أي صورة نص أو رقم أو شعار أو سرج مزخرف بكتابة.
- لا دماء ولا مشاهد ذبح، حتى في أيقونة اللحم والملحمة.

## ٥) التسليم

مثل الدفعات السابقة: الملفات تحت `brand/next/`، وسطر لكل ملف في `MANIFEST.md`، وصورة `preview-<الدفعة>.png` على الرمل والأخضر الداكن جنباً إلى جنب، وcommit لكل دفعة، ودفع إلى `main` دون لمس غير `brand/next/`.
