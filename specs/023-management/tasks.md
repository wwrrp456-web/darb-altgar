---
description: "مهام هيكل الإدارة (023)"
---
# Tasks: هيكل الإدارة

**قاعدة صارمة**: عرض وروابط فقط؛ تُستعمل دوال الشروط القائمة ولا تُكتب شروط جديدة؛ لا تعدّل `src/engine.js` يدوياً؛ مفتاح رجوع.

- [ ] T001 خط أساس `node build.js && node test/run.js`.
- [ ] T002 المحرك: `mgmtView(S)` يجمع الدول والمدن والرتب والممتلكات والعمال والأجور و«ما ينقصك» من الدوال القائمة.
- [ ] T003 الواجهة: شاشة «هيكل الإدارة» في المكتب، وشرح الرتب، والتنبيهات بأزرار الحل، و«ماذا أفعل؟» لكل تنبيه قائم في المكتب (US5)؛ لقطات في `docs/shots/management/`.
- [ ] T004 `test/management.test.js` و`test/management-ui.test.js` (SC-001، SC-002، المفتاح)؛ أضفهما إلى `all.sh` و`map.json`.
- [ ] T005 سطر في `docs/guide/CHANGELOG.md`، ثم `node build.js && node test/run.js` كاملاً بلا إخفاق جديد، وpush إلى `main`، واكتب `specs/023-management/report.md`، وتوقف.
