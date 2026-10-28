# مهام كودكس الباقية في الخطة (دفعة واحدة، توليد صور فقط)

**السياق:** بطلب بن محمود تُجمع كل صور الخطة الرئيسية (`docs/MASTER_PLAN.md`) الباقية على كودكس في ملف واحد، تُولَّد الآن وتنتظر في `brand/next/` حتى يحين دور حزمتها، فيدمجها Claude/Sonnet. هذا يوفّر الحدّ بدل جلسات متفرقة.

**القواعد نفسها في `docs/CODEX_ART_TODAY.md`:** بلا أي نص أو حرف أو رقم داخل الصورة؛ لا تعدّل `src/` ولا `test/` ولا أي صورة موجودة؛ حدّث `MANIFEST.json` و`PROMPTS_GENERATED.md` و`docs/CODEX_TODAY.md`؛ commit لكل مجموعة، ودمج `origin/main` قبل الدفع. الأسلوب المعتمد: شبه واقعي مرسوم، بألوان الهوية (`brand/IDENTITY.md`، `brand/STYLE.md`).

**ضوابط المحتوى (مهمة):** لا رسم للكعبة ولا المسجد الحرام ولا أي مكان مقدس، ولا مصاحف ولا كتابة قرآنية أو خط عربي، ولا وجوه بشرية مفصّلة لأشخاص حقيقيين، ولا رموز دينية لغير الإسلام. المواسم الدينية تُعبَّر عنها بما يحيط بالتجارة والناس (فوانيس، تمر، زينة، قوافل)، لا بالشعائر نفسها.

---

## المجموعة أ: زخارف المواسم (لـ WP-23 «المواسم بأهداف»)
لكل موسم في اللعبة جائزة تجميلية بلا أثر مالي: زخرفة يضعها اللاعب على قافلته. **١١ صورة**، WebP **192×192** بقناة alpha فعلية، الزخرفة وحدها (لا جمل ولا خلفية)، كأيقونات `brand/img/goods/`. المجلد: `brand/next/seasons/`.

| # | المعرّف | الموسم | الوصف (للتوليد) |
|---|---|---|---|
| 1 | `harvest` | موسم الحصاد | a small woven saddle charm of tied wheat ears with a red cord, no text |
| 2 | `winter` | برد الشتاء | a folded thick wool camel blanket with geometric weave, warm colors, no text |
| 3 | `ramadan_prep` | استعداد رمضان | a small bundle of dates in a palm-leaf pouch tied with string, no text |
| 4 | `ramadan` | شهر رمضان | a small brass lantern (fanous) with colored glass, warm glow, hanging from a short rope, no text |
| 5 | `eid_fitr` | عيد الفطر | a festive string of small colorful tassels and tiny brass bells for a camel saddle, no text |
| 6 | `rajab` | شهر رجب الحرام | a calm indigo cloth saddle band with a simple star pattern, no text |
| 7 | `okaz` | سوق عكاظ | a merchant's small embroidered banner on a short pole, abstract pattern only, no letters, no text |
| 8 | `majanna` | سوق مَجَنّة | a carved wooden saddle ornament with incense smoke curling from a small burner, no text |
| 9 | `dhul_majaz` | سوق ذي المجاز | a leather saddle bag with brass studs and a tied water skin, no text |
| 10 | `hajj` | موسم الحجيج | a simple white cloth saddle cover with a woven rope border (travel provisions feel), no sacred places, no text |
| 11 | `adha` | عيد الأضحى | a festive red-and-gold camel neck garland with small woven flowers, no text |

**الاتساق:** الإحدى عشرة عائلة واحدة (الزاوية والإضاءة وحجم الموضوع)، وتُقرأ عند ٣٨px.

---

## المجموعة ب: لحظات الاحتفال (لـ WP-26)
ستة مشاهد قصيرة تظهر ٣ ثوانٍ عند إنجاز كبير. **٦ صور**، WebP **1280×540** (نسبة ~٢١:٩) بلا شفافية، كمشاهد `brand/img/scene/`. منطقة هادئة في الثلث الأيسر أو الأيمن (يوضع فوقها نص الواجهة). المجلد: `brand/next/celebrate/`.

| # | المعرّف | اللحظة | الوصف (للتوليد) |
|---|---|---|---|
| 1 | `first_country` | أول وصول لدولة جديدة | a caravan cresting a dune at golden hour, a distant city skyline with domes and palms appearing on the horizon, sense of discovery, no text |
| 2 | `first_ship` | أول سفينة | a wooden dhow with a large triangular sail leaving a busy harbor at sunrise, merchants waving from the pier, no text |
| 3 | `market_lead` | أول خلع زعيم سوق | a bustling covered market seen from a raised balcony, the merchant's stall now at the center with a new rich awning, crowd looking toward it, no text |
| 4 | `first_million` | أول مليون | an open treasure chest of gold coins and pearls in a merchant's counting room, warm lamp light, ledger and scales nearby, no text |
| 5 | `chapter_done` | إكمال فصل | a long caravan winding along a desert road toward a new horizon, a milestone stone pillar in the foreground, dawn light, no text |
| 6 | `retirement` | التقاعد | an elderly merchant's courtyard at dusk, a young heir receiving a ledger and a key from an old hand (hands and sleeves only), fountain and palms, no text |

**الاتساق:** الإضاءة دافئة احتفالية، والأسلوب نفسه في الستة.

---

## ما ليس في هذه الدفعة
- **WP-27 (دليل اللاعب):** صياغة نصية لا صور، وتعتمد على WP-19 (طبقات القراءة) وعلى شكل اللعبة النهائي؛ تُطلب لاحقاً بملف مستقل.
- أيقونات الفصول السبعة (WP-18): سُلّمت (`brand/next/chapters/`).

## القبول
- ١٧ صورة: ١١ في `brand/next/seasons/` و٦ في `brand/next/celebrate/`، بالأسماء والمقاسات أعلاه.
- alpha فعلية للمجموعة أ، ولا نص في أي صورة، ولا مخالفة لضوابط المحتوى.
- `MANIFEST.json` و`PROMPTS_GENERATED.md` و`docs/CODEX_TODAY.md` محدّثة.
