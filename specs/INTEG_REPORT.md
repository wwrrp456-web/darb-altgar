# تقرير التكامل: 040ز + 042 ⛔ متوقف بلا دفع

**دُمج** (دمج عادي --no-ff فوق main `a4aefbf`): `ccr-00333b25-knm02e` (040ز إنفاق الصندوق) ثم `package-042-home-status` (042 حال أعمالي). الفرع المحلي `integ`، ولم يُدفع شيء إلى main.

**التعارضات**: دمج 040ز نظيف. في دمج 042: `index.html` و`sw.js` و`version.json` و`src/engine.js` أُعيد توليدها بـ`node build.js`؛ سطر `API` في `31-api.js` أُبقي الطرفان؛ `test/map.json` و`test/all.sh` وCHANGELOG أُبقي الطرفان؛ `skill.test.js` و`skill-b.test.js` جُمعت حراسة `MFUND.spend=false` مع `HOMEST.on=false` وتأكيد 042.

**تعديلات الاختبارات**: الحراسة المذكورة فقط؛ لا خطوط مرجعية حُدّثت.

**الحزمة الكاملة**: الناجح 330، الفاشل 9 (1697 ث).
- ✗ `details-all-ui`: «أخطاء JS: home: Cannot read properties of undefined (reading 'next')».
- ✗ `home-status-ui`: «390 نافذة 1: null». **السبب لهما (خلل تكامل حقيقي):** `hsFundBody` في `src/ui/06q-home-status.js:18` تستدعي `fundSpendHTML(f.city)` بوسيط واحد، وتوقيعها في `06g-prosperity.js` هو `(id, v)` فيقع TypeError عند `v.next` حين يوجد `E.A.fundSpend` (أي بعد دمج 040ز).
- ✗ بصمات متوقعة: `guided-growth` `guided-mastery` `guided-graduation` `autopilot-finance` `autopilot-graduation` `autopilot-year` `celebrate-ui`. لم أُعد التقاطها لأن إخفاقاً حقيقياً قائم؛ تُعاد بعد إصلاحه.
- لم تُفحص حدود art-ui وbackup-compress بعد (الحزمة لا تُحسم قبل الإصلاح).

**البند 5**: لا. نافذة سطر الصندوق في «حال أعمالي» لا تعرض واجهة «أنفق الآن» للحاكم، بل تنهار بالخطأ أعلاه لأن `fundSpendHTML` تُستدعى دون `v` (يلزم تمرير `E.fundView(S, f.city)` أو ما يعادله). لم أعدّل شيفرة لأجله.

**البند 6** (تمرير أفقي 390px): لم يُتحقق منه كاملاً؛ نتائج اختبارات 390 الأخرى ناجحة عدا ما سبق.

**آخر commit على main**: `a4aefbf` (لم يتغير). آخر commit في `integ` المحلي: دمج 042.
