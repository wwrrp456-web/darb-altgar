---
description: "مهام الأمين المدبّر (017)"
---
# Tasks: الأمين المدبّر

**قاعدة صارمة**: المفاتيح الثلاثة مطفأة افتراضياً؛ لا مال من العدم (آليات البيع والنقل القائمة فقط)؛ لا تعدّل `src/engine.js` يدوياً؛ لا نص ديني؛ الحفظ القديم يعمل.

- [ ] T001 خط أساس `node build.js && node test/run.js`.
- [ ] T002 المحرك: أضف `rotate` و`sellStale` و`herd` إلى `STEWARD_FLAGS` و`policy` (مع `minPrice` لكل سياسة بيع)، ونفّذها في يوم الأمين حسب spec.md، وسجّلها في `stewardLog` و`stewardStats`، ومفتاح `STEWARD_SMART.on`.
- [ ] T003 الواجهة: ثلاثة مفاتيح وحقل الحد الأدنى في بطاقة الأمين، وسطر «ما فعله الأمين هذا الأسبوع»؛ لقطات 390 في `docs/shots/steward-smart/`.
- [ ] T004 `test/steward-smart.test.js` (SC-001..SC-003، حفظ قديم، المفتاح العام) وأضفه إلى `all.sh` و`map.json`؛ وتأكد أن `steward` و`steward-ui` و`farm-manage` و`storage-flow` ناجحة.
- [ ] T005 سطر في `docs/guide/CHANGELOG.md`، ثم `node build.js && node test/run.js` كاملاً بلا إخفاق جديد، وpush إلى `main`، واكتب `specs/017-smart-steward/report.md`، وتوقف.
