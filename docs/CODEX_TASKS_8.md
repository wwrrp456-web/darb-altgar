# مهمة كودكس (٨): أصول السفر البحري والسفن والقادة البحريين

تكملة لـ `docs/CODEX_TASKS_4.md` و`_5` (سُلّمتا). **اقرأ هذا الملف كله ثم نفّذ الدفعات بالترتيب**، وسلّم كل دفعة في commit مستقل وادفع قبل أن تبدأ التالية.

الميزة: السفر بحراً بين الموانئ بسفن تُملك وتُرقّى بقادة بحريين وطاقم، لنعلّم اللاعب الفرق بين السفر البري والبحري. **الموانئ فقط**: جدة وجازان (البحر الأحمر)، الإسكندرية (المتوسط)، بومباي وكلكتا (الهند)، كانتون وشنغهاي (الصين). **لا ميناء لفارس** ولا للرياض وحائل وأسوان وشيآن، فلا ترسم مشاهد ميناء لها.

## قواعد عامة (ملزمة)

1. **لا تعدّل أي ملف موجود** إلا `brand/next/MANIFEST.md` (تضيف إليه). ممنوع تعديل: `src/*`, `build.js`, `test/*`, `index.html`, `sw.js`, `version.json`، وكل ما في `brand/img/` وما سلّمته سابقاً في `brand/next/`.
2. الرسوم تُسلَّم في `brand/next/` (لا في `brand/img/`) مع سطر لكل ملف في `brand/next/MANIFEST.md` تحت قسم «الدفعة ٨-<حرف>» وصورة معاينة `brand/next/preview-8<حرف>.png` على الرمل والأخضر الداكن (كما فعلت سابقاً).
3. اللعبة **للجميع**: لا نص ولا أرقام ولا حروف داخل الصور، لا شعارات، لا لباس غير محتشم، لا عنف ولا دماء ولا جثث ولا أسلحة بارزة؛ القراصنة يُمثَّلون بزورق وأشرعة داكنة وأعلام بلا رموز، لا بأشخاص يقاتلون. ملامح محترمة غير كاريكاتيرية.
4. لا تغيّر أي صورة موجودة ولا تضغطها ولا تعيد توليدها. رمز وضع المطوّر لا يُكتب في أي ملف ولا في الرسائل.
5. قبل كل دفع: `git pull --rebase origin main`، ثم `node test/run.js` إن توفر وإلا `sh test/all.sh` (لن تتأثر برسوم جديدة في `brand/next/`، لكنه شرط عام). الدفع إلى `main` مباشرة بلا PR.
6. رسائل الـcommit بالعربية، واضحة، ودفعة واحدة في كل commit. لا تذكر اسم أي نموذج في الرسائل ولا الملفات.
7. الأسلوب المعتمد (`brand/STYLE.md` و`brand/IDENTITY.md`): شبه واقعي مرسوم بتظليل ناعم وحواف واضحة، ألوان الرمل والأخضر الداكن واللازورد والذهب العسلي والطين والحبر. للبحر: لازورد وفيروزي هادئ، وللأخشاب بنّي دافئ.
8. **الدقة التاريخية:** السفن عربية الطراز (شراع لاتيني مثلّث، هيكل خشبي مخيط أو مسمّر، مؤخرة مرتفعة مزخرفة في الكبيرة). أنواع السفن الثلاثة: سنبوق صغير، بغلة متوسطة، بوم كبير. إن رسمت لمدن الهند والصين فيمكن استعمال طراز محلي واحد فقط في مشهد الميناء لا في السفن نفسها.
9. إن تعارضت وثيقة قديمة مع هذا الملف فالمرجع هو هذا الملف ثم `brand/IDENTITY.md` ثم `brand/STYLE.md`.

اقرأ قبل البدء: `CLAUDE.md`, `docs/CODEX_TASKS_4.md` (القواعد والأحجام وصيغ الأوامر)، `brand/STYLE.md`, `brand/ICONS.md`, `brand/CHARACTERS.md`، ومشهد `brand/img/map/caravan-painted.webp` وأيقونات `brand/img/map/road_*` كمرجع للنسب والأسلوب.

**ترتيب الأولوية:** الدفعة أ ثم ب (يحتاجهما المبرمج للمرحلة الأولى)، ثم ج ثم د.

---

## الدفعة أ — أيقونات الواجهة (١٢٨×١٢٨، alpha) في `brand/next/ui/<id>.webp`

| المعرّف | الوصف |
|---|---|
| `travel_land` | a laden camel in profile walking right, a small dotted road beneath, teal-and-gold bridle |
| `travel_sea` | a small lateen-sail dhow on gentle teal waves, dotted wake line beneath |
| `port` | a stone harbor quay with a wooden bollard, a coiled rope and a small lantern |
| `ship_dhow` | a small sambuk dhow, single lateen sail, simple wooden hull, side view facing right |
| `ship_baghla` | a medium baghla dhow, one large lateen sail and a smaller one, carved raised stern, side view facing right |
| `ship_boom` | a large boom dhow, two lateen sails, tall decorated stern with a brass lantern, side view facing right |
| `ship_hull` | a wooden hull plank with sturdy iron nails and a small gold upward arrow |
| `ship_sail` | a rolled lateen sail on a spar with a small gold upward arrow |
| `ship_crew` | a coil of rope, a small ship's wheel-less steering oar and a sailor's cap in teal |
| `ship_guard` | a round shield with a teal-and-gold rim leaning on a wooden oar (no weapons) |
| `ship_cargo` | an open wooden hold with stacked sacks and a crate, seen from above, gold rope |
| `port_fee` | a gold coin resting on a small wooden harbor post with an anchor engraved on it |
| `sea_insurance` | a wooden crate under a teal shield-shaped sail cover with a small anchor clasp |
| `monsoon_out` | a lateen sail curved by a wind arrow pointing right, a few small waves, teal and gold |
| `monsoon_back` | a lateen sail curved by a wind arrow pointing left, a few small waves, teal and gold |
| `wind_calm` | a flat calm sea with a tiny sun and a limp pennant on a pole |
| `captain_nav` | a brass kamal navigation board with a knotted cord and a small compass rose |
| `captain_rank` | a navigator's cap with a gold rope trim and a small anchor badge |
| `sea_route_dot` | a short curved dashed wave line in gold on transparent, for a map route marker |
| `port_marker` | a small round map pin with an anchor in the centre, teal with a gold rim |
| `ship_rent` | a hanging wooden tag with a small dhow silhouette and a gold coin (no letters) |
| `ship_buy` | a small dhow silhouette inside a gold ring with a plus mark (no letters) |
| `ship_sell` | a small dhow silhouette inside a gold ring with a tiny coin stack beside it |
| `harbor_master` | a stamped parchment seal with a small anchor and a feather quill |

شبكات ٤×٣ (٢ شبكة)، معاينة `preview-8a.png`.

## الدفعة ب — أحداث البحر ورسوم الخريطة (١٩٢×١٩٢، alpha) في `brand/next/events/<id>.webp`

| المعرّف | الوصف |
|---|---|
| `sea_storm` | a dhow tilting among tall dark-teal waves under heavy clouds, a few gold lightning-free rays of light at the edge |
| `sea_pirates` | a low dark-sailed skiff with a plain dark-teal flag approaching, no people visible |
| `sea_fair_wind` | a dhow with full sails and a bright wind arrow, a few gulls |
| `sea_calm` | a dhow on glassy water with limp sails, a sunset glow |
| `sea_fog` | a dhow faintly visible in soft sand-coloured fog, a hanging lantern glowing |
| `sea_island` | a small palm island with a short wooden jetty and a moored dhow |
| `sea_leak` | a dhow's side with a small patched plank and a bucket (no people) |
| `sea_whales` | a calm sea with two gentle whale backs and a dhow in the distance |

شبكة ٤×٢ واحدة، معاينة `preview-8b.png`.

### ب٢) أيقونات خريطة للسفن (١٩٢×١٩٢، alpha) في `brand/next/map/<id>.webp`

سفن للخريطة تُرى من الجانب متجهة **إلى اليمين**، على خلفية شفافة تماماً (بلا ظل أرضي)، بأسلوب `brand/img/map/caravan-painted.webp`:

| المعرّف | الوصف |
|---|---|
| `ship_dhow_map` | sambuk, one lateen sail, simple hull |
| `ship_baghla_map` | baghla, two sails, carved raised stern |
| `ship_boom_map` | boom, two sails, tall decorated stern |

معاينة `preview-8b-map.png`.

## الدفعة ج — القادة البحريون والطاقم (٣٩٠×٥٢٠ مفرغة) في `brand/next/char/<id>.webp`

بنفس مقاس باقي الشخصيات وبأسلوبها، **وقفة كاملة**، تختلف بوضوح في البنية والعمر والملامح عن بطل اللاعب والزعماء وعمّ سالم. أزياء بحرية عربية محتشمة (ثوب، عمامة أو غطرة، حزام، وشاح):

- `captain_old`: نوخذة عجوز حكيم، لحية بيضاء مشذّبة، عمامة بيضاء، يمسك عصا خشبية ولفافة خريطة.
- `captain_nav`: ملاّح أربعيني نحيل حاد النظرة، يحمل لوح الكمال (kamal) وحبله، غطرة بيضاء.
- `captain_bold`: قبطان شاب جريء مفتول الذراعين، ابتسامة واثقة، حبل ملفوف على كتفه.
- `sailor`: بحّار شاب يحمل حبلاً وعمود مجداف، عمامة قصيرة.
- `harbor_master`: ناظر ميناء (الشاهبندر) بدين ودود في ثوب أنيق، ختم وسجل بين يديه.

شبكات حسب ما يخرج (٣×٢)، معاينة `preview-8c.png`. نسخة محايدة لكل شخصية تكفي الآن؛ التعابير لاحقاً.

## الدفعة د — مشاهد (١٦٠٠×٦٨٦، ٢١:٩) في `brand/next/scene/<id>.webp`

بلا نص ولا أشخاص بارزين (ظلال بعيدة مقبولة):

| المعرّف | الوصف |
|---|---|
| `sea_voyage` | a dhow crossing a calm teal sea at golden sunset, distant coastline, gulls |
| `sea_storm_scene` | the same dhow in a stormy dark-teal sea, heavy clouds, a sliver of light breaking through (dramatic but not scary) |
| `sea_dock` | a busy but orderly quay: stacked crates and sacks, a docked baghla being loaded, harbor lanterns, early morning light |
| `sea_fleet` | three docked dhows (small, medium, large) side by side in a calm harbor, a lantern-lit pier |

معاينة `preview-8d.png`.

## ما أحتاجه في التسليم

- الملفات بالأسماء والمجلدات أعلاه، وكلها شفافة فعلية (أيقونات وشخصيات) حسب `brand/ICON_TRANSPARENCY.md`، والمشاهد JPG أو WebP.
- سطر في `brand/next/MANIFEST.md` لكل ملف، مع صور المعاينة.
- أي أصل رأيتَه غير مناسب ثقافياً أو يصعب قراءته عند الحجم الصغير اذكره في المانيفست مع ما غيّرتَه.
- لا تدمج شيئاً في اللعبة؛ الدمج عندي.
