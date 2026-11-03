---
description: "مهام ازدهار المدن (016)"
---
# Tasks: ازدهار المدن (016)

**قاعدة صارمة**: التزم بـ`docs/goals/WORLD.md` (الأقسام 0 و1 و4 و7)؛ لا تعدّل `src/engine.js` يدوياً؛ لا نص ديني؛ مفتاح رجوع؛ الحفظ القديم يعمل.

- [ ] T001 خط أساس `node build.js && node test/run.js`.
- [ ] T002 اكتب `specs/016-city-prosperity/plan.md` مختصراً (الملفات والدوال والحقل والمفتاح) من `WORLD.md`، بلا قرارات جديدة.
- [ ] T003 المحرك: الأبعاد وقيمها الأولية والمساهمة والذبول والآثار وسقوفها، وربط مشاريع 015 بها (القسم 4).
- [ ] T004 الواجهة: بطاقة المدينة (السكان والأبعاد الستة ونصيب اللاعب)، ولقطات ٣٩٠ في `docs/shots/prosperity/`.
- [ ] T005 `test/prosperity.test.js` (SC-001، المفتاح، حفظ قديم) و`tools/prosperity-measure.js` (SC-002) وتقرير `specs/016-city-prosperity/report.md`. أضف الاختبار إلى `all.sh` و`map.json`.
- [ ] T006 سطر في `docs/guide/CHANGELOG.md`، ثم `node build.js && node test/run.js` كاملاً بلا إخفاق جديد، وpush إلى `main`، وحدّث `docs/plan/STATUS.md`، وتوقف.
