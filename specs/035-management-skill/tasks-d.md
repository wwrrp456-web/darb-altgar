# مهام 035د (التجارة والنقل؛ حزمة واحدة؛ المواصفة `spec-d.md`؛ المعادلات حاكمة حرفاً)

**قبل البدء:** اقرأ `spec-d.md` §0 (ثلاث حقائق تصحّح التدقيق) و§5. لا `rnd` جديد. لا تغيير في الأجور ولا ميزانيات الشيخ والشهبندر. الأرقام الأولية يضبطها Opus لا المنفّذ.

- [ ] T030 `src/engine/30h4-skill-travel.js`: `SKT` و`sktBonus`/`sktEff` و`sktDay`، وتصديرها في `31-api.js` وسطر في `src/README.md`؛ تثبيت `SKT.on=false` في `skill.test.js` و`skill-b.test.js` و`scripts/capture-homest-off.js` وسكربتات الالتقاط.
- [ ] T031 القادة والنوخذة (§2-أ): نمو `cp.sk.tr` و`pl0` في `arrive` (القافلة والبحر)، واستبدال مواضع القراءة الستة بـ`sktEff` (الجدول)، وخبر الترقية؛ `capWage` بلا تغيير.
- [ ] T032 الحرس (§2-ب): نمو `car.gx` (`guardServed` +1، صدّ +3)، خفض `f` في `banditFight`، و`pow` في `defenseOf`، و`cut` في `roadEstimate`، وسطر الخبر.
- [ ] T033 الطاقم (§2-ج): نمو `car.cx` يومياً في `20-finance.js`، والمعنويات والمؤن و`supplyNeed`.
- [ ] T034 شيخ القوافل والشهبندر (§3): نمو أسبوعي بـ`skM` على `ccCars`/`pmLines`، و`sktChiefT`/`sktPortmT` في المواضع الخمسة، وأسطر السبب.
- [ ] T035 الواجهة (§4): `SKILL.next` لـ`captain/cchief/portm`، الشريط الثاني وسطر المهارة الفعّالة، سطرا الحرس والطاقم في بطاقة القافلة، بطاقة «المطلوب» المعلوماتية.
- [ ] T036 `test/skill-d.test.js` و`test/skill-d-ui.test.js` (§6) وتسجيلهما في `all.sh` و`map.json`.
- [ ] T037 قياس التوازن بالبذور (±10٪) وتسجيله في `report-d.md` (≤ 40 سطراً) مع جدول «لا صوري» (§7)؛ `node build.js` + `node test/run.js --changed`؛ «الحزمة الكاملة لم تُشغَّل».
- [ ] T038 `CHANGELOG` (§8). ⛔ توقف حتى مراجعة Opus (للبند §2-ب فقط).
