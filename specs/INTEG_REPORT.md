# تقرير التكامل (040ج+040ب ثم 038أ+040هـ)

**المدموج** فوق `origin/main` (--no-ff): أ) `ccr-b6d6ce58-x5r4w4` (040ج+040ب) بلا تعارض؛ ب) `ccr-3c5dee5d-69onwl` (038أ+040هـ).

**التعارضات:** المولَّدة (index.html وsw.js وversion.json وsrc/engine.js) أُعيد توليدها بالبناء؛ سطر التصدير في 31-api.js وtest/all.sh أبقيت فيهما الطرفين؛ 19-player.js جمعت التعديلين (`mfOwnFee` ثم `scDay`، و`mfR0` قبل `rentDay`).

**إصلاح بصمة skill/skill-b (قرار بن محمود، الخيار أ):** في 30c-prosperity.js لا يُنشأ `p.fcare` إلا حين `MFUND.on` (أو كان موجوداً)، ولا يُكتب `p.fundPend=null` إلا إن وُجد. لم يُحدَّث `skill-baseline`.

**الاختبارات والميزانيتان:**
- تثبيت `RIVALGEN.cont=false, MFUND.on=false, SHOPCOND.on=false` في skill وskill-b وcaravan-chief.
- art-ui: حدّ الصفحة 4.7e6 حرف. backup-compress: حدّ المجموع 3.2 م.ب (القيمة المقاسة 3.02).
- market-fund: بعد إعادة التقاط autopilot-23 صارت البصمة تحمل `fund` فاختلّ شرط «لا صندوق عند الإطفاء»؛ يحذف الاختبار حقل `fund` من المدن بعد التحميل (كما يفعل مقطعه الأخير) دون تخفيف أي تأكيد.

**الحزمة الكاملة:**
- بعد الإصلاح: 328 ناجح، 7 فاشل (بصمات autopilot/guided وcelebrate-ui فقط).
- بعد إعادة الالتقاط مرة واحدة: 334 ناجح، 1 فاشل (market-fund للسبب أعلاه)؛ أُصلح وأُعيد تشغيله منفرداً فنجح. لم أعد الحزمة الكاملة بعده (التعديل في ملف الاختبار وحده).
- الاختبارات الثمانية المطلوبة (skill, skill-b, market-fund, rival-life, shop-cond, tasks, levy, economy-invariants) كلها ناجحة.
- التمرير الأفقي 390px: لا إخفاق في screen-length-ui وما شابهه.
