# تقرير 048 — تراك «تكبر» (الأمين، 2026-11-12)

**الحالة:** منفّذة T1–T7. الحزمة الكاملة لم تُشغَّل (فرع جلسة).

## ما فُعل
- **§0 تحقق:** `index.html` يحوي `cutouts/hero/c_trader_mid`؛ `charArtStage`/`bossArtStage` وحدودهما بلا تغيير. لا ربط ولا نقل مفاتيح.
- **الحذف:** 34 ملفاً محجوباً (`hero/` 16 + `boss/` 18) = **611,768 بايتاً**، `git rm`. الجرد طابق المتوقع تماماً.
- **الاعتماد المباشر:** موضع واحد فقط `ART['hero/guard']` في `10-screen-lords.js:3` صار `art('hero/guard')`. فُحصت كل مواضع `ART[` الأخرى (لا بناء ديناميكي لمفاتيح hero/boss؛ `ART[key]` في `bossPortrait` مفتاحه `expressions/boss/...`).
- `brand/inline.json` أُعيد توليده (20 مفتاحاً) ثم `node build.js`؛ `sw.js` لم يذكر مساراً محذوفاً.
- **الحارس:** `test/art-shadow.test.js` (أ ظلال فارغة، ب لا مفتاح hero/boss حرفي معلّق، ج لا `ART['hero|boss/..']` لمفتاح له نظير في cutouts)؛ مسجّل في `map.json` (`04-header` و`10-screen-lords` و`00-state` بالاشتراك) و`all.sh`.
- **لحظتا الانتقال:** `AGEMOM={on:true}` والنصان في `LIFE_TEXTS.ageMoment` والحلقة حرفاً من §3 في `checkLifeEvents`؛ مُصدَّر في `31-api.js`. مثبّت `false` في `skill` و`skill-b` وفي `capture-homest-off.js`.
- `aging-art.test.js` توسّع بثلاثة تحققات (40، 70، حفظ بعمر 75 بلا أخبار، والمطفأ بلا `ageMoments`).
- CHANGELOG: السطران من §4. بند ب1 في ملف المسح مصحَّح مسبقاً (سطر المنسّق).

## «لا صوري»
الخبران سرديان يشرحان تغيّر الصورة فقط؛ لا ادّعاء أثر في الأرقام ولا مال ولا حكم ولا نص ديني. بلا رسم ولا أيقونة جديدة.

## الأرقام
- حجم `index.html`: 3,638,738 ← 3,637,592 بايتاً (الصور المحذوفة كانت خارجية فلا يتغير كثيراً)؛ ملفات `brand/img/` أقل بـ611,768 بايتاً.

## الاختبارات (منفردةً، ناجحة)
art-shadow، aging-art، art-ui، page-budget، icons، skill، skill-b، home-status-ui، details-all-ui، aging، characters، learn، lifecycle-ui (لا اختبار `legacy`). `node test/run.js --changed` يختار الحزمة كلها لأن `29-aging.js` و`00-state.js` مصنَّفان «shared» في `map.json`؛ فاكتفيتُ بالمجموعة المحددة في أمر القسم أعلاه (كلها ناجحة). **الحزمة الكاملة لم تُشغَّل، ولم تُعد التقاط الثوابت.**
