---
description: "مهام WP-25"
---
# Tasks: ابدأ حفيداً (WP-25)

**قاعدة صارمة**: لا يُستبدل حفظ اللاعب قبل تأكيد صريح؛ الإرث ضمن حدود D2 حرفياً؛ لا نص ديني؛ لا تعدّل `src/engine.js` يدوياً.

- [x] T001 تأكد أن 009 معتمدة؛ خط أساس `node build.js && node test/run.js`.
- [x] T002 المحرك (`src/engine/29-aging.js`): `GRANDCHILD` و`grandchildCard(S)` و`startGrandchild(S, perk, seed)` حسب D1–D3، وتصديرها في `src/engine/31-api.js`.
- [x] T003 `test/grandchild.test.js`: كل مزية ضمن حدودها (الذهب ≤ 200، الثقة +10 فقط، مدينتان فقط)؛ لا أصول ولا مراحل ولا نفوذ ولا خبرة تنتقل؛ الحفيد مستواه ومرحلته كلاعب جديد؛ الرسالة = نص الوصية حرفياً أو لا رسالة؛ `startGrandchild` لا يمس حالة الجد؛ حفظ قديم بلا `ancestry` يعمل؛ المفتاح مطفأ ⇒ لا خيار.
- [x] T004 الواجهة (`src/ui/14c-aging.js`، وبند ⋯ في `src/ui/15-render.js`): الخيار بعد التقاعد فقط، وشاشة التأكيد حسب D4، وعرض الرسالة وبطاقة الجد واللقب حسب D3 وD5.
- [x] T005 `test/grandchild-ui.test.js` (متصفح): الخيار لا يظهر قبل التقاعد؛ «إلغاء» لا يغيّر الحفظ (مقارنة `localStorage`)؛ «احفظ نسخة أولاً» يستدعي التصدير؛ «ابدأ» يبدأ الحفيد برسالة الجد؛ لقطات على ٣٩٠ في `docs/shots/wp25/`؛ بلا تمرير أفقي.
- [x] T006 أضف الاختبارين إلى `test/all.sh` و`test/map.json`، وسطراً في `docs/guide/CHANGELOG.md`.
- [x] T007 `node build.js && node test/run.js` كاملاً. اذكر بالاسم كل اختبار لم يعمل في بيئتك ولا تدّعِ نجاحه.
- [x] T008 ارفع إلى `main` مع `index.html` وملفات الجذر المبنية، واكتب تقريراً في `specs/010-grandchild/report.md`، وحدّث `docs/plan/STATUS.md`، وتوقف.
