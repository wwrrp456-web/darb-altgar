---
description: "مهام WP-18"
---

# Tasks: رحلة التاجر بالفصول السبعة (WP-18)

**Input**: `specs/003-chapters-journey/` (spec.md, plan.md)
**Tests**: مطلوبة (الدستور، المبدأ الثالث).
**المنفّذ**: انظر `specs/README.md`، حزمة واحدة ثم توقف. **المراجعة**: Opus ثم موافقة بن محمود المنفردة (شاشة جديدة).

## Phase 1: Setup

- [ ] T001 تأكد أن 002 معتمدة (`docs/plan/STATUS.md`)؛ وإلا توقف.
- [ ] T002 خط أساس: `node build.js && node test/run.js` واحفظ النتيجة.
- [ ] T003 انقل (`git mv`) `brand/next/chapters/ch1..7.webp` إلى `brand/img/chapters/`، وتحقق بعد `node build.js` أن `ART['chapters/ch1']` موجود.

## Phase 2: Foundational

- [ ] T004 `src/engine/28-life.js`: `chapterJourney(S, pieces)` حسب D1–D3 في plan.md (الحالي/منجز/جارٍ/لم يبدأ، والفصلان ٥ و٦ «جانبي»، والحِكم خارج النسبة). صدّرها في `31-api.js`.
- [ ] T005 `test/chapters.test.js` (Node): (أ) كل قطعة في `PIECES` تُعدّ في فصل واحد بالضبط ومجموع `total`+الحِكم = ٣٩٧ (SC-002)؛ (ب) لاعب أتمّ المراحل ١–٥ والحالية ٦ ⇒ ف٣ حالي، ف١ وف٢ منجزان (قبول القصة ١)؛ (ج) أثناء ف٤ ⇒ ف٣ «جارٍ» لا منجز؛ (د) حفظ جديد ⇒ ف١ حالي والباقي لم يبدأ؛ (هـ) بعد التخرج ⇒ ف٧ حالي/منجز ولا خطأ؛ (و) حالة «ابدأ حفيداً» لا ترمي خطأ؛ (ز) الدالة لا تعدّل `S` (مقارنة `save` قبل/بعد).

**Checkpoint**: `node test/chapters.test.js` ناجح.

## Phase 3: User Story 1 + 2 - أين أنا وما في الفصل (P1) 🎯

- [ ] T006 [US1] `src/ui/02-learn.js`: `chaptersHTML()` تُدرج في `screenAcademy` قبل `academyPointsHTML()`؛ سبع عقد بأيقونة `ART['chapters/chN']` (وإلا الرقم)، والعنوان، وشارة الحالة، و«أنجزت x من y».
- [ ] T007 [US2] كل عقدة `<details>`: عدّ لكل نوع بأسماء عربية (مراحل، مستويات، مسائل، بطاقات، ألواح، أسرار، حكايات الزعماء، منتجات، إنجازات، تعليقات عمّ سالم)، وأسماء المراحل المنجزة فقط، وسطر «حِكم الطريق: n» لف٤. لا عناوين لما لم يُبلغ.
- [ ] T008 [US1] CSS في `src/template.html`: `.chj` شبكة ملتفّة (٤+٣ على ٣٩٠، صف على ١١٠٠)، أيقونة ٤٨px، الحالي بإطار ذهبي، «لم يبدأ» باهت بقفل؛ RTL.
- [ ] T009 [US1] اطوِ `lifeStagesHTML()` في `<details>` «مراحل المسيرة» تحت الرحلة؛ ومفتاح `ui.chapters` (افتراضي true): false ⇒ لا رحلة والقسم القديم مفتوح كما كان حرفياً.
- [ ] T010 [US1] `test/chapters-ui.test.js` (Playwright): ثلاث حالات (بداية، وسط ف٣، بعد التخرج) × عرضان ٣٩٠ و١١٠٠: العقد سبع، الحالي مميز واحد، فتح عقدة يُظهر «أنجزت»، لا تمرير أفقي، لا أخطاء وحدة التحكم؛ واحفظ اللقطات الست في `docs/shots/wp18/` لعرضها على بن محمود. و`ui.chapters=false` ⇒ لا `.chj`.
- [ ] T011 أضف الاختبارين إلى `test/all.sh` و`test/map.json` (أجزاء `28-life` و`02-learn` و`content-map` و`template`).

## Phase 4: Polish

- [ ] T012 شغّل `content-map` و`lifecycle-ui` و`academy`/`learn` ذات الصلة؛ لا تكسر قسم المستويات ولا الكتب تحته.
- [ ] T013 سطر في `docs/guide/CHANGELOG.md`: `- [لاعب] 2026-..: رحلة التاجر بسبعة فصول في الأكاديمية، تريك أين أنت وما أنجزت في كل فصل`.
- [ ] T014 `node build.js && node test/run.js` كاملاً بلا إخفاق جديد، ثم commit (مع `index.html` وملفات الجذر المبنية) وpush إلى `main`.
- [ ] T015 حدّث `docs/plan/STATUS.md` و`tasks.md` في الجذر، وتوقف واعرض اللقطات الست على بن محمود.

## Dependencies & Execution Order

- T001 ← T002 ← T003 ← T004 ← T005 ← T006–T009 ← T010–T011 ← Phase 4.
- T007 وT008 [P] بعد T006.
