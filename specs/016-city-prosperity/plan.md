# Implementation Plan: ازدهار المدن (016)

**Date**: 2026-11-03 | **Spec**: `specs/016-city-prosperity/spec.md` | **التصميم**: `docs/goals/WORLD.md` القسم 1 و4 و7 (بلا قرارات جديدة)

## الملفات والدوال
- `src/engine/30c-prosperity.js`: `PROSPER.on` (مفتاح الرجوع)، `PR`/`PR_FX` (الأرقام حرفياً)، `prosEnsure` (إنشاء الحقل بقيمه الأولية)، `prosMonth` (التحديث الشهري)، `prosperityDay` (نشاط/زيارة يومياً وتحديث كل 30 يوماً)، `prosMul/prosAdd` (الآثار)، `prosperityView` (للواجهة).
- الحقل الاختياري: `c.pros = { trade, urban, sci, lit, health, sec, b, care, popMul, pInf, last, m, pend }` في المدينة؛ يُنشأ عند أول تحديث شهري.
- ربط 015: `projectContrib(S)` (مساهمات دائمة) تدخل الهدف `b + min(40, care + دائم)` فلا تذبل؛ وخبر إتمام المشروع يذكر ما يرفعه من الأبعاد.
- الخطّافات: `projectMul/projectAdd` تضرب أثر الازدهار (shop، xp، ev، trustgrow، risk، qual)، و`shopCost` (العمران)، وإتمام عقد في `05-haggle` يغذي «الأدب»، و`prosperityDay` في `11-day`.
- الواجهة: `src/ui/06g-prosperity.js` بطاقة داخل كل مدينة في «الدول والمدن».
- الاختبارات والقياس: `test/prosperity.test.js` و`prosperity-ui.test.js` و`tools/prosperity-measure.js`.

## Constitution Check
أولاً الشرع ✅ لا نص ديني · ثانياً الحفظ ✅ حقل اختياري ومفتاح رجوع وحفظ قديم · ثالثاً الاختبار ✅ · رابعاً ✅ لا مقاطعة · خامساً ✅ ملف محرك واحد.
