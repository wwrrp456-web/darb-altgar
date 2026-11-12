# تقرير التكامل ت1 (035ج2 + 036ز + 045)

- **الالتزام على main:** يُسجَّل بعد الدفع و`git ls-remote` (انظر رسالة الدفع).
- **الدمج:** `origin/main` ثم 035ج2 + 036ز (الفرع `ccr-2fd1b426-f4v7qf`) ثم `claude/darb-altujjar-trustee-tasks-mgg0hx` (045).
- **التعارضات المحلولة:** `customsOf` بالثلاثة (`agrCustMul` و`passMul` و`peaceCust`)؛ `31-api.js` اتحاد الأسماء (بما فيها `PEN…`)؛ `06o-details.js` اتحاد البطاقات؛ `all.sh` و`map.json` اتحاد؛ `CHANGELOG` سطور الطرفين؛ تثبيتات الإطفاء في skill وskill-b وcapture-homest-off (`FARMX/MGRX/GRIEF.major/mediate/tazkiya/INFLU.fam.road` مطفأة و`PEN.old=true`)؛ المولَّدات `--ours` ثم `node build.js`؛ `docs/shots` `--ours`.
- **الإصلاحات الثلاثة (قرارات ملزمة):**
  1. `numerals`: أُزيلت `'٫'` من `10l-mgmt-x.js`. **انحراف:** استُعمل `String(r.theft)` لا `fmt`، لأن `fmt` يقرّب إلى صحيح فيُظهر احتمال الاختلاس 0.3 أو 0.1 ٪ صفراً أو واحداً. لـOpus أن يقرر.
  2. `quran-prefix`: يقبل `/قال (الله )?تعالى:/` (نافذة الفحص ٢٠ حرفاً) مع التعليل؛ نص GR-01 لم يُمسّ.
  3. `shopreport` و`hoarding`: `E.GRIEF.on = false` مع التعليل.
- **إصلاح إضافي (خارج الأمر):** `home-status-ui`: كلفة ترميم الدكان (529) فاقت ذهب العالم المنزاح فاختفى المقترح؛ أُضيف `S.player.gold = max(gold, 5000)` في سطر الإعداد (يقيس الأزرار لا الفقر). لا تغيير في المصدر.
- **البصمات:** `autopilot-13/18/23` حُدّث `sourceHash` وحده (acaf7b0c…) حسب ملاحظة 35؛ `guided-4/8/10` أُعيد التقاطها بـ`scripts/capture-guided.js` (يصلها `capture-homest-off`).
- **الحزمة الكاملة:** 364 ناجحاً و2 فاشلان (`quran-prefix` و`home-status-ui`) قبل الإصلاح الأخير؛ أُصلحا وأُعيد تشغيلهما منفردين فنجحا. **لم تُعد الحزمة الكاملة بعدهما.**
- **390px:** لا تمرير أفقي (scrollWidth = 390).
- **حجم الصفحة:** index.html نحو 3.69MB.
- **تنبيه:** `docs/plan/COMMITMENTS.md` و`OPUS_HANDOFF.md` فيهما علامات `<<<<<<< HEAD` قادمة من main نفسه (وثائق المنسّق)، لم ألمسها.
