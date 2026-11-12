# تقرير 045 حارس الشرط الجزائي (الأمين)
الفرع: `claude/darb-altujjar-trustee-tasks-mgg0hx`. الحزمة حساسة: تنتظر مراجعة Opus.

## ما نُفِّذ
- `src/engine/30h2z-penalty.js`: `PEN={old:false}`، `PEN_PARTS` (customsGiven, marginLost, moneyHeld, priceDrop)، `actualDamage` (يرمي خطأ لاسم غير معتمد)، `payPenalty` (لا يخصم عند الصفر)، `oldPactFine`. مسجَّلة في `31-api.js` و`src/README.md`.
- `'pactPenalty'` لا يظهر في المحرك إلا في هذا الملف (اختبار ثابت).
- المفتاح `PEN.old=true` مثبَّت في `skill` و`skill-b` و`capture-homest-off`.

## كل موضع خصم شرطي: قبل ← بعد
| الموضع | قبل | بعد |
|---|---|---|
| `breakPact` (فسخ عقد قديم) | `min(pc.penalty, gold)` | 0 (old=true: الثابت حرفاً) |
| عجز عن رسوم العقد القديم (`05-haggle`) | الغرامة الثابتة | 0 |
| انقلاب السوق مع `INFLU.on=false` (`05-haggle`) | الغرامة الثابتة | 0 |
| فسخ تصدير (`breakAgr`) | `min(saved, gold)` | `payPenalty({customsGiven:saved})` نفس الرقم |
| تسوية التصدير الشهرية | `round(cust+lost)` | `{customsGiven, marginLost}` + `round` نفس الرقم |
| معاهدة المرور: شهرياً/فسخ | `min(dmg,gold)` | `customsGiven` نفس الرقم |
| الامتياز: شهرياً/فسخ | `min(dmg,gold)` | `marginLost` نفس الرقم |
| تعويض تأخر الصانع (036د) | `paid×opp×late` | `moneyHeld` نفس الرقم |
| فسخ الاستصناع بالعجز | `min(paid, max(0,drop))` | `priceDrop` نفس الرقم |

العربون والثقة والمهلة (`bs.cd`) وسمعة النقض (`repOf.broke`) كما هي.

## نصوص جديدة للعقود القديمة (لمراجعة Opus، لا نص ديني)
- فسخ: «فسختَ العقد؛ غضب <الزعيم> منك وتأثرت سمعتك.»
- عجز: «…انفسخ العقد؛ غضب الزعيم منك وتأثرت سمعتك.»
- انقلاب: «(انتهى عقدك معه)» بدل «دفعت بند العقد الجزائي». (النصوص القديمة تبقى عند `PEN.old=true`.)

## الاختبارات (منفردة)
نجحت: penalty-guard (جديد) وinfluence وinfluence-ui وinfluence-fin وinfluence-mfg وinfluence-road وreview-flags وzakat وwealth وskill وskill-b وbosses وmarket2 (فيهما breakPact؛ حُدّث bosses ليتوقع «لا خصم» بتعليل GN-01) وicons وhome-status-ui وdetails-all-ui وart-ui وpage-budget. الحزمة الكاملة لم تُشغَّل.
