# مهام 040د (حساسة: مراجعة Opus قبل التكامل)
- [ ] T1 قراءة: `30h2f-influence-fin.js` (`mud`، `mudValue`، `finAssets`، `finBase`)، `30h2m-influence-mfg.js` (`part`، `partOwed`، `partOf`، `mfgAssets`)، `15b2-rival-wealth.js` (`rgWealthMonth`، `rgKnowNow`)، `15b-rival-gen.js` (`rgScale`، `rgStr`، `rgHash`)، `15c-market-fund.js`، `24g2-deleg.js`، `06l-rivals.js`، `06q-home-status.js`، و`specs/045-penalty-guard/spec.md`.
- [ ] T2 ملف `src/engine/30h2p-rival-partner.js`: `RIVP`، `AGR_KINDS.rmud/rpart` (أيقونتان قائمتان)، الأهلية §3، الثقة §4، العرض §5، العروض الواردة §6، التوقيع والقيد والتسوية §7، الخيانة §12؛ تصدير في `31-api.js` وسطر في `src/README.md`.
- [ ] T3 الخطّافات: `rgWealthMonth` (لقطة `w0`/`w1` ثم `rvpMonth`)، `rgWDay` (العروض والانتهاء)، `rgScale` (§8-1)، `15c-market-fund.js` (§8-2)، تعميم `partOf`، `finAssets` و`mfgAssets` (§10)، وإدراج النوعين في `FIN_KINDS` كما فُعل لـ`MFG_KINDS`. **كل خطّاف بسطر أو سطرين** ومحروس بـ`RIVP.on`.
- [ ] T4 `DELEG_KINDS.rvpart` §13 من ملف الحزمة (لا تلمس `24g2-deleg.js`).
- [ ] T5 الواجهة §11: زر ورقة العرض في `06l-rivals.js`، بطاقة `ask`، تقرير العقود (`dsheet`)، سطر «حال أعمالي»، سطر التقرير الشهري، الأخبار؛ ظهور الاختيار.
- [ ] T6 `tools/rival-partner-measure.js` ومعايرة `k` §15، وتثبيت القيمة.
- [ ] T7 `test/rival-partner.test.js` و`rival-partner-ui.test.js` في `map.json` و`all.sh`؛ تثبيت `RIVP.on=false` في `skill` و`skill-b` وسكربتات الالتقاط وأي بصمة قديمة؛ إضافة `rmud`/`rpart` إلى `zakat.test.js` بالمقارنة.
- [ ] T8 `node build.js` ثم `node test/run.js --changed`؛ CHANGELOG؛ `report.md` (≤ 40 سطراً). ⛔ توقف (حساسة).
