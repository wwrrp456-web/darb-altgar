# مهمة كودكس (٩): رسومات مكة المكرمة والمدينة المنورة

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
| `mecca` | a dignified, calm, elderly Hijazi market elder in his sixties with a neat grey beard and a gentle stern gaze, white thobe, a dark-brown bisht with fine gold trim, a white-and-red patterned headcloth with a black cord, holding a wooden walking staff, standing upright; composed and authoritative; modest and respectful; no prayer beads in hands |
| `medina` | a wise, gentle, dignified date-merchant elder in his late fifties with a short white beard and kind but firm eyes, cream thobe, a light sand-colored bisht, a plain white headcloth with a black cord, one hand resting on a small woven date basket on a wooden stand, standing upright; calm and respectable; no prayer beads in hands |

## تسليم الدفعتين

- ملفان للمشاهد وملفان للزعماء، بأسماء `mecca` و`medina` بالضبط (هي معرّفا المدينتين في اللعبة).
- بعد كل دفعة: سطور في `MANIFEST.md` + معاينة، ثم commit بالعربية، ثم دفع.
- **لا تدمج الصور في `brand/img/`**؛ الدمج عند المبرمج بعد مراجعة بن محمود.
