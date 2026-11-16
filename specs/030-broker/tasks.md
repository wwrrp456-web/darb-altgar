---
description: "مهام السمسار التعليمي المولَّد (030)"
---
# Tasks: السمسار التعليمي المولَّد

**قواعد صارمة:** **قبل فحص 1.0** (COMMITMENTS §3 البند 15)؛ **حساسة**: لا دمج قبل «سليم» من مراجعة Opus. كل ثابت ومعادلة وترتيب سحب ونص من `plan.md` **حرفاً**؛ لا تعدّل `src/engine.js` يدوياً؛ **لا نص شرعي غير `BR_SH`** (أربعة نصوص من `docs/review/APPROVED_BROKER_2026-11-16.md` حرفاً بحرف) ولا تعليق شرعي من عندك؛ لا حظ عند القبول؛ لا `Math.random` ولا `rnd/rndB/roll/rgRng` في السمسار؛ عمّ سالم لا يحكم قبل القرار ولا `best` في البطاقة؛ **لا `<select>` ولا `<details>` ولا طيّ**؛ لا أيقونة جديدة. `BROKER.on = false` = السلوك الحالي حرفاً بلا حقول جديدة. على الفرع: `node build.js` ثم `node test/run.js --changed` فقط.

- [ ] T001 خط أساس: `node build.js && node test/run.js --changed`؛ والتقط بصمة `BROKER`-قبل (360 يوماً، 3 بذور: `S.learn` و`L.eq` والذهب يومياً) لاختبار SC-005.
- [ ] T002 `15b-rival-gen.js` (plan §11-أ): `rgStream` ومعامل `cnt` في `rgPick` بلا أثر؛ اختبار مطابقة `rgRng` وولادات المنافسين قبل/بعد.
- [ ] T003 `src/engine/15d-broker.js`: `BROKER` و`brBand/brLerp/brRate/brR2` (§2)، والبيانات و`BR_TITLE` و`BR_SH` و`BR_HADITH` (§3) حرفاً؛ سطر في `src/README.md`.
- [ ] T004 المولّد والحقيقة (§4): الذاكرة `brokerMemory*`، `brState/brRng/brCount/brPick/brSig`، `brokerGen` بترتيب السحب حرفاً، والسجل عند الإنشاء، والمشتقات (`cost/feeAmt/total/inspAmt/pct/tooGood`).
- [ ] T005 الدورة (§5): `brData`، `brokerDay` في `11-day.js` بعد `rivalGenDay`؛ `brokerGen: 'office'` في `01a-interrupts.js` وسطره في `docs/INTERRUPTS.md`؛ شرط `!BROKER.on` في `22-learn.js:179` (§11-ب).
- [ ] T006 الأفعال (§6): `brokerInspect/Ask/Warranty/Accept/Decline/Return/Keep` بالشروط والرسائل حرفاً؛ تصديرها في `31-api.js` مع `BROKER`, `BR_SH`, `brokerDay`, `brokerGen`, `brokerView`, `brokerMemory*`.
- [ ] T007 النتائج (§7): `brResolve/brFinal/brLog` و`learnReact` بعد `BROKER.reveal` فقط؛ مفاتيح `brk*` الخمسة في `src/lessons.js` ومعاملاتها `{p}` (§8-ب) حرفاً.
- [ ] T008 `brokerView(S)` للواجهة (العرض بمشتقاته وما فُحص، والمهلة، وصفوف السجل والمجاميع بالريال) — لا منطق في الواجهة.
- [ ] T009 الواجهة `src/ui/06u-broker.js` (§9): الذاكرة و`brokerMemSave` في `03-time-routing.js`، `brkAskCards` و`ASK_SRC.brk`، المجال `brk` و`brkLedgerHTML`، سطر `officeCards`، `brkChip` في `06m-page-tabs.js`، `brkHsRow` في `06q-home-status.js`، قاعدة CSS للسطر المتعدد؛ 390 بلا تمرير أفقي.
- [ ] T010 اختبارات المفتاح القديم (§11-ج): `E.BROKER.on = false` في `babylon`, `first-try`, `characters`, `skill`, `skill-b` وكل اختبار بصمة، وسكربتات الالتقاط.
- [ ] T011 `test/broker.test.js`: SC-001 (1٬000 عرض × 3 بذور بذاكرة ممرَّرة)، SC-002 (5٬000 عرض: قرينة «عاين» لكل غاشّ، نسب الصدق بالسمعة، ضجيج ≥ 20٪)، FR-002 (القبول لا يغيّر `S.brokerGen` ولا `rnd`، وإعادة التشغيل بالبذرة نفسها تعطي العروض نفسها)، الحدود (الحجم والفاصل والمستوى والسيولة والعرض الواحد)، الأفعال والمهلة والردّ والصافي `r` بالمعادلة، `law5` و`evDone.broker`، SC-004 (`BR_SH` حرفاً في ملف الاعتماد؛ لا `ﷺ`/«محرّم»/«حرام»/«حلال» خارج `BR_SH` و`BR_HADITH`؛ لا `learnReact` قبل الحلّ؛ لا `best`)، SC-005 (المطفأ = البصمة القديمة حرفاً بلا حقول). و`test/broker-ui.test.js`: البطاقة في المكتب والموجز، ظهور الاختيار بعد كل فعل (`on` + `aria-pressed` + السطر بالرقم)، نافذة «السماسرة» وصفوفها، الشارة وسطر «حال أعمالي»، لا `select/details`، 390 بلا تمرير، ولقطات `docs/shots/broker/` (SC-006). أضفهما في `test/all.sh` و`test/map.json` (لـ`15d-broker.js` و`06u-broker.js` و`15b-rival-gen.js` و`src/lessons.js`).
- [ ] T012 `tools/broker-measure.js` و`specs/030-broker/measure.md` (§10): الرافض/الحذر/المتهور، 12 بذرة × 3 سنوات؛ إن خالف FR-005 فاضبط `share` ثم `cap` وحدهما كما في §10.
- [ ] T013 ⛔ توقف: `report.md` (≤ 40 سطراً: ما نُفِّذ، الانحرافات، أرقام القياس، جدول «لا صوري» من spec بمواضعه، و`BR_TITLE` لمراجعة بن محمود)، وسطر `- [لاعب] 2026-11-..: …` في `docs/guide/CHANGELOG.md`؛ `node build.js && node test/run.js --changed`، واكتب «الحزمة الكاملة لم تُشغَّل»؛ ادفع إلى فرعك وتوقف لمراجعة Opus (البرومت ٦).
