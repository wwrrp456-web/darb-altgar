---
description: "مهام WP-17ب-2"
---

# Tasks: نقل الألواح والأسرار وحكايات الزعماء إلى المُجدوِل (WP-17ب-2)

**Input**: `specs/001-sched-side-content/` (spec.md, plan.md)
**Tests**: مطلوبة (الدستور، المبدأ الثالث).
**المنفّذ**: Sonnet، حزمة واحدة ثم توقف. **المراجعة**: Opus (حزمة خطرة) ثم موافقة بن محمود المنفردة.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup

- [ ] T001 تأكد أن WP-17ب-1 معتمدة من بن محمود (`9c81fb7`)؛ وإلا توقف.
- [ ] T002 خط أساس: `node build.js && node test/run.js` واحفظ النتيجة، و`node tools/sched-compare.js` الحالي (عمود «قبل»).

## Phase 2: Foundational

- [ ] T003 في `src/engine/29b-sched.js`: أضف `tablets: true, secrets: true, lore: true` إلى `SCHED`، و`schedHold(S, k, id, n)` تدفع `{k, id, n, d: S.day}` إلى `L.mwait`.
- [ ] T004 في `src/engine/29b-sched.js`: `schedRelease(S)`: يفرّغ معلّقي النوع المطفأ فوراً؛ ثم إن سمح `schedMayFire(S, أقدم.d)` يفرّغ واحداً بالأولوية tablet ← secret ← csecret ← boss إلى طابوره (`tq`/`sq`/`csq`/`bq`) مع سطر الخبر، ويختم `L.lastMom`.
- [ ] T005 عدّل `schedMom` ليطرح طول `L.mwait` (D3)، و`loreFix` لينشئ `L.mwait = L.mwait || []`.

**Checkpoint**: لا تغيير في السلوك بعد (لا أحد يستدعي `schedHold`).

## Phase 3: User Story 1 + 2 - لحظات متباعدة والمكافأة في يومها (P1) 🎯

### Tests

- [ ] T006 [US1] `test/sched-side.test.js`: لوح وسرّ مستحقان مع مرحلة في يوم واحد ⇒ المرحلة فوراً، ثم كل واحد بعد يومين؛ سقف ٥ أيام تحت تزاحم يومي؛ معلّق لا يضيع إن زال شرطه؛ الذهب مضاف يوم الاستحقاق.
- [ ] T007 [US1] أضفه إلى `test/all.sh` و`test/map.json` (أجزاء `22-learn` و`29b-sched` و`29-cards`).

### Implementation

- [ ] T008 [US1] `src/engine/22-learn.js` `tabletCheck`: عند `SCHED.tablets` استبدل `L.tq.push(id)` بـ `schedHold(S,'tablet',id)`؛ يبقى `L.tab.push` والذهب.
- [ ] T009 [US1] `learnCountry`: عند `SCHED.secrets` استبدل `L.sq.push(cc)` والخبر بـ `schedHold(S,'secret',cc)`؛ يبقى `learnPerks`.
- [ ] T010 [US1] `loreCheck` (أسرار المدن): عند `SCHED.secrets` استبدل `L.csq.push` والخبر بـ `schedHold(S,'csecret',id)`.
- [ ] T011 [US1] `loreCheck` (الحكايات): عند `SCHED.lore` استبدل `L.bq.push({c,n})` وخبر `n===3` بـ `schedHold(S,'boss',id,n)`.
- [ ] T012 [US1] استدعِ `schedRelease(S)` في أول `cardDay` (`src/engine/29-cards.js`) وفي لفّاف الأفعال (`src/engine/27-save.js`)، وصدّرها في `31-api.js`.
- [ ] T013 [US1] أضف `mwait` إلى قوائم التفريغ في `src/engine/29-aging.js:152` و`src/ui/17-dev-autopilot.js:139`.

**Checkpoint**: `node test/sched-side.test.js` و`sched-cards` و`lore*` و`tablet-ui` ناجحة.

## Phase 4: User Story 3 - مفتاح رجوع لكل نوع (P2)

- [ ] T014 [US3] في `test/sched-side.test.js`: كل مفتاح مطفأ ⇒ الطابور يمتلئ فوراً كالقديم، ولا حقل `mwait` جديد في الحالة؛ إطفاء المفتاح مع معلّق ثم `save`/`load` ⇒ المعلّق في طابوره.
- [ ] T015 [US3] وسّع `tools/sched-compare.js` ليقارن «قبل» (المفاتيح الأربعة مطفأة) بـ«بعد»، مع صفوف لكل نوع (أُطلق/عُرض/تأخير متوسط وأقصى).

## Phase 5: Polish

- [ ] T016 حدّث `docs/sched/BEFORE_AFTER.md` بجدول الأنواع الأربعة، وتحقق من SC-001..SC-004.
- [ ] T017 سطر في `docs/guide/CHANGELOG.md`: `- [لاعب] 2026-..: الألواح والأسرار والحكايات تأتي متباعدة بيومين بدل أن تتراكم في يوم واحد`.
- [ ] T018 `node build.js && node test/run.js` كاملاً بلا إخفاق، ثم commit وpush إلى `main` بقاعدة `docs/plan/README.md`.
- [ ] T019 حدّث `docs/plan/STATUS.md` و`tasks.md` في الجذر (الحالة الحالية)، وتوقف واعرض الجدول على بن محمود.

## Dependencies & Execution Order

- T001 ← T002 ← Phase 2 ← Phase 3 ← Phase 4 ← Phase 5.
- T008–T011 [P] بعد T003–T005 (أجزاء مختلفة من الملف نفسه، فنفّذها متتالية).
- لا تبدأ حزمة 002 قبل اعتماد هذه.
