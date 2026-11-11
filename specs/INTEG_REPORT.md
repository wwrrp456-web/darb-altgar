# تقرير التكامل 2026-11-11 (040ز-ب + 040ح + 038ب)

**دُمج (--no-ff):** `origin/ccr-094a6c5d-jnloyq` (040ز-ب + 040ح) ثم `origin/claude/package-038b-tasks-season-2malkd` (038ب). ونُقلت وثائق/قواعد فرع التخطيط (CLAUDE.md وCOMMITMENTS وRULE_NO_COSMETIC وdesign وreview وspecs 041–043) دون دمج الفرع.

**التعارضات وحلّها:**
- index.html وsw.js وversion.json وsrc/engine.js وصورة idle-time-390: `--ours` ثم `node build.js`.
- 31-api.js: اتحاد الأسماء (أُضيف tasksBrief). test/all.sh وtest/map.json: اتحاد. CHANGELOG: سطور الطرفين.
- 06q-home-status.js: سطر المنافسين من الأول (ثروته/rvMoney)، وسطر return من الثاني (tkHomeRow).

**انحراف عن الخطوات:** نقل `docs/review` من فرع التخطيط أعاد `ECONOMY_BASELINE_2610.json` إلى نسخة أقدم (فشل economy-invariants بانحراف 56.8%)؛ أعدتُ نسخة main الأحدث ولم أعدّل الخط المرجعي.

**البصمات:** autopilot-13/18/23 كما في main مع تحديث سطر sourceHash وحده (إذن 2026-11-11)؛ أُعيد التقاط guided-4/8/10 مرة واحدة بـ scripts/capture-homest-off.js (HOMEST.on=false). لم يُضعَّف أي اختبار ولا ثُبّت مفتاح RIVALW/TASKS.

**الحزمة:** الأولى 336 ناجحاً/7 فاشلة (guided-growth/mastery/graduation وautopilot-finance/graduation/year وcelebrate-ui، كلها بصمات متوقعة). بعد التحديث: **343 ناجحاً، 0 فاشل** (1,469 ث). الاختبارات الثلاثة عشر المحددة نجحت.
details-all-ui: أُبقي سماح +900px للمكتب و+60px للرئيسية من 038ب.

**القياس:** art-ui = 4.59 م حرف (الحد 4.7). backup-compress = 3.08 م.ب (الحد 3.2).
**390px:** scrollWidth = 390 = innerWidth (لا تمرير أفقي).
**آخر commit:** انظر `git log -1` على origin/main.
