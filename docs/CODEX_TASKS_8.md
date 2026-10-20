# مهمة كودكس (٨): أصول السفر البحري والسفن والقادة البحريين

تكملة لـ `docs/CODEX_TASKS_4.md` و`_5` (سُلّمتا). **اقرأ هذا الملف كله ثم نفّذ الدفعات بالترتيب**، وسلّم كل دفعة في commit مستقل وادفع قبل أن تبدأ التالية.

الميزة: السفر بحراً بين الموانئ بسفن تُملك وتُرقّى بقادة بحريين وطاقم، لنعلّم اللاعب الفرق بين السفر البري والبحري. **الموانئ فقط**: جدة وجازان (البحر الأحمر)، الإسكندرية (المتوسط)، بومباي وكلكتا (الهند)، كانتون وشنغهاي (الصين). **لا ميناء لفارس** ولا للرياض وحائل وأسوان وشيآن، فلا ترسم مشاهد ميناء لها.

## قواعد عامة (ملزمة)

1. **لا تعدّل أي ملف موجود** إلا `brand/next/MANIFEST.md` (تضيف إليه). ممنوع تعديل: `src/*`, `build.js`, `test/*`, `index.html`, `sw.js`, `version.json`، وكل ما في `brand/img/` وما سلّمته سابقاً في `brand/next/`.
2. الرسوم تُسلَّم في `brand/next/` (لا في `brand/img/`) مع سطر لكل ملف في `brand/next/MANIFEST.md` تحت قسم «الدفعة ٨-<حرف>» وصورة معاينة `brand/next/preview-8<حرف>.png` على الرمل والأخضر الداكن (كما فعلت سابقاً).
3. اللعبة **للجميع** (فيها طلاب): لا نص ولا أرقام ولا حروف داخل الصور، لا شعارات، لا لباس غير محتشم. **المعارك مطلوبة بكل ثقلها الملحمي** برسم الهوية نفسه (شبه واقعي بتظليل ناعم وحواف واضحة): اشتباك بالسيوف والعصي والحبال والصعود على السطح، وقوافل تُنهب، **وجرحى وقتلى ومفقودون** يُرَون في نهاية المعركة: أجساد ملقاة على الرمل أو على سطح السفينة، جرحى جالسون يضمّدون بأقمشة نظيفة، مقاتلون منهكون. القيد الوحيد: **بلا دماء إطلاقاً** (لا دم ولا بقع حمراء ولا جروح مفتوحة ولا أحشاء)، وبلا لقطات قريبة للقتل أو لوجه ميت؛ تُرى الأجساد من مسافة متوسطة أو بعيدة، بإضاءة وأقمشة وظلال توحي بالحزن والخسارة. وجوه محترمة بلا كاريكاتير ولا تنميط لقومية أو دين، وبلا علم الجمجمة (علم داكن بلا رموز).
4. لا تغيّر أي صورة موجودة ولا تضغطها ولا تعيد توليدها. رمز وضع المطوّر لا يُكتب في أي ملف ولا في الرسائل.
5. قبل كل دفع: `git pull --rebase origin main`، ثم `node test/run.js` إن توفر وإلا `sh test/all.sh` (لن تتأثر برسوم جديدة في `brand/next/`، لكنه شرط عام). الدفع إلى `main` مباشرة بلا PR.
6. رسائل الـcommit بالعربية، واضحة، ودفعة واحدة في كل commit. لا تذكر اسم أي نموذج في الرسائل ولا الملفات.
7. الأسلوب المعتمد (`brand/STYLE.md` و`brand/IDENTITY.md`): شبه واقعي مرسوم بتظليل ناعم وحواف واضحة، ألوان الرمل والأخضر الداكن واللازورد والذهب العسلي والطين والحبر. للبحر: لازورد وفيروزي هادئ، وللأخشاب بنّي دافئ.
8. **الدقة التاريخية:** السفن عربية الطراز (شراع لاتيني مثلّث، هيكل خشبي مخيط أو مسمّر، مؤخرة مرتفعة مزخرفة في الكبيرة). أنواع السفن الثلاثة: سنبوق صغير، بغلة متوسطة، بوم كبير. إن رسمت لمدن الهند والصين فيمكن استعمال طراز محلي واحد فقط في مشهد الميناء لا في السفن نفسها.
9. إن تعارضت وثيقة قديمة مع هذا الملف فالمرجع هو هذا الملف ثم `brand/IDENTITY.md` ثم `brand/STYLE.md`.

اقرأ قبل البدء: `CLAUDE.md`, `docs/CODEX_TASKS_4.md` (القواعد والأحجام وصيغ الأوامر)، `brand/STYLE.md`, `brand/ICONS.md`, `brand/CHARACTERS.md`، ومشهد `brand/img/map/caravan-painted.webp` وأيقونات `brand/img/map/road_*` كمرجع للنسب والأسلوب.

**ترتيب الأولوية:** الدفعة أ ثم ب (يحتاجهما المبرمج للمرحلة الأولى)، ثم هـ (مشاهد المعارك، وتخدم البر والبحر)، ثم ج ثم د.

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
| `sea_fight` | two crossed curved swords over a small dhow bow and a wave, teal and gold (no blood) |
| `sea_route_dot` | a short curved dashed wave line in gold on transparent, for a map route marker |
| `port_marker` | a small round map pin with an anchor in the centre, teal with a gold rim |
| `ship_rent` | a hanging wooden tag with a small dhow silhouette and a gold coin (no letters) |
| `ship_buy` | a small dhow silhouette inside a gold ring with a plus mark (no letters) |
| `ship_sell` | a small dhow silhouette inside a gold ring with a tiny coin stack beside it |
| `harbor_master` | a stamped parchment seal with a small anchor and a feather quill |

شبكات ٤×٣ (٢ شبكة + أيقونة إضافية، عدّل التقسيم كما يناسب)، معاينة `preview-8a.png`.

## الدفعة ب — أحداث البحر ورسوم الخريطة (١٩٢×١٩٢، alpha) في `brand/next/events/<id>.webp`

| المعرّف | الوصف |
|---|---|
| `sea_storm` | a dhow tilting among tall dark-teal waves under heavy clouds, a few gold lightning-free rays of light at the edge |
| `sea_pirates` | a low dark-sailed skiff with a plain dark flag racing toward a merchant dhow, a few silhouetted raiders ready with ropes and grappling hooks |
| `sea_pirate_fight` | an action scene on a dhow's deck: crew defending against boarding raiders, swords raised, ropes and grappling hooks flying, torn sail in the wind (dramatic, no blood) |
| `sea_pirate_repelled` | the raiders' skiff retreating with a torn sail while the dhow's crew raise their oars and a gold-trimmed teal banner in triumph |
| `sea_pirate_robbed` | the dhow's deck with opened crates and scattered sacks after a raid, the raiders' skiff sailing away at the horizon, a dimmed lantern |
| `sea_fair_wind` | a dhow with full sails and a bright wind arrow, a few gulls |
| `sea_calm` | a dhow on glassy water with limp sails, a sunset glow |
| `sea_fog` | a dhow faintly visible in soft sand-coloured fog, a hanging lantern glowing |
| `sea_island` | a small palm island with a short wooden jetty and a moored dhow |
| `sea_leak` | a dhow's side with a small patched plank and a bucket (no people) |
| `sea_whales` | a calm sea with two gentle whale backs and a dhow in the distance |

شبكتان (٤×٢ و٤×١)، معاينة `preview-8b.png`.

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
- `pirate_captain`: قائد قراصنة مهيب بسيف معقوف في يده، عمامة داكنة ووشاح قرمزي داكن، قامة قوية ونظرة حادة، وجه محترم بلا ندوب مبالغ فيها ولا كاريكاتير (خصم جدّي لا مسخرة).
- `pirate_raider`: مقاتل قرصان شاب برداء داكن مفتوح وحبل وخطّاف، وقفة هجوم (لا دماء ولا وجه مشوّه).
- `harbor_master`: ناظر ميناء (الشاهبندر) بدين ودود في ثوب أنيق، ختم وسجل بين يديه.

شبكات حسب ما يخرج (٤×٢)، معاينة `preview-8c.png`. نسخة محايدة لكل شخصية تكفي الآن؛ التعابير لاحقاً.

## الدفعة د — مشاهد (١٦٠٠×٦٨٦، ٢١:٩) في `brand/next/scene/<id>.webp`

بلا نص. المشاهد العادية بلا أشخاص بارزين (ظلال بعيدة مقبولة)، وستأتي مشاهد المعارك في الدفعة هـ:

| المعرّف | الوصف |
|---|---|
| `sea_voyage` | a dhow crossing a calm teal sea at golden sunset, distant coastline, gulls |
| `sea_storm_scene` | the same dhow in a stormy dark-teal sea, heavy clouds, a sliver of light breaking through (dramatic but not scary) |
| `sea_dock` | a busy but orderly quay: stacked crates and sacks, a docked baghla being loaded, harbor lanterns, early morning light |
| `sea_fleet` | three docked dhows (small, medium, large) side by side in a calm harbor, a lantern-lit pier |

معاينة `preview-8d.png`.

## الدفعة هـ — مشاهد نتائج المعارك، برية وبحرية (١٦٠٠×٦٨٦، ٢١:٩) في `brand/next/scene/<id>.webp`

**الفكرة:** عند كل هجوم (قطاع طرق على القافلة براً، أو قراصنة على السفينة بحراً) يرى اللاعب مشهد النتيجة. **لا يجوز أن يتكرر المشهد نفسه**، فلكل نتيجة عدّة مشاهد مختلفة، والبرنامج يختار منها عشوائياً دون تكرار متتالٍ. لذلك **يجب أن يختلف كل مشهد عن إخوته في زاوية الكاميرا ووقت اليوم والتضاريس ونقطة التركيز**، لا أن يكون نسخة بتعديل بسيط.

مجموعة البر (الرمل والجبال والواحات والحصون المهجورة) ومجموعة البحر (سفن عربية، أمواج، ساحل، ميناء)، لكل منهما:

| النتيجة | العدد | المضمون |
|---|---|---|
| `attack` هجوم | ٢ | لحظة الكمين: المهاجمون يظهرون، القافلة تتوقف، توتر قبل القتال (بر: كمين من خلف الكثبان أو من ممر جبلي؛ بحر: زورق قراصنة يقترب أو يلتف حول السفينة) |
| `repelled` صدّ ونصر | ٤ | اندحار المهاجمين وفرارهم، رجال القافلة يرفعون راية ظافرة، غنائم ساقطة منهم، تعب النصر وإسعاف الجرحى من رجالنا (من مسافة، بلا دماء) |
| `robbed` خسارة | ٤ | نهاية معركة مؤلمة: **أبطالنا ملقون على الأرض أو السطح** (جرحى ومنهكون وبعضهم لا يتحرك)، البضاعة منهوبة وصناديق مفتوحة، الجمال أو السفينة مبعثرة، المهاجمون يبتعدون، غروب أو رمادية حزينة |
| `paid` جزية | ٢ | رجل القافلة يسلّم كيس النقود لقائد المهاجمين على مضض، الأجواء متوترة والحرّاس عاجزون |
| `evaded` نجاة بالمناورة | ٢ | القافلة تلتف حول الكمين ليلاً أو في الضباب أو عبر وادٍ ضيق، والمهاجمون يتخبطون بعيداً |

المعرّفات: `land_attack_1..2`, `land_repelled_1..4`, `land_robbed_1..4`, `land_paid_1..2`, `land_evaded_1..2`، ومثلها `sea_attack_1..2`, `sea_repelled_1..4`, `sea_robbed_1..4`, `sea_paid_1..2`, `sea_evaded_1..2` (٥٦ مشهداً). إن ضاق الوقت فالأولوية لـ`robbed` ثم `repelled` في البر ثم البحر، ثم الباقي.

**لتنويع المشاهد المتشابهة داخل المجموعة الواحدة** غيّر على الأقل ثلاثة من: وقت اليوم (فجر/ظهيرة/غروب/ليل بقمر)، التضاريس (كثبان/ممر صخري/واحة/سبخة/حصن مهجور؛ في البحر: عرض البحر/قرب الساحل/ميناء صغير/ضباب)، الزاوية (عالية/منخفضة/من خلف الأبطال)، مكان الأبطال في الكادر، وعدد المهاجمين.

معاينة `preview-8e.png` تعرض كل مجموعة في صف مصغّر.

## ما أحتاجه في التسليم

- الملفات بالأسماء والمجلدات أعلاه، وكلها شفافة فعلية (أيقونات وشخصيات) حسب `brand/ICON_TRANSPARENCY.md`، والمشاهد JPG أو WebP.
- سطر في `brand/next/MANIFEST.md` لكل ملف، مع صور المعاينة.
- أي أصل رأيتَه غير مناسب ثقافياً أو يصعب قراءته عند الحجم الصغير اذكره في المانيفست مع ما غيّرتَه.
- لا تدمج شيئاً في اللعبة؛ الدمج عندي.
