# خطة 040ج
1. `tools/rival-presence.js`: يستعمل `test/lib/skill-sim.js`؛ يطبع نسبة الأيام ذات الأثر وعدد الأحياء والخروجات والولادات؛ يعمل `--cont=off` لـ«قبل».
2. `src/engine/15b-rival-gen.js`: `RIVALGEN.cont`، حقل `str`، جدول المسار→القوة، تعديل `rivalGenDay` (الأثر المستمر، الخروج الشهري، الاستبدال 30–90 يوماً)، `rivalPresence`، ترحيل عند التحميل. يُصدَّر `rivalPresence` في `31-api.js`.
3. `src/engine/17-shocks.js`: قراءة فقط لحدث المدينة الفعّال (دون تعديل).
4. العرض: `src/ui/06l-rivals.js` وسطر في `06b-office.js` فقط.
5. اختبار `test/rival-life.test.js` ويُسجَّل في `test/map.json`.
6. ممنوع تعديل `src/engine.js` المولَّد.
