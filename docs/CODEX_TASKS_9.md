# مهمة كودكس (٩): رسومات مكة المكرمة والمدينة المنورة + استبدال الشماغ والعقال بالعمّة العربية

تكملة لـ `docs/CODEX_TASKS_8.md`. **اقرأ هذا الملف كله ثم نفّذ**، وسلّم كل دفعة في commit مستقل وادفع قبل التالية.

الميزة: إضافة مدينتين جديدتين إلى اللعبة، **مكة المكرمة** و**المدينة المنورة**، سوقين تجاريين وملتقيين للقوافل وموسم الحج (يبرمجها المبرمج لاحقاً). المطلوب هنا الرسومات فقط: **مشهد لكل مدينة** و**صورة زعيم السوق لكل مدينة**.

## قواعد عامة (ملزمة)

1. **لا تعدّل أي ملف موجود** إلا `brand/next/MANIFEST.md` (تضيف إليه). ممنوع تعديل: `src/*`, `build.js`, `test/*`, `index.html`, `sw.js`, `version.json`، وكل ما في `brand/img/` وما سلّمته سابقاً في `brand/next/`.
2. التسليم في `brand/next/` مع سطر لكل ملف في `brand/next/MANIFEST.md` تحت قسم «الدفعة ٩-<حرف>» وصورة معاينة `brand/next/preview-9<حرف>.png`.
3. اللعبة **للجميع** (فيها طلاب): لا نص ولا أرقام ولا حروف ولا خطوط عربية داخل الصور، لا شعارات، لباس محتشم دائماً.
4. لا تغيّر أي صورة موجودة. رمز وضع المطوّر لا يُكتب في أي ملف ولا في الرسائل.
5. قبل كل دفع: `git pull --rebase origin main`، ثم `node test/run.js` إن توفر وإلا `sh test/all.sh`. الدفع إلى `main` مباشرة بلا PR. رسائل الـcommit بالعربية، ولا تذكر اسم أي نموذج في الرسائل ولا الملفات.
6. الأسلوب المعتمد (`brand/STYLE.md` و`brand/IDENTITY.md`): شبه واقعي مرسوم بتظليل ناعم وحواف واضحة، الرمل والأخضر الداكن واللازورد والذهب العسلي والطين والحبر، قريب في النسب والإضاءة من `brand/img/city/jeddah.webp` و`brand/img/city/riyadh.webp` و`brand/img/boss/riyadh.webp`.
7. إن تعارضت وثيقة قديمة مع هذا الملف فالمرجع هو هذا الملف ثم `brand/IDENTITY.md` ثم `brand/STYLE.md`.

اقرأ قبل البدء: `CLAUDE.md`, `docs/CODEX_TASKS_4.md` (القواعد والأحجام وصيغ الأوامر), `brand/STYLE.md`, `brand/CHARACTERS.md`، وصور المدن والزعماء الحالية للسعودية (`city/riyadh|jeddah|hail|jazan` و`boss/riyadh|jeddah|hail|jazan`) للمواءمة.

## قواعد الاحترام والوقار (أهم ما في هذا الملف)

مكة والمدينة مدينتان مقدّستان. الرسم يجب أن يكون **وقوراً مهيباً**، وهذا ملزم:

- **لا تصوير للحرم المكي ولا للمسجد النبوي من الداخل**، ولا لصحن الطواف ولا للمصلّين فيهما ولا للروضة. لا أشخاص يؤدون عبادة.
- **الكعبة المشرّفة والمسجد النبوي وقبّته الخضراء يظهران بعيدين فقط** كمَعلَم في الأفق خلف المدينة (صغيران في الخلفية، غير مركزيين ولا مقرّبين، بلا تفاصيل داخلية).
- المحور الأساسي في المشاهد: **الأسواق والقوافل**: خانات وأروقة سوق قديمة، قوافل جمال محمّلة تدخل المدينة، تجار وحمّالون، بيوت حجرية حجازية قديمة بالرواشين الخشبية، جبال حجازية داكنة حول المدينة، سماء الفجر أو الغروب.
- لا رموز دينية يُخشى سوء استعمالها: لا خطوط خط عربي، لا آيات، لا أعلام، لا رسم لأنبياء أو صحابة أو آل البيت.
- النخيل والتمر وأسواق التمر مناسبة جداً للمدينة المنورة؛ الجبال الحجازية الصخرية السوداء وأروقة الأسواق وقوافل الحجيج الواصلة مناسبة لمكة.
- أي شك في ملاءمة عنصر: لا ترسمه، وسجّل السؤال في `MANIFEST.md`.

## الدفعة أ — صورة كل مدينة (٢١:٩، ١٢٨٠×٥٥٣، WebP) في `brand/next/city/<id>.webp`

| المعرّف | الوصف |
|---|---|
| `mecca` | evening view of an old Hijazi trading town in a rocky dark-mountain valley: stone houses with carved wooden rawashin balconies, a covered market lane with awnings and sacks of goods, a laden camel caravan arriving along the foreground road, merchants and porters in modest traditional dress, warm golden-hour light; **a tiny, distant, softly hazed hint of a cube-shaped sanctuary far on the horizon between the mountains, small and not the focus**; no one at prayer, no interior |
| `medina` | morning view of a green oasis town in a volcanic-rock plain: lush date-palm groves and low stone walls in the foreground with date sacks and baskets at a small date market, a camel caravan resting under palms, low whitewashed and stone houses, **a tiny, distant view of a green-domed mosque with slender minarets far behind the rooftops, small and not the focus**; modest traditional dress, soft morning light; no one at prayer, no interior |

التكوين: الأفق في الثلث الأعلى، أمامية فيها حركة تجارة، بلا نص.

## الدفعة ب — صورة زعيم كل سوق (٣٨٩×٥٢٠، WebP) في `brand/next/boss/<id>.webp`

زعيم السوق **شخصية من النوع نفسه الذي رسمناه لبقية الزعماء** (شخصية لعبة بالأسلوب والنسب والإضاءة نفسها في `brand/img/boss/*.webp`)، لكنه **شيخ عربي ذو وقار وهيبة**: ملامح هادئة ونظرة حكيمة وحضور مهيب، بلا مبالغة كاريكاتيرية. وقفة كما في `boss/riyadh.webp`، خلفية هادئة محايدة بلون الرمل. قارنه بصور زعماء السعودية الأربعة وتأكد أن مستوى التفصيل واحد وأن الشخصيتين الجديدتين تختلفان عن بعضهما وعنهم في العمر والبنية والإكسسوار.

| المعرّف | الوصف |
|---|---|
| `mecca` | a dignified, calm, elderly Hijazi market elder in his sixties with a neat grey beard and a gentle stern gaze, white thobe, a dark-brown bisht with fine gold trim, a neatly wrapped white Arab turban (imama, no shemagh, no agal cord), holding a wooden walking staff, standing upright; composed and authoritative; modest and respectful; no prayer beads in hands |
| `medina` | a wise, gentle, dignified date-merchant elder in his late fifties with a short white beard and kind but firm eyes, cream thobe, a light sand-colored bisht, a neatly wrapped cream Arab turban (imama, no shemagh, no agal cord), one hand resting on a small woven date basket on a wooden stand, standing upright; calm and respectable; no prayer beads in hands |

## تسليم الدفعتين

- ملفان للمشاهد وملفان للزعماء، بأسماء `mecca` و`medina` بالضبط (هي معرّفا المدينتين في اللعبة).
- بعد كل دفعة: سطور في `MANIFEST.md` + معاينة، ثم commit بالعربية، ثم دفع.
- **لا تدمج الصور في `brand/img/`**؛ الدمج عند المبرمج بعد مراجعة بن محمود.

## قاعدة غطاء الرأس (تسري على كل ما في هذا الملف)

**لا شماغ ولا غترة ولا عقال** على أي شخصية في اللعبة. غطاء الرأس العربي المعتمد هو **العمّة العربية** (عمامة ملفوفة بإحكام وترتيب، بلا حبل أسود). رسم الزعيمين الجديدين أعلاه بالعمّة.

**النطاق محصور:** التعديل **فقط** للشخصيات التي تلبس الشماغ أو الغترة مع العقال. **لا تغيّر** غطاء رأس أي شخصية أخرى (العمائم الهندية والفارسية والطرابيش والقبعات والقلنسوة البيضاء وعمّة عمّ سالم والعصابة والخوذة وغيرها) ولا أي شيء آخر فيها.

## الدفعة ج — استبدال الشماغ والعقال بالعمّة في الشخصيات التي تلبسهما فقط

الهدف: تعديل **غطاء الرأس فقط** مع بقاء كل شيء آخر كما هو (الوجه والبنية والوقفة والملابس والألوان والإكسسوار والخلفية والتظليل). هنا الاستثناء الوحيد من القاعدة (١) أعلاه: مسموح لك تسليم نسخ جديدة **في `brand/next/redo/`** بنفس أسماء الملفات ونفس الأحجام وبنفس نوع الخلفية (معتمة أو شفافة)، ولا تكتب فوق الأصول في `brand/img/` أبداً. الدمج عند المبرمج بعد مراجعة بن محمود.

**الشخصيات المعنيّة (ممن ظهرت بالشماغ أو الغترة والعقال):**

| النوع | الملفات |
|---|---|
| الزعماء | `boss/riyadh` (غترة بيضاء وعقال)، `boss/jeddah` (غطاء أبيض بحبل)، `boss/hail` (شماغ أحمر وعقال) |
| الأبطال | `hero/trader` (غترة وعقال)، `hero/c_trader` (شماغ أحمر وعقال)، `hero/c_negotiator` (غترة وعقال)، `hero/leader` (شماغ وعقال) |
| نسخهم المفرَّغة | الملفات نفسها في `cutouts/boss/` و`cutouts/hero/` (خلفية شفافة فعلية alpha، لا ترقيع) |
| تعابير الزعماء | `expressions/boss/{riyadh,jeddah,hail}_{neutral,accepted,reserved,thinking}` |
| الحوارات | `talk/boss_riyadh_*` و`talk/trader_*` و`talk/rival_*` (افحص منها من يلبس الشماغ أو العقال) |

**افحص بنفسك** كل ما في `brand/img/` بحثاً عن شخصية تلبس الشماغ أو الغترة أو العقال ولم تُذكر أعلاه (المشاهد `scene/caravan` و`scene/sa` و`scene/plaza_riyadh`، وصور `story/*`، وتعابير `expressions/events/*`، والأغلفة وشاشة التحميل في `brand/img/brand/`)، وأضفها إلى القائمة في `MANIFEST.md` ثم عالجها. ما يتعذّر تعديله دون إفساد المشهد سجّله سؤالاً ولا تعدّله.

**تفاصيل الاستبدال:**
- العمّة عمامة قماش ملفوفة بإحكام بطيّات مرتّبة، **ألوانها من لوحة الهوية** (أبيض عاجي، كريمي، رملي، أو لازورد غامق للبطل)، لا تزيد في الارتفاع على ثلث ارتفاع الرأس تقريباً، بلا ذيل طويل يتدلّى، بلا شرّابات، بلا حبل أسود ولا عقال.
- **اجعل كل شخصية بعمّة مختلفة قليلاً** في اللون وطريقة اللف حتى لا تتشابه، وتتمايز عن عمائم الشخصيات الهندية (`in`, `delhi`, `mumbai`) المعتمدة الملونة، فعمّة العرب أقرب للأبيض والعاجي والرملي بلف متوازن.
- **حافظ على الوجه كما هو بالضبط** (العمر والملامح والابتسامة واللحية)، وحافظ على التعابير الأربعة لكل زعيم متسقة مع بعضها.
- تأكد من حواف نظيفة في النسخ المفرَّغة بلا هالات (راجع `brand/ICON_TRANSPARENCY.md`).

**قبول:** معاينة `brand/next/preview-9ج.png` تُظهر الأصل والجديد جنباً إلى جنب لكل شخصية، وسطر لكل ملف في `MANIFEST.md`.

## الدفعة د — أصول الحوار والعرض الكاملة لمكة والمدينة (بعد مراجعة بن محمود لـ٩أ و٩ب)

لاحظ المبرمج بعد الدمج أن كل مدينة في اللعبة لها حزمة أصول أوسع من المشهد والزعيم، وأن زعيمي ٩ب سُلّما بخلفية رملية بينما بقية الزعماء بخلفية داكنة. المطلوب لكل من `mecca` و`medina`، بقواعد الوقار نفسها وبالمقاسات الحالية لبقية المدن بالضبط (راجع `brand/lazy/scene/plaza_alex.webp` و`brand/lazy/talk/boss_alex_warm.webp` و`brand/img/cutouts/boss/alex.webp` و`brand/img/expressions/boss/alex_neutral.webp`):

| الملف | المقاس | الوصف |
|---|---|---|
| `brand/next/redo/boss/<id>.webp` | ٣٨٩×٥٢٠ بلا alpha | **إعادة** صورة الزعيم نفسها (الوجه والعمّة والملابس والإكسسوار كما سلّمتها) على **خلفية فحمية داكنة #1A1A1F** بلا توهج كبقية الزعماء (`boss/riyadh.webp`) |
| `brand/next/cutouts/boss/<id>.webp` | ٣٩٠×٥٢٠ alpha | الزعيم نفسه مفرَّغاً، حواف نظيفة بلا هالات (`brand/ICON_TRANSPARENCY.md`) |
| `brand/next/talk/boss_<id>_{warm,stern,displeased}.webp` | ٣٩٠×٥٢٠ alpha | ثلاثة تعابير للحوار: ودود، صارم، مستاء (وقار دائماً، لا غضب مبالغ فيه) |
| `brand/next/expressions/boss/<id>_{neutral,accepted,reserved,thinking}.webp` | ٢٥٦×٢٥٦ alpha | أربعة تعابير نصفية (محايد، موافق، متحفظ، يفكّر) |
| `brand/next/scene/plaza_<id>.webp` | ١٦٠٠×٦٨٦ بلا alpha | ساحة سوق **بلا أشخاص** بالتكوين نفسه لـ`plaza_alex`: ركن جلوس أو رواق يسار (موضع عمّ سالم)، بسطات في الوسط (موضع التاجر)، مدخل أو قوس يمين (موضع الزعيم). مكة: أروقة سوق حجازية وقوافل مناخة وجبال بعيدة؛ المدينة: بساتين نخيل وسوق تمر. الكعبة والمسجد النبوي بعيدان صغيران جداً في الأفق إن ظهرا أصلاً، وبلا أي تصوير للحرم من الداخل |

سجّلها في `MANIFEST.md` تحت «الدفعة ٩-د» مع معاينة `brand/next/preview-9د.png`.
