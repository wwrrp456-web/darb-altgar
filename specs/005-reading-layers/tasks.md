---
description: "مهام WP-19أ"
---

# Tasks: طبقات القراءة — الجزء ١٩أ (البنية + الفصلان ١–٢)

**Input**: `specs/005-reading-layers/` (spec.md, plan.md)
**المنفّذ**: انظر `specs/README.md`. **المراجعة**: Opus ثم موافقة بن محمود المنفردة.
**قاعدة صارمة**: لا يتغير أي نص حالي حرفاً؛ لا `short` لأي نص معتمد أو ديني (D4)؛ لا مساس بـ`APPROVED_*` ولا `src/fiqh.js`.

## Phase 1: Setup

- [x] T001 تأكد أن 004 معتمدة؛ وإلا توقف.
- [x] T002 خط أساس: `node build.js && node test/run.js`.

## Phase 2: Foundational

- [x] T003 `test/approved-texts.test.js` حسب D7 (يمر قبل أي تحويل)، وأضفه إلى `all.sh` و`map.json`.
- [x] T004 `src/ui/00-state.js`: `ui.reader` (افتراضي `'adult'`) و`txt(obj, key)` حسب D3.
- [x] T005 `test/textlint.test.js`: فحص `short` (≤ ٢٠ كلمة، بلا ﴿ ولا ﷺ ولا «قال»).

**Checkpoint**: لا تغيير مرئي؛ الحزمة الكاملة كخط الأساس.

## Phase 3: User Story 1 - من يلعب؟ (P1)

- [x] T006 [US1] `src/ui/02-learn.js`: خياران «ناشئ (١٢–١٤)» و«كبير» على شاشة اختيار الشخصية القائمة، الافتراضي «كبير»، بلا خطوة جديدة.
- [x] T007 [US1] `src/ui/15-render.js`: بند في قائمة ⋯ للتبديل.
- [x] T008 [US1] تحقق أن `first-profit` و`player-mode` و`first-try` ناجحة بلا زيادة ضغطات.

## Phase 4: User Story 2 - العينة ثم التحويل (P1)

- [x] T009 [US2] اجرد نصوص الفصلين ١–٢ (عبر `ch` في `src/content-map.js`) الأطول من ٢٠ كلمة، واستبعد D4. اكتب ٢٠ نصاً قصيراً متنوعاً (مراحل، مستويات، بطاقات، ألواح، حكايات زعماء) في `docs/reading/SAMPLE_19A.md`.
- [x] T010 **⛔ توقف**: ادفع العينة وحدها (بلا تغيير في `src/`) واعرضها على بن محمود. لا تكمل حتى يعتمدها.
- [ ] T011 [US2] بعد الاعتماد: أضف حقول `short` للعينة ثم لبقية نصوص الفصلين بالأسلوب المعتمد، واستعمل `txt()` في نقاط العرض في `src/ui/02-learn.js`.
- [ ] T012 [US2] `test/reading-ui.test.js` حسب D7 (لقطات في `docs/shots/wp19a/`)، وأضفه إلى `all.sh` و`map.json`.

## Phase 5: Polish

- [ ] T013 سطر في `docs/guide/CHANGELOG.md`: `- [لاعب] 2026-..: إعداد «من يلعب؟»: للناشئ نص أقصر في الفصلين الأولين، والنص الكامل تحت «اقرأ أكثر»`.
- [ ] T014 `node build.js && node test/run.js` كاملاً بلا إخفاق جديد، ثم commit وpush إلى `main`.
- [ ] T015 حدّث `docs/plan/STATUS.md` و`tasks.md` في الجذر، وتوقف واعرض اللقطات وعدد النصوص المحوَّلة.

## Dependencies

T001 ← T002 ← T003–T005 ← T006–T008 ← T009 ← **T010 (بن محمود)** ← T011–T012 ← Phase 5.
