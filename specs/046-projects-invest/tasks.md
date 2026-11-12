# مهام 046
- [ ] T1 قراءة: `30b-projects.js` (الجدول، projectMul/Add، projectDay، projectFund)، `17-shocks.js` (c.sh/c.ev)، `12-agents.js` (وصول الوكلاء)، `09-travel.js` (`arrive`)، `02a-payments.js` (`payObligation`، `paymentTarget`، قائمة الأنواع)، `24g2-deleg.js` (بنية `shopfix`)، `06f-projects.js`، `06q-home-status.js`، `30i2-shopcond.js` (نمط الحالة)، `tools/review-inventory.js` (كيف يُقرأ `rv`).
- [ ] T2 ملف جديد `src/engine/30b2-projects-invest.js`: `PJINV` و`PJ_INV` و`ops` والحركة (`pjTraffic` + خطّافا العدّ) والدخل والتشغيل والحالة والأحداث والترميم والتقرير؛ تصدير في `31-api.js`؛ `src/README.md`.
- [ ] T3 ربط `projectMul/Add` بقوة `cond`، و«ما وُفّر» في مواضع الأثر (`09-travel.js` الخطر، `17-shocks.js` الشدة، `07-farm.js` الخبرة، `05-haggle.js`/`30h2-influence.js` الثقة، `13-factories.js` الجودة) بسطر واحد لكل موضع.
- [ ] T4 النوع `project` في `02a-payments.js` (الهدف والتحقق)؛ `LN` و`AWAY_EXP` للمفتاحين الجديدين؛ `pjfix` بـ`Object.assign(DELEG_KINDS, …)` من ملف الحزمة.
- [ ] T5 الواجهة: التقدير قبل الدفع، صف «تقرير المشروع» (`dsheet`)، سطر «حال أعمالي»، تنبيهات `ask` الثلاثة، الخبر الشهري؛ ظهور الاختيار.
- [ ] T6 البوابة: `rvInc` لكل مشروع تشغيلي (`PJ-05..PJ-10`) + `PJ-11/12`، توسيع `review-inventory.js`، إدراجها مخفية في `review-flags.js`، واختبار أن المخفي لا يدفع ولا يأخذ.
- [ ] T7 `tools/projects-roi.js` والمعايرة وتثبيت `PJ_INV`؛ `projects-invest.test.js` و`projects-invest-ui.test.js` في `map.json` و`all.sh`؛ تثبيت `PJINV.on=false` في `skill`/`skill-b`/سكربتات الالتقاط.
- [ ] T8 `node build.js` ثم `node test/run.js --changed`؛ CHANGELOG؛ التقرير `report.md` (≤ 40 سطراً) بجدول «لا صوري» وأرقام المعايرة وحجم الصفحة. ⛔ توقف (حساسة: مراجعة Opus).
