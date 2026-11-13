# تقرير التكامل ت2 (الموجة 1)

- **الالتزام على main بعد git ls-remote:** `03b8692` (يضم الحزم الأربع وإصلاحاتها).
- **المدموج:** 048 (`ccr-25ff26b8-vpwp7e`) ← 036ز2 (`claude/darb-tajjar-trustee-tasks-m6q1fd`) ← 043ب (`claude/sonnet-prosperity-su06t2`) ← 050 (`ccr-80c9aa2a-sezvww`).
- **لم تُدمج 040د:** رسالة آخر التزام على فرعها (`45180e6`) لا تتضمن «إصلاح rvpCap»، فتوقفتُ عند الدمج الخامس كما في الأمر (الازدهار يصلحها).

## التعارضات وحلّها
- `31-api.js`: اتحاد الأسماء (AGEMOM، ثم `dlWin…dnCities`، ثم `rgChiefMonth` وأسماء 050). فاتني `rgChiefMonth` أول مرة فأخفق اختبار brief وأُضيف.
- `test/all.sh` و`test/map.json`: اتحاد؛ `skill` و`skill-b` و`scripts/capture-homest-off.js`: إطفاء `AGEMOM` و`BRIEF` و`BESTM` و`RACE` (و`DELEG` مطفأ سلفاً).
- `CHANGELOG`: سطور الطرفين. المولَّدات: `--ours` ثم `node build.js`.
- بلا علامات تعارض متبقية.

## إصلاح awDmg (حكم Opus)
في `src/engine/24g3-deleg-b.js` صارت `dmg` تُحسب بـ`actualDamage(S, {customsGiven, marginLost}, {round: true}).total`؛ اختبار `deleg-b` (القيمة تساوي `ag.hist[-1].dmg`) ناجح.

## إصلاح إضافي خارج الأمر
اختبار `numerals` أخفق بعد دمج 050: `src/ui/06s-brief.js` كان يستعمل الفاصل العربي «٬» (يخالف قاعدة توحيد الأرقام). صار `bfN = fmt` (فاصل «,»)، وعُدّلت توقعات `test/brief-ui.test.js` (6 مواضع).

## البصمات
`node scripts/first-paint-keys.js` ثم `node scripts/refresh-fixtures.js` (مرتان بعد إصلاحين؛ sourceHash وguided بـHOMEST مطفأ). skill وskill-b وautopilot ناجحة بعد آخر تحديث.

## الحزمة الكاملة
- التشغيل الأخير: 369 ناجحاً من 370، والفاشل واحد (`brief`، خطأ `E.rgChiefMonth` غير معرّفة). أُصلح بعدها، وأُعيد تشغيل brief وbrief-ui وrival-wealth وnumerals وskill وskill-b وautopilot منفردةً فنجحت كلها.
- **لم تُعد الحزمة الكاملة بعد إضافة `rgChiefMonth`** (تستغرق نحو 28 دقيقة هنا). اللاتمرير الأفقي على 390px يغطيه اختبارا الواجهة في الحزمة، ولم يظهر فيهما إخفاق.
- حجم `index.html`: 3.78 م.ب (3,776,459 بايت).
