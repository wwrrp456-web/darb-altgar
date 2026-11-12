# تقرير التكامل 2026-11-11 (035ج + 037هـ)

**دُمج (--no-ff) فوق a5b4cce:** `ccr-51798d75-y1cg61` (035ج كبير الرعاة «صاحب الفرص») ثم `ccr-8bb8d410-qf2z8v` (037هـ ربط رسم كودكس بالشاشات).
**نُقل بالملفات** من `claude/lucid-tesla-i1vu6c`: COMMITMENTS وOPUS_HANDOFF وSTATUS وspecs/README (الأخير مطابق أصلاً).

**التعارضات وحلّها (بلا تعديل شيفرة إلا للحل):**
- 035ج: CHANGELOG وall.sh وmap.json و31-api.js وskill/skill-b وcapture-homest-off و06q-home-status وindex/sw/version/engine.js.
- 31-api.js وall.sh: اتحاد الأسماء بلا تكرار. map.json: نسخة main + المفاتيح الناقصة واتحاد المصفوفات، JSON صالح.
- skill وskill-b: CHIEFX وHOMEST وDELEG وGRIEF وTASKS كلها false. capture-homest-off: سطر init واحد بالخمسة.
- 06q-home-status: نسخة main (dlHead وسطر الخصومات) + `chxHomeRow()` بعد الصفوف وقبل `tkHomeRow()`.
- 037هـ: CHANGELOG وall.sh وmap.json وindex/sw/version بالطريقة نفسها. المولَّدة: `--ours` ثم `node build.js`.
- `scripts/first-paint-keys.js` أُعيد بعد بناء الصفحة المدموجة (التشغيل قبل البناء يقيس صفحة main القديمة): أُضيف `ui/avatar-frame` فصار 20 مفتاحاً.
- لا علامات تعارض متبقية.

**تعديل اختبار واحد:** `characters`: العدد الدقيق للمفرغات 105→106 لأن 037هـ أضاف `cutouts/characters/chief-herder.webp`، وهو يخفق بالعدد نفسه على فرع 037هـ وحده. التأكيد بقي مساواة تامة، والمفرغ الجديد يجتاز فحص الشفافية في الاختبار نفسه. لم يُرفع حد ولم يُضعَّف تأكيد. لا شيء بسبب كبير الرعاة.

**البصمات (قرار 2026-11-11):** autopilot-13/18/23 كما في main مع تحديث sourceHash وحده؛ guided-4/8/10 التُقطت مرة واحدة عبر capture-guided (capture-homest-off). لم تُعد autopilot التقاط حفظاتها، ونجحت اختباراتها الأربعة.

**المنفردة (22 مطلوباً):** كلها ناجحة.
**الحزمة الكاملة:** الأول 355 ناجح و1 فاشل (characters، أخفق منفرداً أيضاً، السبب أعلاه)؛ بعد التعديل: **ناجح 356، فاشل 0، الزمن 1,508 ث** (25 د).
**القياس:** حجم الصفحة في art-ui = 3.21 م (الحد 4.7)، index.html ‏3,209,468 حرفاً (أعلى من 3.16 المتوقعة بمقدار ui/avatar-frame المدمج وشيفرة كبير الرعاة؛ 037هـ وحده 3.17).
**390px:** بلا تمرير أفقي (art-ui وبقية اختبارات الواجهة ناجحة).
