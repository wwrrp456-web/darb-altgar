# طابور الأوامر (يحدّثه المنسّق بعد كل مراجعة؛ يقرؤه كل منفّذ بالبرومت الثابت من `PROMPTS.md`)

**آخر تحديث:** 2026-11-12، المنسّق (مراجعة 035ج2 و036ز).

**`main` المعتمد:** `53c24a0` (تكامل 036هـ). الحالي `22d1d7c` (وثائق فوق `53c24a0` تكامل 036هـ).

**الحالة بسطر:**
- **في اللعبة:** 031–033، و035أ/ب/ج، و036أ–و، و037أ–هـ، و038أ/ب، و040 (عدا د)، و041أ/ب، و042، و043أ، و044.
- **جاهزتان للتكامل:** 035ج2 (`ccr-a5e5fa00-69mhx3`) ثم 036ز (`ccr-0bba6413-tpluzv`). **قيد العمل:** 045.
- **ينتظر مواصفة:** 043ب، والمشاريع كاستثمارات، و040د، و035د/هـ، و038ج/د، و034.
- **ينتظر المختص:** 030.

---

## التكامل
**الحزمتان:** 035ج2 ثم 036ز بهذا الترتيب (جُرِّب الدمج فعلاً في worktree فوق `22d1d7c`). مراجعة Opus لـ036ز: **سليم** (GR-01 وHF-01 وCT-14 حرفاً، ولا مال يتحرك، ولا شرط جزائي جديد).

1) git fetch origin ثم ابدأ فرعك من origin/main. ادمج `origin/ccr-a5e5fa00-69mhx3` (035ج2): **بلا تعارض** (دمج main فيه قبل التقرير).
2) ثم ادمج `origin/ccr-0bba6413-tpluzv` (036ز): فرعه بُني على `b758c07` قبل 036هـ، فتتعارض هذه الملفات، وحلّها:
   - `src/engine/09-travel.js` سطر `customsOf` (**حقيقي**): احتفظ بسطر main (فيه `passMul` لـ036هـ) وأضف `peaceCust`: `Math.min(حلف ? 0.5 : 1, pl ? Math.min(agrCustMul(S,to,cargo), passMul(S,to)) : 1, pl ? peaceCust(S,to) : 1)`. لا تُسقط أياً من الثلاثة.
   - `src/engine/31-api.js` (`const API`): اتحاد الأسماء، أي أسماء main (FARMX/MGRX والطرق `ROAD_KINDS`…) **وأسماء 036ز** (`fdH, fdMajor, fdKey, majorEnsure, medOn, tzOn, MED_TXT, medView…peaceQuota`).
   - `src/ui/06o-details.js` (سلسلة `card = … ||`): اتحاد البطاقات من الطرفين.
   - `test/skill.test.js` و`test/skill-b.test.js` و`scripts/capture-homest-off.js`: اتحاد التثبيتات (`FARMX` و`MGRX` و`INFLU.fam.road` من main، و`GRIEF.major` و`INFLU.mediate` و`INFLU.tazkiya` من 036ز).
   - `test/all.sh`: اتحاد الأسماء (`farm-x farm-x-ui mgr-x influence-road influence-road-ui` مع `feuds-major mediate tazkiya mediate-ui`). `test/map.json`: دمج بنيوي. `CHANGELOG`: سطور الطرفين.
   - المولَّدات (`index.html` و`sw.js` و`version.json` و`src/engine.js`): `--ours` ثم `node build.js`. ثم `grep -rn "^<<<<<<<" .` يجب ألا يُظهر شيئاً.
3) `node scripts/first-paint-keys.js` ثم `node build.js`.
4) **الخصومات الكبرى مفعّلة افتراضياً** في 036ز، فتتغير مسارات autopilot/guided: أعد التقاط ثوابت autopilot مرة واحدة بعد الدمج.
5) الحزمة الكاملة `node test/run.js` بلا إخفاق (والتي تُثبَّت فيها المفاتيح مطفأة تبقى مطفأة)، ثم 390px بلا تمرير أفقي.
6) ادفع إلى main (إن رُفض لتقدّم main بوثائق المنسّق: fetch ثم merge ثم أعد). تقرير التكامل في `specs/INTEG_REPORT.md` بسطور: الالتزام بعد `git ls-remote`، التعارضات التي حللتَ، نتيجة الحزمة.
7) ⛔ توقف.

---

## الأمين
**الحزمة:** 045 حارس الشرط الجزائي. **حساسة:** تمر بمراجعة Opus قبل التكامل.

1) git fetch origin main ثم ابدأ فرعك من origin/main. اقرأ CLAUDE.md وdocs/plan/COMMITMENTS.md ثم specs/045-penalty-guard/spec.md وtasks.md، وGN-01 في docs/review/APPROVED_INFLUENCE_CONTRACTS_2026-11-09.md. نفّذ المهام بالترتيب.
2) المفتاح PEN.old: false هو الجديد، وtrue يعيد الغرامات الثابتة حرفاً، ويُثبَّت true في test/skill.test.js وtest/skill-b.test.js وscripts/capture-homest-off.js.
3) عقود 036 تبقى بأرقامها نفسها حرفاً (إعادة كتابة لا تغيّر سلوكاً). لا نص ديني جديد. النصوص الجديدة للعقود القديمة في التقرير لمراجعة Opus.
4) node build.js ثم شغّل منفردةً: penalty-guard وinfluence وinfluence-ui وinfluence-fin وinfluence-mfg وinfluence-road وreview-flags وzakat وwealth وskill وskill-b واختبارات العقود القديمة (grep -l breakPact test/) وicons وhome-status-ui وdetails-all-ui وart-ui وpage-budget.
5) قبل التقرير: git fetch origin main && git merge origin/main ثم البناء والاختبارات مرة أخرى. سطر CHANGELOG. التقرير specs/045-penalty-guard/report.md (≤ 40 سطراً) وفيه جدول «كل موضع خصم شرطي: قبل ← بعد». ادفع إلى فرعك. ⛔ توقف.

---

---

## الازدهار
**لا مهمة.** فرغتَ من 035ج2. لا توجد حزمة لها مواصفة جاهزة الآن (043ب والمشاريع كاستثمارات ينتظران Opus). **انتظر** حتى يحدّث المنسّق هذا القسم.

---

## مراجعة Opus
**036ز: سليم** (أُنجزت). **045:** ستأتي حين ينتهي الأمين، ويكتب المنسّق هنا الفرع والملفات وما يُراجع.

---

## Opus (كتابة مواصفات؛ تُفتح بالبرومت ٥ عند الحاجة)
**المطلوب التالي بالترتيب (الازدهار فارغ ينتظر أولها):**
1. 043ب: بقية محوّلات الناظر.
2. المشاريع الكبرى كاستثمارات.
3. 040د: شراكات المنافسين عند حكم السوق.
4. 035د/هـ.
5. 038ج/د.
6. 034: الخريطة الحية (الرسم جاهز في `brand/next/map-final/3/`).

وكل مواصفة فيها شرط جزائي أو زكاة أو حكم **بمعادلتها حرفاً**.

---

## كودكس
**لا مهمة.** كل الرسم المعلّق منجز.

---

## ملاحظات المنسّق من أسئلة الأمين في 036ز (للتسجيل لا للتنفيذ)
- نص «الأثر» في `texts.md` لا يطابق سلع الصين والهند في بيانات اللعبة؛ تعرض الواجهة السلع الفعلية. يقرره Opus عند مواصفته القادمة.
- السوق المحايد في الوساطة: أي مدينة خارج دولتي الزعيمين. وإن حكم اللاعب إحدى مدينتي الخصومة فلا وساطة (يلزم زعيمان): قرار لـOpus.
- احتفال بمشهد خاص للصلح: طلب لكودكس عند الحاجة (المستعمل `market_lead`).
- فرع `claude/…` المتروك `ccr-afa0a3e5-zztewo` وثائق Opus قديمة (2026-11-11) سبقتها وثائق main؛ لا عمل لعبة فيه.
