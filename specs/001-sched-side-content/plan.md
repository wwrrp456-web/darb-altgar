# Implementation Plan: نقل الألواح والأسرار وحكايات الزعماء إلى المُجدوِل (WP-17ب-2)

**Branch**: `main` (قاعدة المشروع) | **Date**: 2026-10-29 | **Spec**: `specs/001-sched-side-content/spec.md`

**Input**: Feature specification from `specs/001-sched-side-content/spec.md`

## Summary

نعمّم آلية البطاقات (`cwait` في WP-17ب-1) على أربعة أنواع جانبية: يبقى **الاستحقاق والمكافأة** في يومهما، ويُحجز **العرض** وحده في قائمة معلّقين `L.mwait` تُفرَّغ لحظةً لحظةً بقاعدة الفاصل (يومان) والسقف (٥ أيام)، مع مفتاح رجوع لكل نوع.

## Technical Context

**Language/Version**: JavaScript (ES2020)، محرك بلا واجهة يعمل في المتصفح وNode
**Primary Dependencies**: لا شيء (ملف HTML واحد)
**Storage**: حفظ اللاعب (`localStorage` مضغوط) عبر `27-save.js`
**Testing**: `node test/run.js` (القائمة في `test/all.sh`)، `tools/sched-compare.js` للقبول
**Target Platform**: متصفح الجوال (PWA)، ٣٩٠px
**Project Type**: لعبة ويب ملف واحد
**Performance Goals**: لا أثر يُذكر على `tick`
**Constraints**: لا تغيير في الاقتصاد ولا في المراحل والمستويات؛ لا محتوى يضيع
**Scale/Scope**: ٤ مطلقات في `src/engine/22-learn.js`، ونقطة إطلاق في `29b-sched.js`

## Research / القرارات

- **D1 — نؤجّل العرض لا الاستحقاق.** البطاقات ليس لها مكافأة فأُجِّل إطلاقها كله؛ أما اللوح ففيه ذهب، وتأجيله يغيّر الاقتصاد ويفتح باب «زال الشرط». لذلك تبقى `L.tab.push` و`P.gold` و`L.lore[id]` و`L.secrets`/`L.csec` و`learnPerks` في يومها، ويُستبدل الدفع إلى `tq`/`sq`/`csq`/`bq` بدفع إلى `L.mwait`. *البديل المرفوض:* تأجيل الاستحقاق كله (يغيّر توقيت الذهب، ويحتاج تجميد الشرط).
- **D2 — الأخبار مع العرض.** يُخزَّن في المعلّق ما يكفي لإعادة بناء سطر الخبر (`k`, `id`, `n`)، ويُستدعى `news` عند التفريغ.
- **D3 — ختم آخر لحظة عند العرض.** `schedMom` يعدّ القوائم (الاستحقاق)؛ للأنواع المنقولة يُختم `L.lastMom` عند التفريغ من `mwait` لا عند الاستحقاق، وإلا حجب الاستحقاقُ نفسه العرضَ. يُعدَّل `schedMom` ليطرح طول `mwait` من العدّ.
- **D4 — نقطة التفريغ واحدة**: دالة `schedRelease(S)` تُستدعى من `cardDay` (قبل منطق `cwait`) ومن لفّاف الأفعال في `27-save.js` (لأن ٥٤٪ من الإطلاقات عند فعل اللاعب). تفرّغ معلّقاً واحداً إن سمح `schedMayFire`، بالأولوية: tablet ← secret ← csecret ← boss، ثم تأتي البطاقة المؤجَّلة في دورها.
- **D5 — الحفظ:** `mwait` حقل اختياري؛ الحفظ القديم بلا الحقل يعمل (`loreFix` ينشئه). لا هجرة إلزامية. عند إطفاء مفتاح نوع: `schedRelease` يفرّغ معلّقي ذلك النوع كلهم فوراً.

## Constitution Check

| المبدأ | الحكم |
|---|---|
| أولاً الشرع | ✅ لا نص ديني جديد؛ أسطر الأخبار القائمة تُنقل كما هي |
| ثانياً الحفظ | ✅ حقل اختياري، مفاتيح رجوع، اختبار تبديل المفتاح مع حفظ |
| ثالثاً الاختبار | ✅ اختبار جديد `sched-side.test.js` في `all.sh` و`map.json`، والحزمة الكاملة |
| رابعاً لعب لا محاضرة | ✅ الهدف تقليل التزاحم؛ المراحل والمستويات لا تُؤجَّل |
| خامساً البساطة | ✅ تعميم آلية قائمة، بلا بنية جديدة |

## Project Structure

### Documentation (this feature)

```text
specs/001-sched-side-content/
├── spec.md
├── plan.md
└── tasks.md
docs/sched/BEFORE_AFTER.md   # يُحدَّث بجدول قبل/بعد
```

### Source Code (repository root)

```text
src/engine/22-learn.js     # loreCheck, learnCountry, tabletCheck: الدفع إلى mwait عند تشغيل المفتاح
src/engine/29b-sched.js    # SCHED.tablets/secrets/lore، schedRelease، تعديل schedMom
src/engine/29-cards.js     # استدعاء schedRelease قبل cwait
src/engine/27-save.js      # استدعاء schedRelease في لفّاف الأفعال
src/engine/29-aging.js     # تفريغ mwait مع الطوابير (ابدأ حفيداً)
src/ui/17-dev-autopilot.js # تفريغ mwait مع الطوابير
src/engine/31-api.js       # تصدير schedRelease
test/sched-side.test.js    # جديد
tools/sched-compare.js     # يقارن الأنواع الأربعة بمفاتيحها
```

**Structure Decision**: بنية المشروع الحالية؛ لا ملفات جديدة في `src/`.

## Complexity Tracking

لا مخالفة للدستور تحتاج تبريراً.
