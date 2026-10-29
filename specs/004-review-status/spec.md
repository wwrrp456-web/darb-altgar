# Feature Specification: جدول الاعتماد الشرعي وأداتا التصدير والاستيراد (WP-20)

**Feature Branch**: `004-review-status`

**Created**: 2026-10-29

**Status**: Draft — الخطة والمهام تُكتب بـ`/speckit-plan` و`/speckit-tasks` حين يأتي دورها

**Input**: `docs/plan/WP-20.md`. الطريقة المعمول بها فعلاً (الدفعتان ٠٥ و٠٦) يدوية: `docs/review/batches/*_PASTE.md` ثم `APPROVED_BATCH_NN.md`. هذه الحزمة تؤتمتها.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - دفعة جاهزة للنسخ بأمر واحد (Priority: P1)
`node tools/review-export.js <الدفعة>` يُخرج ملفاً نصياً مرتباً، لكل نص رقم ثابت وسطر «أين يظهر»، ≤ ٣٠ نصاً، بلا شيفرة، يرسله بن محمود للمختص كما هو.

### User Story 2 - تطبيق الرد بالأرقام (Priority: P1)
بن محمود يلصق رد المختص، و`node tools/review-import.js` يطابق بالأرقام فقط، ويحدّث النصوص في `src/`، ويرفض الرقم المفقود أو المكرر بتقرير واضح.
**Acceptance Scenarios**:
1. **Given** تصدير ثم استيراد بلا تعديل، **Then** لا يتغير شيء (اختبار).
2. **Given** نص معدَّل، **Then** يظهر في اللعبة بحرفه.

### User Story 3 - جدول الحالة (Priority: P2)
`docs/review/STATUS.md`: كل ميزة مالية أو دينية بحالتها (معتمد، ظاهر بلا اعتماد موثّق، مخفي بقرار BM)، و`src/review-flags.js` يُخفي **فقط** ما قرر بن محمود إخفاءه.

### Edge Cases
- ما في `APPROVED_*` يبدأ «معتمد»، ولا تُخفى ميزة تعمل اليوم بسبب غياب الاعتماد.
- الدفعتان ٠٥ و٠٦ المطبّقتان يدوياً تُسجَّلان «معتمد» في الجدول.

## Requirements *(mandatory)*
- **FR-001**: `tools/review-export.js` و`tools/review-import.js` و`src/review-flags.js` و`test/review-roundtrip.test.js`.
- **FR-002**: لا تعديل لنص في `APPROVED_*`؛ والأداة ترفض الاستيراد إليها.
- **FR-003**: الحالات الثلاث كما في الدستور، والافتراضي لا يخفي شيئاً.

## Success Criteria *(mandatory)*
- **SC-001**: ذهاب وإياب بلا تعديل = صفر فروق.
- **SC-002**: لا ميزة معتمدة سابقاً تختفي (اختبار).
- **SC-003**: الدفعة التالية (٠١ الزكاة) جاهزة للنسخ.

## Assumptions
- القرار الشرعي للمختص عبر بن محمود دائماً.
