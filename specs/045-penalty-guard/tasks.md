# مهام 045 حارس الشرط الجزائي (حزمة واحدة، جلسة واحدة)

- [ ] **T1 اقرأ:**
  - كل خصم شرطي: `grep -n "pactPenalty" src/engine/*.js` (عدا `engine.js`)، و`30h2-influence.js` و`30h2m-influence-mfg.js` و`30h2r-influence-road.js`.
  - العقود القديمة: `04-bosses.js` (`PACTS`)، و`05-haggle.js` (السطران 77 و95)، و`24-advisor-actions.js` (`breakPact`)، ونصوص واجهتها.
- [ ] **T2** `src/engine/30h2z-penalty.js`:
  - `PEN = { old:false }`، و`PEN_PARTS` (المكوّنات الأربعة بسطر سبب لكل منها)، و`actualDamage`، و`payPenalty`.
  - التسجيل في `src/README.md` و`31-api.js`.
- [ ] **T3** نقل كل خصم وتعويض شرطي في 036 إلى `payPenalty`/`actualDamage` بالأرقام نفسها حرفاً.
- [ ] **T4 العقود القديمة:** لا خصم حين `PEN.old=false`، والعواقب غير المالية كما هي، والنصوص صادقة. و`PEN.old=true` يعيد الخصم الثابت حرفاً.
- [ ] **T5** `test/penalty-guard.test.js`، ويُسجَّل في `map.json` و`all.sh`. ثم تحديث اختبارات العقود القديمة بتعليل يشير إلى GN-01.
- [ ] **T6** التثبيت في `skill` و`skill-b` و`capture-homest-off`، و`CHANGELOG`، والتقرير بجدول «كل موضع: قبل ← بعد».
- [ ] ⛔ **توقف:** اكتب `report.md` (≤ 40 سطراً).
