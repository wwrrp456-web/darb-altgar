# مهمة كودكس (٤): أصول المرحلة ٥ والقافلة المتحركة والإنجازات ومشاهد المدن

تكملة لـ `docs/CODEX_ART_TASKS.md` و`_2` و`CODEX_TASKS_3.md` (سُلّمت كلها). **اقرأ هذا الملف كله ثم نفّذ الدفعات بالترتيب**، وسلّم كل دفعة في commit مستقل ثم ادفع قبل أن تبدأ التالية، حتى يدمج المساعد البرمجي أولاً بأول. كل المهام هنا **رسوم فقط** (لا شيفرة).

## قواعد عامة (ملزمة)

1. **لا تعدّل أي ملف موجود** إلا `brand/next/MANIFEST.md` (تضيف إليه). ممنوع تعديل: `src/*`, `build.js`, `test/*`, `index.html`, `sw.js`, `version.json`، وكل ما في `brand/img/` وما سلّمته سابقاً في `brand/next/`. المالك والمساعد البرمجي يعملان على هذه الملفات بالتوازي.
2. الرسوم تُسلَّم في `brand/next/` (لا في `brand/img/`) مع سطر لكل ملف في `brand/next/MANIFEST.md` تحت قسم «الدفعة ٤-<حرف>» وصورة معاينة `brand/next/preview-<الدفعة>.png` على الرمل والأخضر الداكن كما في الدفعات السابقة. الدمج في اللعبة من جهة المساعد البرمجي.
3. اللعبة **للجميع** (رجال وشباب وطلاب): لا نص ولا أرقام ولا حروف داخل الصور، لا شعارات، لا لباس غير محتشم، لا عنف ولا دماء، ملامح محترمة غير كاريكاتيرية ولا مسيئة لأي شعب. لا خنزير ولا خمر. **لا تُرسم الكعبة ولا صور للصلاة** في أي مشهد ديني؛ تكفي الرموز العامة (هلال، فانوس، تمر، خيام).
4. لا تغيّر أي صورة موجودة ولا تضغطها ولا تعيد توليدها (هي ملك المالك). رمز وضع المطوّر لا يُكتب في أي ملف ولا في الرسائل.
5. قبل كل دفع: `git pull --rebase origin main`. لا تدفع إن فشل `sh test/all.sh` (لن يتأثر برسوم جديدة في `brand/next/`، لكنه شرط عام). الدفع إلى `main` مباشرة بلا PR.
6. رسائل الـcommit بالعربية، واضحة، ودفعة واحدة في كل commit. لا تذكر اسم أي نموذج في الرسائل ولا الملفات.
7. التزم بالأسلوب المعتمد (`brand/STYLE.md` و`brand/IDENTITY.md`): شبه واقعي مرسوم بتظليل ناعم وحواف واضحة، ألوان الرمل والأخضر الداكن (واحة) واللازورد والذهب العسلي والطين. الأيقونات والشخصيات WebP بقناة alpha فعلية (لا تصدّر JPG للمفرغ).
8. إن تعارضت وثيقة قديمة مع هذا الملف فالمرجع هو هذا الملف ثم `brand/IDENTITY.md` ثم `brand/STYLE.md`.

اقرأ قبل البدء: `CLAUDE.md`, `DESIGN.md`, `docs/CODEX_ART_TASKS.md` (الأقسام ١–٥: سطر الأسلوب الثابت والأحجام)، `brand/STYLE.md`, `brand/ICONS.md`, `brand/CHARACTERS.md`, `brand/PROMPTS_GEMINI.md`، ومشهد `brand/img/scene/plaza_riyadh.webp` مرجعاً لتقسيم المشاهد.

**ترتيب الأولوية:** الدفعة أ ثم ب ثم ج ثم د (بدفعاتها الخمس) ثم هـ. الدفعتان أ وب يحتاجهما المساعد البرمجي أولاً.

---

## الدفعة أ — أصول المرحلة ٥ (٢٤ أيقونة + شخصية + ٤ مشاهد)

### أ١) أيقونات واجهة (١٢٨×١٢٨، alpha) في `brand/next/ui/<id>.webp`

| المعرّف | الوصف |
|---|---|
| `ins_goods` | closed wooden crate wrapped by a protective teal shield-shaped canvas cover with a small gold clasp |
| `ins_factory` | small workshop building under a teal shield-shaped canopy with a gold rim |
| `ins_claim` | an open sealed letter with a gold coin dropping out of it into a small hand |
| `shop_up_shelf` | a wooden shelf unit with three tidy rows of colored goods, a small gold upward arrow |
| `shop_up_awning` | striped teal-and-sand shop awning with a small gold upward arrow |
| `shop_up_sign` | a hanging carved wooden shop sign with no letters (blank panel with a tiny gold crescent emblem) |
| `shop_up_lock` | a sturdy iron-bound shop door with a brass lock |
| `route_template` | a rolled parchment map with a dotted route between two small towers and a bookmark ribbon |
| `route_save` | a small brass pin on a parchment with a gold plus mark |
| `mount_camel` | a proud camel head in profile wearing a decorated teal bridle with gold tassels |
| `mount_horse` | a noble horse head in profile wearing a decorated teal bridle with gold tassels |
| `mount_speed` | a feather-light brass winged anklet / small wing emblem in teal and gold |
| `mount_load` | a camel pack saddle with two sturdy sacks and a gold buckle |
| `season_ramadan` | a warm brass lantern with a small crescent beside it, a few dates in a bowl |
| `season_eid` | a gift-like cloth bundle tied with gold ribbon, a small tray of sweets |
| `season_hajj` | a pilgrim road sign made of stacked tents and a small caravan silhouette (no Kaaba, no people) |
| `season_harvest` | a sheaf of golden wheat and a basket of dates |
| `season_winter` | a folded wool blanket, a small brazier with embers |
| `rival_badge` | a round badge showing a stern merchant silhouette with a maroon turban and a gold ring |
| `rival_win` | a gold coin stack tipped toward the rival's side with a small maroon flag |
| `rival_lose` | a gold coin stack tipped toward the player's side with a small teal flag |
| `product_story` | an old lamp-lit scroll with a small pictured spice sprig on it (no letters) |
| `product_story_lock` | the same scroll closed with a small brass padlock |
| `event_festival` | a small festive bunting of three flags (teal, gold, clay) with no letters |

شبكات ٤×٢ (٣ شبكات)، معاينة `preview-5a.png`.

### أ٢) شخصية التاجر المنافس (٣٩٠×٥٢٠ مفرغة) في `brand/next/char/<id>.webp`

تاجر **طموح وذكي** بنفس مقاس باقي الشخصيات. يختلف بوضوح عن بطل اللاعب والزعماء والتاجر العام: رجل في أواخر الثلاثينيات، قامة طويلة نحيلة، لحية مهذبة داكنة وشارب رفيع، عمامة عنابية ذات ثنيات أنيقة وثوب كحلي داكن بتطريز ذهبي، وعباءة قصيرة بلون الطين، يحمل عصا قصيرة بمقبض نحاسي ودفتراً صغيراً. عيناه واثقتان.

- `rival_smug` (واثق مبتسم ابتسامة جانبية)
- `rival_neutral` (جاد يراقب)
- `rival_upset` (منزعج بوقار، بلا غضب مبالغ ولا عنف)

سلّم الثلاثة في صف واحد على معاينة `preview-5b.png` لإظهار ثبات الوجه والزي.

### أ٣) مشاهد المواسم (21:9، عرض ١٦٠٠) في `brand/next/scene/<id>.webp`

لافتات تظهر أعلى السوق وقت الموسم، بلا ناس بوجوه مفصلة ولا نص:
- `season_ramadan`: evening market street with hanging brass lanterns, a crescent in the dusk sky, tables of dates and sweets, warm gold light, tiny distant silhouettes only.
- `season_eid`: bright festive morning market with colorful bunting, gift bundles and sweets stalls, children's swings far in the background (tiny silhouettes).
- `season_hajj`: a long desert road with rows of tents, caravans arriving at sunrise, a distant mountain; no Kaaba and no people close-up.
- `season_harvest`: golden wheat fields and date palms with laden carts heading to the market gate.

معاينة `preview-5c.png`. `season_winter` لا يلزمه مشهد (الأيقونة تكفي).

---

## الدفعة ب — القافلة المتحركة على الخريطة

الخريطة تعرض قافلة تمشي على الطريق بحسب تقدّم الرحلة. المسار: `brand/next/map/<id>.webp`.

1. **`camel_walk`**: شريط (sprite sheet) أفقي من **٦ إطارات متساوية**، كل إطار ٢٥٦×٢٥٦ (العرض الكلي ١٥٣٦، الارتفاع ٢٥٦)، جمل محمّل بحمولتين وقماش أزرق ومعه صاحبه يقوده (وجه صغير بلا تفاصيل)، **جانبي ينظر إلى اليمين**، يمشي مشية دورية متصلة (الإطار ٦ يعود سلساً إلى ١). خلفية شفافة، الأرجل والحمولة والحبل تتحرك بنعومة، **كل إطار بنفس الحجم والقاعدة الأرضية** حتى لا يهتز عند التبديل.
2. **`camel_rest`**: إطار واحد ٢٥٦×٢٥٦ للجمل واقفاً بالهيئة نفسها (عند الانتظار في المدينة).
3. **`dust`**: شريط من **٤ إطارات** ١٢٨×١٢٨ لغبار خفيف يتبدد خلف الجمل (alpha ناعم، لون رملي).
4. **علامات أحداث الطريق** أيقونات ١٢٨×١٢٨ في `brand/next/map/`: `road_bandits` (خيمتان وراية صغيرة بلون الطين ومنظار)، `road_storm` (سحابة رمل عاصفة)، `road_oasis` (نخلتان وبركة ماء)، `road_rain` (غيمة صغيرة ومطر نادر على الصحراء)، `road_festival` (راية احتفال)، `road_block` (حاجز خشبي عند حدود مغلقة).
5. **`route_dot`**: نقطة صغيرة ٣٢×٣٢ لتنقيط مسار الرحلة (دائرة ذهبية بحافة داكنة) و**`route_arrow`** سهم صغير ٤٨×٤٨ ذهبي.

سلّم المعاينة `preview-5d.png` وفيها الشريط مفتوحاً مع صف يحاكي تتابع الإطارات.

---

## الدفعة ج — أيقونات الإنجازات (٤٤ أيقونة، ١٢٨×١٢٨ alpha) في `brand/next/ach/<id>.webp`

القائمة معتمدة (`docs/ACHIEVEMENTS_DRAFT.md`، ٤٠ إنجازاً). لكل إنجاز **رمز** يوضع داخل ميدالية؛ الميداليات الثلاث تُسلَّم منفصلة، والمساعد البرمجي يركّبها (الرمز فوق الميدالية بحسب الدرجة).

**الميداليات (٤):** `medal_bronze`, `medal_silver`, `medal_gold`, `medal_hidden` (شارة رمادية مغلقة بختم استفهام مرسوم كشكل لا حرف، تُعرض للإنجازات المخفية قبل كشفها). كلها دائرة بحافة زخرفية، الوسط فارغ لوضع الرمز.

**الرموز (٤٠):** رمز واحد بسيط واضح عند ٦٤ بكسل، بألوان الهوية، بلا خلفية، وبلا ميدالية:

| المعرّف | الرمز |
|---|---|
| `trade_first` | a coin purse with a green leaf |
| `profit_first` | a coin stack beside a small upward arrow |
| `profit_twenty` | a polished brass scale with a full pan of gold |
| `haggle_read` | two eyes and a small raised eyebrow over a handshake |
| `fx_three` | three small coins in sand, teal and gold tones side by side |
| `trip_first` | a lone camel footprint trail leading to a gate |
| `home_routes` | a small city gate with a tiny map pin |
| `country_two` | a border post with two flags of plain colors (no symbols) |
| `world_five` | a small globe ringed by five gold pins |
| `herd_arrival` | a shepherd's crook beside three tiny sheep |
| `insured_return` | a crate with a teal shield at a gate |
| `farm_first` | a small farm gate with a wheat sheaf |
| `breed_four` | four tiny animal heads (sheep, goat, cow, horse) in a row |
| `first_birth` | a newborn lamb in soft light |
| `hybrid_first` | a foal with two small flower sprigs of different colors |
| `stable_star` | a noble horse head with a gold star |
| `fresh_sale` | a wrapped parcel of fresh meat cuts on a clean board |
| `rent_first` | a small striped stall with a rent key |
| `own_shop` | a gold key with a small shop front |
| `store_order` | stacked crates neatly arranged on shelves |
| `steady_staff` | a small bag of wages with a tidy checkmark leaf |
| `factory_first` | a workshop chimney with first fine thread |
| `factory_three` | a workshop with three rising steps and a gold gear |
| `manager_watch` | a ledger and a small pair of reading glasses |
| `boss_friend` | an open hand holding a small crown |
| `pact_first` | a sealed scroll with a wax seal |
| `pact_done` | a scroll with a green leaf stamp and a ribbon |
| `pact_exclusive` | a scroll with a golden key emblem |
| `boss_three` | three small crowns in a row over three arches |
| `zakat_first` | a hand giving a coin into an open bowl |
| `zakat_on_time` | a bowl with a small hourglass |
| `debt_first` | a small broken chain link with a coin |
| `debt_free` | an open chain with a free bird |
| `rep_high` | a gold star over an ivory ribbon |
| `safe_reserve` | a sturdy locked chest with a shield |
| `learn_first` | a small lit oil lamp over an open book |
| `learn_journal` | a closed ledger with three small tabs |
| `learn_four` | a compass with four marked points |
| `story_secret` | a keyhole in an old scroll case |
| `learn_grad` | a scholar's turban with a quill |

شبكات ٤×٢ (٦ شبكات للرموز وشبكة للميداليات)، معاينة `preview-5e.png` تُظهر كل رمز داخل ميداليته الفضية تجريبياً.

---

## الدفعة د — مشاهد المدن الـ١٥ وأصحابها (على خمس دفعات صغيرة بحسب الدولة)

الرياض جاهزة (`plaza_riyadh.webp`). المطلوب لكل مدينة باقية: **مشهد ساحة** + **٣ تعابير للزعيم** (٣٩٠×٥٢٠ مفرغة) بنفس مواصفات مهمة الرياض (المهمة ٢ و٣ من `CODEX_TASKS_3.md` تُتّبع حرفياً):

- المشهد `brand/next/scene/plaza_<city>.webp` — 21:9، عرض ١٦٠٠، **بتقسيم الرياض نفسه: ثلاث مناطق متباعدة أفقياً**: يساراً ركن هادئ تحت شجرة أو قوس (مجلس عمّ سالم)، وسطاً أكشاك التجار، يميناً مجلس الزعيم بمدخل مرتفع وبساط. العمارة والنبات والمناخ والألوان بحسب طابع المدينة، وبلا نص ولا ناس بوجوه مفصلة (ظلال بعيدة صغيرة فقط).
- الزعيم `brand/next/char/boss_<city>_{warm,stern,displeased}.webp`: **ارجع إلى صورته الحالية** `brand/img/boss/<city>.webp` (أو `.jpg`) وحافظ على ملامحه وملابسه تماماً.

التقسيم (كل دفعة في commit ومعاينة `preview-5f-<دولة>.png`):

| الدفعة | المدن (المعرّفات) | طابع المشهد |
|---|---|---|
| د١ مصر | `cairo`, `alex`, `aswan` | القاهرة: أسواق قديمة ومشربيات ومآذن؛ الإسكندرية: ميناء ومنارة ومراكب؛ أسوان: نيل وصخور وفلوكة ونخيل |
| د٢ السعودية | `jeddah`, `hail`, `jazan` | جدة: بيوت حجازية بالرواشين وميناء؛ حائل: قلعة طينية وجبال أجا ونخيل؛ جازان: بيوت تهامية ومزارع بن وبحر |
| د٣ فارس | `isfahan`, `shiraz`, `tabriz` | أصفهان: ميدان بقباب فيروزية وأقواس؛ شيراز: حدائق وورود وبوابة مقوّسة؛ تبريز: بازار مسقوف بالطوب وسجاد معلّق |
| د٤ الهند | `delhi`, `mumbai`, `kolkata` | دلهي: أسواق قلعة حمراء وتوابل؛ مومباي: بوابة الميناء وسفن؛ كلكتا: نهر وجسر ومعابد شاي (عمارة مدنية فقط) |
| د٥ الصين | `xian`, `guangzhou`, `shanghai` | شيآن: سور المدينة وأبراج وفوانيس؛ كانتون: ميناء نهري وسفن خشبية؛ شنغهاي: واجهة النهر بمبانٍ تراثية |

**أيقونة موحّدة:** `spot_*` الموجودة تكفي (لا جديد).

---

## الدفعة هـ — رسوم متجر Google Play (آخراً)

- `brand/next/store/feature.webp` — ١٠٢٤×٥٠٠: مشهد رحلة القافلة عند الغروب بالأسلوب المعتمد، **بلا أي نص** (العنوان يضيفه المساعد البرمجي لاحقاً)، المحتوى المهم في الوسط لأن الحواف تُقص أحياناً.
- `brand/next/store/promo_square.webp` — ١٠٢٤×١٠٢٤: التاجر البطل والجمل بأسلوب الغلاف، بلا نص.

---

## ما يُسلَّم مع كل دفعة

1. الملفات في المسارات أعلاه بالأحجام المطلوبة.
2. معاينة `brand/next/preview-<الدفعة>.png`.
3. سطر لكل ملف في `brand/next/MANIFEST.md` (المعرّف، المسار، الحجم، التاريخ، الحالة، ملاحظة) تحت عنوان «الدفعة ٤-أ» وهكذا.
4. نقاط المراجعة الذاتية قبل التسليم: لا نص أو حروف في أي صورة؛ الشخصية ثابتة الوجه والزي بين التعابير؛ الأيقونات تُقرأ عند ٣٢ بكسلاً؛ لا خنزير ولا خمر ولا دماء؛ لا الكعبة ولا صلاة؛ كل إطار في شريط الحركة بنفس الحجم والقاعدة.
5. إن رأيت أن رسماً لا يستوفي الشروط بعد المحاولات، سلّم أفضل نسخة واكتب العيب بصدق في خانة الملاحظة.

## مؤجل (لا يُولَّد الآن)

رسوم الجيل الثاني والعصور الحديثة، ولقطات شاشة المتجر (تُؤخذ من اللعبة نفسها).
