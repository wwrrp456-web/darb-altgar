# Implementation Plan: تجربة البداية (032)

## القرارات
- **D1 — الملفات:** `src/engine/22b-firstx.js` (`FIRSTX`، البوابة، أول خسارة، تنبيه عمّ سالم، ملخص الرحلة، اللحظة وتنظيف البطاقات)، `src/ui/00c-firstx.js` (شريط التحميل وحارس الصور)، وتعديلات صغيرة في `09-travel` و`09b-sea` و`20-finance` (البوابة) و`02-learn` و`04-header` و`13-guide-mission` و`16-events` (الواجهة).
- **D2 — المفاتيح:** `FIRSTX = {road, stage:5, firstLoss:0.10, summary, moment, follow, sellAll, hint, name, load, skip}`؛ كل دالة تبدأ بـ`ftxOn(S,k)` (تتطلب شخصية مختارة) فتكون النتيجة القديمة حرفياً عند الإطفاء.
- **D3 — البوابة:** `ftxRoadOpen(S) = !ftxOn(S,'road') || stageOf(L) ≥ FIRSTX.stage` حيث `stageOf = L.ageStages ? L.stage : L.level`. تُوضع **بعد** سحب `rnd` حيثما أمكن (لا يتغير مجرى العشوائية).
- **D4 — أول خسارة:** `ftxFirstLoss(S, car, f)`: إن كانت أول خسارة طريق للاعب (`L.fx.loss` غير مضبوط) تُثبَّت النسبة على `FIRSTX.firstLoss` ويُضبط العلم.
- **D5 — تنبيه عمّ سالم:** `ftxRoadWarn(S, car, dest)` يعتمد `roadEstimate(...).level === 2` والبوابة مفتوحة؛ تعرضه الواجهة في سطر «خطر الطريق».
- **D6 — الملخص:** عند الانطلاق `car.plan = {day, from, to, exp, led0}`؛ عند الوصول `S.tripSum` بالأجزاء من فروق دفتر المصروفات (`provisions, wages, wear, customs, bandits, storm`)؛ ويُحسب الفعلي من سجل الصفقات بعد الوصول. بطاقة الوصول تعرضه.
- **D7 — اللحظة:** في `learnArrive` يُضبط `L.moment = {c, day}`؛ و`learnNext` يعرض بطاقة كبير السوق لذلك الوصول قبل بوابة المنظِّم؛ و`fxDay` يحذف التحية (n=1) المتقادمة ويضع `stale` للبقية.
- **D8 — بِع بضاعتي:** الحدث `arrsell` يستدعي `sellAll()` القائم ثم يفتح السوق.
- **D9 — المهمة:** في `missionStep`: إن كانت القافلة قد غادرت `M.from` فـ`M.dest = m.city` (تتبع الوجهة الفعلية).
- **D10 — التلميح:** `hintFor(q, k)` من أول جملة في `q.why` (نص قائم، لا جديد).
- **D11 — التحميل:** شريط ثابت في `template.html` يُزال بعد الإقلاع؛ `00c-firstx.js` يعيد محاولة `img` فاشلة مرة واحدة ويسجّل `window.__imgFail`.
- **D12 — التخطّي:** زر `lskip` في مقاطع الترحيب السردية: ينقل `seq.i` إلى أول اختيار ويحفظ المتخطَّى في `L.hist`.

## Constitution Check
الشرع ✅ (لا نص شرعي جديد) · الحفظ ✅ (اختياري + مفاتيح) · الاختبار ✅ · لعب لا محاضرة ✅ · البساطة ✅.
