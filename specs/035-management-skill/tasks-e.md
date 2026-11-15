# مهام 035هـ (وكيل الإقليم والمكافأة؛ حزمة واحدة؛ المواصفة `spec-e.md`؛ المعادلات حاكمة حرفاً؛ **حساسة: مال**)

**قبل البدء:** اقرأ `spec-e.md` §0 (خمس حقائق) و§3-هـ و§5. لا `rnd` جديد. لا تغيير في الأجور. لا دفع بلا نقرة اللاعب. `rate` و`capMonths` ثابتان؛ بقية الأرقام يضبطها Opus لا المنفّذ. هذه المهام تحلّ محل T040–T041 في `tasks.md` (عدا ناظر الديوان واقتراح التوظيف: خارج النطاق).

- [ ] T050 `src/engine/30h5-skill-region.js`: `RAG` و`BON` و`ragGrade`/`ragT`؛ التصدير في `31-api.js` وسطر في `src/README.md`؛ تثبيت `RAG.on=false` و`BON.on=false` في `skill.test.js` و`skill-b.test.js` و`scripts/capture-homest-off.js` وسكربتات الالتقاط واختبارات البصمة.
- [ ] T051 نمو الوكيل (§2-أ): `ragDay` من آخر `skillDay`؛ `skM` أسبوعياً على `cs`.
- [ ] T052 الدرجة 4 (§2-ب): `negWeeks`/`trustWarn` عبر `ragT` في `agentWeekly`؛ سطر المقارنة؛ بطاقة `rag:shift` و`A.ragShift` وأثرها في `agentAlloc` (المجموع ثابت) وانتهاؤها.
- [ ] T053 الدرجة 5 (§2-ج): `ra.mode` و`A.ragMode` وأوزان `perf` في `agentAlloc`؛ بطاقة `rag:perf`؛ اقتراح التمويل `rag:fund` بـ`Z` و`free` (يرفع الحد بـ`agentPolicy` القائم وحده).
- [x] T054 المكافأة (§3-أ/ب): `Ncity` و`Nagent` و`bonDay` كل 30 يوماً، الأهلية، `raw/cap/B/free/offer`، `P.bonus.list` والانتهاء بعد 10 أيام، وأسطر «لا مكافأة»/«أجّلتُ» في تقرير الشهر. **تحقق أولاً أن أجر المدير داخل `pr.hist.net`**؛ إن لم يكن فتوقّف واكتب السؤال لـOpus.
- [x] T055 `A.bonusGive` (§3-ج) والأثر (§3-د): `bonMul` في `skGrow` (xp وwk فقط) ونمو الأمين، و`bonGrace` في ترك المدير (`13-factories.js:135`) والوكيل (`24d:32`)؛ الخبر.
- [x] T056 الواجهة (§4): `nk='agent'` و`SKILL.next.agent`؛ بطاقة الكفاءة داخل بطاقة الوكيل؛ سطر النقل وزرّا التوزيع بالتظليل والملخص؛ بطاقات `rag:*` و`bon:*` في `officeAsks`؛ حقل المبلغ في بطاقة الشخص؛ `LN.bonus`.
- [x] T057 `test/skill-e.test.js` و`test/skill-e-ui.test.js` (§6) وتسجيلهما في `all.sh` و`map.json`.
- [x] T058 قياس التوازن بالبذور (±10٪، والمكافآت ≤ 5٪ من الصافي الموجب) في `report-e.md` (≤ 40 سطراً) مع جدول «لا صوري» (§7) والحجم؛ `node build.js` + `node test/run.js --changed`؛ «الحزمة الكاملة لم تُشغَّل».
- [x] T059 `CHANGELOG` (§8). ⛔ توقف حتى مراجعة Opus (§3 كاملاً، حساسة).
