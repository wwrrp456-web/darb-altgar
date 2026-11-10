# خطة 040أ
1. `tools/econ-baseline.js`: يعتمد `test/lib/skill-sim.js` (دالتا `load` و`run` كما في الأمثلة القائمة) وأسماء الـfixtures `autopilot-18` و`autopilot-23`؛ للحجمين الآخرين يُضبط `P.gold` و`P.wallet.sar` مباشرة. يطبع جدولاً نصياً.
2. `src/engine/20-finance.js` سطر 97: استبدال الرقم الحرفي بـ`LEVY`؛ يُعرَّف الثابت في الجزء نفسه أو في `src/engine/20-finance.js` أعلى الملف، ويُصدَّر في `31-api.js` ضمن القائمة.
3. أسماء العرض: `src/ui/14b-life.js` (AWAY_EXP) و`src/ui/12-screen-cities.js` (LN) فقط.
4. اختبار: `test/levy.test.js` (ويُسجَّل في `test/map.json` للأجزاء `20-finance` و`14b-life`).
5. ممنوع تعديل `src/engine.js` المولَّد.
