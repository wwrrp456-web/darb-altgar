# تقرير التكامل: 040ز + 042 ✅ مدفوع إلى main

**دُمج** (--no-ff فوق main `a4aefbf`): `ccr-00333b25-knm02e` (040ز إنفاق الصندوق) ثم `package-042-home-status` (042 حال أعمالي).
**التعارضات:** ملفات مبنية (index.html وsw.js وversion.json وsrc/engine.js) أُعيد توليدها بـ`node build.js`؛ سطر `API` في `31-api.js` وtest/map.json وtest/all.sh وCHANGELOG أُبقي الطرفان؛ skill/skill-b جُمعت الحراستان (`MFUND.spend=false` و`HOMEST.on=false`) مع تأكيد 042.
**إصلاح fundSpendHTML:** `src/ui/06q-home-status.js:18` كان يستدعي `fundSpendHTML(f.city)` بلا `v` فيقع TypeError؛ صار `fundSpendHTML(f.city, E.fundView(S, f.city))`. نافذة سطر الصندوق تعرض الآن «أنفق الآن (أنت الحاكم)» حين يكون اللاعب الحاكم (مُختبَر على 390px بلا أخطاء JS).
**قرار الالتقاط (بإذن بن محمود):**
- `autopilot-13/18/23` بقيت كما في main `a4aefbf`، وعُدّل حقل `sourceHash` وحده إلى بصمة المصدر الحالية (703ae7a0…، السطر الوحيد المتغيّر).
- `guided-4/8/10` أُعيد التقاطها بـ`scripts/capture-homest-off.js` (يثبّت `HOMEST.on=false` أثناء الالتقاط فقط) فلا تحمل `player.hs`.
**التشخيص:** التقاط autopilot غير قابل للتكرار حتى على main نفسه: إعادة التقاط main (بلا دمج) تعطي حفظاً مختلفاً عن المثبّت (بذرة الحفظ 846084566 ثم 537027026) فتفشل levy وliquidity وpage-order-ui؛ والحفظات المُعاد التقاطها متطابقة على main وintegوفرعي 042 و040ز، فلا 040ز ولا 042 ولا `MFUND.spend` يغيّر المسار.
**الحزمة الكاملة:** 339 ناجحاً، 0 فاشل (1323 ث).
**القياس:** art-ui: صفحة اللعبة 4.57 م حرف (حدّها 4.7)؛ backup-compress: 4.35 → 3.03 م.ب (حدّه 3.2). كلاهما تحت الحد؛ لم يُرفع أي حد.
**ملاحظات:** لم تُعدَّل اختبارات؛ لم تُدفع docs/shots؛ لا force-push ولا amend.
**آخر commit على origin/main:** يُكتب أدناه بعد الدفع.
