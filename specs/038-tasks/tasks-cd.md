# مهام 038ج/د (حزمة واحدة، جلسة واحدة؛ بعد دمج 051 في main؛ المواصفة `spec-cd.md`)

**ليست حساسة** (لا مال إلا ميزة الجمارك القائمة، ولا زكاة ولا ضرر ولا حكم). المعادلات في `spec-cd.md` **حرفاً**: لا تجتهد فيها، وأي تعارض مع الشيفرة يُكتب في التقرير ويُسأل عنه Opus.

- [x] T1 **اقرأ:** `spec-cd.md` كاملة، و`texts.md` (القوالب الثمانية و«عبارات 038ج» والألقاب)، ثم الشيفرة: `30i-tasks.js` كله، `06r-tasks.js`، `24f-management.js` (`mgmtCity`، `mgmtNext`)، `06b-team.js` (`promoteWorker`)، `24-advisor-actions.js` (`hireStaff`، `buildShop`، `buildWarehouse`، `buildFarm`، `hireCaptain`)، `30i2-shopcond.js` (`scQuote`، `shopRepair`)، `30h2-influence.js` (`slotsOf`، `agrDay`، `agrSettleExport`)، `29c-identity.js`، `29c-celebrate.js` و`02d-celebrate.js`، و`tools/identity-measure.js`.
- [x] T2 **038ج المفتاح والحالة** (§1): `TASKS.c`، والحقول `seen.ct/kp` و`T.tt/kc` في `tkState` خلف المفتاح، وزرع الحفظ القديم.
- [x] T3 **القوالب الثمانية** (§2): tr5، mg2، mg3، ct1، ct2، bd1، bd3، mg4 بالدوال حرفاً وعلامة `c: 1`؛ المساعدات `tkTrips`، `tkRank`، `tkProps`، `tkCtKind`، `tkCtOpen`، `tkCtAll`، `TKC_ROLE`، `TKC_BD`؛ إضافة `ct` إلى `TASKS.KIND` و`TK_ICON`؛ تصفية `d.c` عند الإطفاء في `tkOffer`؛ إضافة `seen.ct` إلى `tkScan`.
- [x] T4 **خطّاف الوفاء** (§2-د): `ag.ok++; tkNote(S, 'kept', ag.id);` في المواضع العشرة كلها، وفرع `kept` في `tkNote`. **لا تغيير آخر في ملفات `30h2*.js`.**
- [x] T5 **الهوية** (§3): `TKC_ID` والضرب في الوزن، وحقل `id` للمعروض، و« · يناسب شخصيتك» في الواجهة.
- [x] T6 **الألقاب والاحتفال** (§4): `T.kc` في `tkFinish`، المنح بـ`bonusAward(S, 'tkt:'+k, …)`، `task_title` في `CELEBRATE_IDS` و`celebrateKey`، النص والصورة في `02d-celebrate.js`، `tkTitleCel` في `31-api.js`.
- [x] T7 **الواجهة** (§5): `tasksView(S).titles` وسطر الرأس (في `tkTopHTML` من 051)؛ بلا مكوّن ولا قائمة منسدلة ولا أيقونة جديدة.
- [x] T8 **اختبارات 038ج** (§7: 1–9) و`tasks-ui` و`test/map.json`؛ `node build.js` ثم `node test/run.js --changed`.
- [x] T9 **038د الأداة** (§6-أ): `tools/tasks-tune.js`، وتشغيلها، وتطبيق قواعد §6-ج بالترتيب، وإعادة القياس مرة؛ الخرج `tune-d.json` و`tune-d.md`، والقيم النهائية في `TASKS` بتعليق `// 038د: tune-d.md`. إن `W > 0.10` بعد القاعدة 5: توقّف واكتب في التقرير.
- [x] T10 **الختام:** `CHANGELOG` (السطران في §8)، علّم T020 وT021 وT030 في `tasks.md` بإحالة إلى هنا، `report-cd.md` (≤ 40 سطراً: جدول «ما يظهر ← الرقم ← أين ← نقرات»، حجم `index.html` قبل وبعد، خلاصة `tune-d.md`، و«الحزمة الكاملة لم تُشغَّل») ⛔

## قواعد
لا `src/engine.js`؛ لا ذهب في أي مكافأة؛ لا نص ديني ولا مهمة تمس الزكاة والعبادات والقروض؛ لا تعديل في معادلات العقود أو الضرر؛ لا إنجاز يُضاف إلى الأربعين؛ `TASKS.c.on=false` = 038أ/ب حرفاً بلا حقل جديد؛ الحفظ القديم يعمل؛ كل اختبار في `all.sh` و`map.json`.
