---
description: "مهام لوحتي الترتيب (020)"
---
# Tasks: لوحتا ترتيب الدول والأسواق

**قاعدة صارمة**: عرض فقط بلا أثر اقتصادي؛ التزم بـ`docs/goals/WORLD.md` §2؛ لا تعدّل `src/engine.js` يدوياً؛ مفتاح رجوع؛ الحفظ القديم يعمل.

- [ ] T001 خط أساس `node build.js && node test/run.js`.
- [ ] T002 المحرك: دالتا `countryBoard(S)` و`marketBoard(S)` من بيانات 016، ولقطة الاتجاه كل 30 يوماً، والمفتاح.
- [ ] T003 الواجهة: التبويبان والبطاقات حسب §2، وفتح بطاقة المدينة بالضغط؛ لقطات في `docs/shots/boards/`.
- [ ] T004 `test/boards.test.js` (SC-001، المفتاح، حفظ قديم) و`test/boards-ui.test.js` (390 و1100 بلا تمرير أفقي)؛ أضفهما إلى `all.sh` و`map.json`.
- [ ] T005 سطر في `docs/guide/CHANGELOG.md`، ثم `node build.js && node test/run.js` كاملاً بلا إخفاق جديد، وpush إلى `main`، واكتب `specs/020-boards/report.md`، وتوقف.
