# Implementation Plan: المسائل الفقهية والحِكم وتعليقات عمّ سالم في المُجدوِل (WP-17ب-3)

**Branch**: `main` (قاعدة المشروع) | **Date**: 2026-10-29 | **Spec**: `specs/002-sched-ui-content/spec.md`

**Input**: Feature specification from `specs/002-sched-ui-content/spec.md`

## Summary

ثلاثة أنواع خفيفة تدخل المُجدوِل بآلية 001 نفسها (`L.lastMom` و`schedMayFire`) بلا بنية جديدة: **المسألة** يُؤجَّل إعلان جاهزيتها حتى الفسحة أو السقف؛ **التعليق** و**الحكمة** يُسقطان (لا يُؤجَّلان) في يوم لحظة كبيرة، ويُعدّ المُسقَط. لكل نوع مفتاح رجوع.

## Technical Context

**Language/Version**: JavaScript (ES2020)، محرك بلا واجهة + واجهة في المتصفح
**Primary Dependencies**: لا شيء (ملف HTML واحد)
**Storage**: حفظ اللاعب عبر `27-save.js`؛ حقلان اختياريان جديدان `L.mj.due` و`L.schedDrop`
**Testing**: `node test/run.js`؛ `tools/sched-compare.js` للقبول
**Target Platform**: متصفح الجوال (PWA)، ٣٩٠px
**Constraints**: لا تغيير في الاقتصاد ولا المراحل؛ لا مسألة تضيع؛ التحذيرات لا تُسقط
**Scale/Scope**: مطلق واحد في `src/engine/22-learn.js`، ونقطتا عرض في `src/ui/02-learn.js` و`src/ui/04-header.js`

## Research / القرارات

- **D1 — تصحيح موضع المسألة:** المسألة لا تُطلق من الواجهة كما تقول المواصفة (FR-001)، بل يُعلَن جاهزيتها في المحرك (`22-learn.js`: ضبط `L.mj.ready` وخبر «مسألة جاهزة»)، ثم تظهر بطاقة في المكتب (`06b-office.js` عبر `mjReady`). فالاعتراض في **المحرك** عند الإعلان لا في الواجهة. *البديل المرفوض:* منع `mjNow` حين يفتح اللاعب المجلس بنفسه؛ لأنه فعل اختاره اللاعب (زرّ «مسألة الأسبوع» في الدفتر)، ومنعه يبدو عطلاً.
- **D2 — المسألة تُؤجَّل ولا تُسقط:** حين يتحقق شرط الدورة (٣٠–٤٥ يوماً) يُختم `L.mj.due = S.day` مرة واحدة، ويُعلَن فقط إن سمح `schedMayFire(S, L.mj.due)`؛ وعند الإعلان يُختم `L.lastMom = S.day` ويُمسح `due`. المتطلّب (`mjNext`/`mjWant`) يُقرأ لحظة الإعلان فلا تتقدم مسألة على متطلّبها. هذا يحقق قبول القصة ١ («تنتظر وتظهر لاحقاً»)؛ وسبب الانتظار لا يحتاج نصاً جديداً لأن البطاقة لا تظهر أصلاً قبل الإعلان.
- **D3 — التعليقات تُسقط عند العرض لا عند الاستحقاق:** `learnReact` قد يُستدعى قبل ختم لحظة اليوم نفسه، فالقرار في `renderReact` (الواجهة) عند سحب `L.rq`: إن كان `L.lastMom === S.day` والتعليق ليس تحذيراً (`r.alert`/`r.adv`) ولا `r.always` ⇒ يُسقط ويُعدّ. القرار نفسه في دالة محرك `schedReactOk(S, k, r)` لتُختبر بلا متصفح.
- **D4 — استثناء الافتتاحية:** لا يُسقط شيء قبل إتمام أول مرحلتين (`(L.stageDone||[]).length < 2`) حفاظاً على تعليق أول ربح (WP-07). هذا يضيّق الحالة الحدّية في المواصفة عمداً.
- **D5 — الحكمة:** `roadTip` سطر باهت في بطاقة الرحلة وليست لحظة. عند `SCHED.tips` وفي يوم لحظة (`L.lastMom === S.day`) لا يُرسم السطر، ويُعدّ الإسقاط مرة لكل رحلة لا لكل رسم.
- **D6 — العدّ:** `L.schedDrop = {react: n, tips: n}` في الحفظ (اختياري)، ويقرؤه `tools/sched-compare.js`. شرط القصة ٢: المعروض «بعد» ≥ ٨٠٪ من «قبل».
- **D7 — مفاتيح الرجوع:** `SCHED.cases` و`SCHED.tips` و`SCHED.react` (true افتراضياً). عند إطفاء `cases` و`due` مختوم: الإعلان فوري في اليوم التالي كالقديم، و`due` يُمسح.

## Constitution Check

| المبدأ | الحكم |
|---|---|
| أولاً الشرع | ✅ لا نص ديني جديد؛ المسائل ونصوصها لا تُمس، يتغير توقيت الإعلان فقط |
| ثانياً الحفظ | ✅ حقلان اختياريان، مفاتيح رجوع، اختبار حفظ قديم وتبديل المفتاح |
| ثالثاً الاختبار | ✅ اختبار جديد `test/sched-ui.test.js` في `all.sh` و`map.json`، والحزمة الكاملة |
| رابعاً لعب لا محاضرة | ✅ يقلل التزاحم؛ لا مسألة تضيع، والتحذيرات لا تُسقط |
| خامساً البساطة | ✅ يعيد استعمال `lastMom`/`schedMayFire`، بلا طابور جديد |

## Project Structure

```text
specs/002-sched-ui-content/{spec,plan,tasks}.md
docs/sched/BEFORE_AFTER.md      # قسم 002
src/engine/29b-sched.js         # SCHED.cases/tips/react، schedReactOk، schedDropN
src/engine/22-learn.js          # إعلان المسألة عبر L.mj.due وschedMayFire
src/engine/31-api.js            # تصدير schedReactOk وschedDropN
src/ui/02-learn.js              # renderReact: الإسقاط والعدّ
src/ui/04-header.js             # roadTip: الإخفاء في يوم لحظة
tools/sched-compare.js          # صفوف case/react/tips
test/sched-ui.test.js           # جديد
```

**Structure Decision**: بنية المشروع الحالية؛ لا ملفات جديدة في `src/`.

## Complexity Tracking

لا مخالفة. انحراف موثَّق عن المواصفة: D1 (موضع الاعتراض) وD4 (استثناء الافتتاحية).
