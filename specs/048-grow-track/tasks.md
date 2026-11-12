# مهام 048
- [ ] T1 قراءة: `src/ui/00-state.js:28` (`art`)، `10-screen-lords.js:1–22`، `04-header.js` (`charImg`)، `29-aging.js` (`checkLifeEvents`)، `test/aging-art.test.js`، `scripts/first-paint-keys.js`. تحقق بنفسك من §0 (أن `index.html` يحوي `cutouts/hero/c_trader_mid`) ولا تغيّر `charArtStage`/`bossArtStage`.
- [ ] T2 جرد المُظلَّل بسكربت أحادي (34 ملفاً متوقعة)، وفحص كل `ART[` المباشر في `src/ui` وحوّله إلى `art(`؛ ثم احذف الـ34 بـ`git rm`.
- [ ] T3 `node scripts/first-paint-keys.js` ثم `node build.js`؛ تأكد أن `brand/inline.json` و`sw.js` بلا مفتاح/مسار محذوف.
- [ ] T4 `test/art-shadow.test.js` وتسجيله في `map.json` و`all.sh`.
- [ ] T5 `AGEMOM.on` والنصان في `LIFE_TEXTS.ageMoment` وحلقة `checkLifeEvents` حرفاً من §3؛ تصدير المفتاح في `31-api.js`؛ تثبيته `false` في `skill` و`skill-b` وسكربتات الالتقاط.
- [ ] T6 توسيع `aging-art.test.js` بالتحققات الثلاثة (§4).
- [ ] T7 `node build.js` ثم `node test/run.js --changed`؛ CHANGELOG (سطران)؛ تصحيح ب1 في ملف المسح؛ `report.md` (≤ 40 سطراً) بحجم الصفحة قبل/بعد. ⛔ توقف.
