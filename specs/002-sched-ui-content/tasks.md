---
description: "مهام WP-17ب-3"
---

# Tasks: المسائل الفقهية والحِكم وتعليقات عمّ سالم في المُجدوِل (WP-17ب-3)

**Input**: `specs/002-sched-ui-content/` (spec.md, plan.md)
**Tests**: مطلوبة (الدستور، المبدأ الثالث).
**المنفّذ**: انظر `specs/README.md`، حزمة واحدة ثم توقف. **المراجعة**: Opus ثم موافقة بن محمود المنفردة.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup

- [ ] T001 تأكد أن 001 معتمدة (`b24f076`، `docs/plan/STATUS.md`)؛ وإلا توقف.
- [ ] T002 خط أساس: `node build.js && node test/run.js` واحفظ النتيجة، و`node tools/sched-compare.js` (عمود «قبل»).

## Phase 2: Foundational

- [ ] T003 `src/engine/29b-sched.js`: أضف `cases: true, tips: true, react: true` إلى `SCHED`.
- [ ] T004 `src/engine/29b-sched.js`: `schedReactOk(S, k, r)` تعيد false (وتزيد `L.schedDrop.react`) فقط إذا: `SCHED.react` و`L.lastMom === S.day` و`(L.stageDone||[]).length >= 2` و`r` ليس `alert` ولا `adv` ولا `always`. و`schedTipOk(S, carId)` بالقاعدة نفسها لـ`SCHED.tips`، تعدّ `L.schedDrop.tips` مرة لكل رحلة (احفظ آخر رحلة مُسقطة في `L.schedDrop.tipCar`).
- [ ] T005 صدّرهما في `src/engine/31-api.js`.

**Checkpoint**: لا تغيير في السلوك بعد.

## Phase 3: User Story 1 - المسألة لا تزاحم (P1) 🎯

### Tests
- [ ] T006 [US1] `test/sched-ui.test.js` (Node، المحرك): مسألة يتحقق شرطها في يوم لوح ⇒ لا `L.mj.ready` ولا خبر؛ تُعلَن بعد يومين؛ تحت تزاحم يومي تُعلَن عند السقف (٥ أيام)؛ `mjWant` بين الاستحقاق والإعلان ⇒ تُعلَن المسألة المطلوبة؛ `mjNow` يعمل دائماً بطلب اللاعب.
- [ ] T007 [US1] أضفه إلى `test/all.sh` و`test/map.json` (أجزاء `22-learn` و`29b-sched` و`02-learn` و`04-header`).

### Implementation
- [ ] T008 [US1] `src/engine/22-learn.js` (كتلة «مجلس السوق» ~178): عند `SCHED.cases` اختم `L.mj.due` أول تحقق للشرط، وأعلن (السطور الحالية كما هي) فقط إن `schedMayFire(S, L.mj.due)`، ثم `L.lastMom = S.day` و`delete L.mj.due`. المفتاح مطفأ ⇒ السلوك القديم حرفياً، و`due` يُمسح.

**Checkpoint**: `sched-ui` و`mjlis` و`mjlis-ui` و`lesson-points` ناجحة.

## Phase 4: User Story 2 - الحِكم والتعليقات لا تقاطع (P2)

### Tests
- [ ] T009 [US2] في `test/sched-ui.test.js`: `schedReactOk` تُسقط تعليقاً عادياً في يوم لحظة وتعدّه؛ لا تُسقط `alert`/`adv`/`always`؛ لا تُسقط قبل إتمام مرحلتين؛ `schedTipOk` تعدّ مرة لكل رحلة. والمفاتيح الثلاثة مطفأة ⇒ لا إسقاط ولا حقل `schedDrop`.

### Implementation
- [ ] T010 [US2] `src/ui/02-learn.js` `renderReact`: بعد سحب `k` وفحوص المدة الحالية، `if (!E.schedReactOk(S, k, r)) return renderReact();` (قبل الإضافة إلى `L.hist`).
- [ ] T011 [US2] `src/ui/04-header.js` `roadTip(cr)`: أعد `''` إن `!E.schedTipOk(S, cr.id)`.

## Phase 5: Polish

- [ ] T012 وسّع `tools/sched-compare.js`: صفوف case (أُعلنت/تأخير متوسط وأقصى/أقل فارق عن لحظة) وreact وtips (معروض/مُسقط)، «قبل» بالمفاتيح الثلاثة مطفأة. تحقق: SC-001 صفر مسألة بفارق < يومين (عدا السقف)، SC-002 كل المستحق أُعلن، والتعليقات المعروضة ≥ ٨٠٪ من «قبل».
- [ ] T013 حدّث `docs/sched/BEFORE_AFTER.md` بقسم 002 (جدول قبل/بعد).
- [ ] T014 سطر في `docs/guide/CHANGELOG.md`: `- [لاعب] 2026-..: مسائل مجلس السوق وتعليقات عمّ سالم لا تأتي في يوم لحظة كبيرة`.
- [ ] T015 `node build.js && node test/run.js` كاملاً بلا إخفاق (و`first-try` و`react-episodes` و`sched-types`)، ثم commit وpush إلى `main` مع `index.html` المبني.
- [ ] T016 حدّث `docs/plan/STATUS.md` و`tasks.md` في الجذر، وتوقف واعرض الجدول على بن محمود.

## Dependencies & Execution Order

- T001 ← T002 ← Phase 2 ← Phase 3 ← Phase 4 ← Phase 5.
- T010 وT011 [P] بعد T004.
