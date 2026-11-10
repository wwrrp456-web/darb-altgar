# خطة 040أ
1. `tools/econ-baseline.js`: يعتمد `test/lib/skill-sim.js` (`load` و`run`)؛ يطبع جدولاً نصياً.
2. `src/engine/20-finance.js` سطر 97: الشرط يصير `LEVY.on && S.phase >= 3 && nw > 40000`؛ يُعرَّف `LEVY = { on: false }` أعلى الملف أو في ملف الحزمة، ويُصدَّر في `31-api.js` ضمن القائمة.
3. الأسماء: `src/ui/14b-life.js` و`src/ui/12-screen-cities.js`: إخفاء الصف عند صفر فقط.
4. اختبار: `test/levy.test.js` ويُسجَّل في `test/map.json` للجزءين `20-finance` و`14b-life`.
5. ممنوع تعديل `src/engine.js` المولَّد.
