// المواسم: node test/seasons.test.js
const E = require('../src/engine.js'), A = E.A;
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
function world(seed, lv) { const S = E.newGame(seed); A.learnSetChar(S, 'trader'); S.learn.level = lv == null ? 6 : lv; S.player.gold = 50000; return S; }
ok(E.seasonAt(0) === null && E.seasonAt(35) === 'harvest' && E.seasonAt(210) === 'ramadan' && E.seasonAt(235) === 'eid' && E.seasonAt(300) === 'winter' && E.seasonAt(35 + 354) === 'harvest', 'تقويم السنة');
let S = world(8); S.day = 205; ok(E.seasonNow(S) && E.seasonNow(S).k === 'ramadan' && E.seasonNow(S).left === 25, 'رمضان قائم وباقٍ 25');
ok(E.seasonMul(S, S.cities.riyadh, 'dates') === 1.3 && E.seasonMul(S, S.cities.delhi, 'dates') === 1 && E.seasonMul(S, S.cities.riyadh, 'iron') === 1, 'مضاعف الطلب بحسب الدولة والسلعة');
S.day = 197; ok(E.seasonNext(S) && E.seasonNext(S).k === 'ramadan' && E.seasonNext(S).in === 3, 'يظهر الموسم القادم قبل 3 أيام');
// الطلب فعلاً يرتفع
function dem(day) { const T = world(9); T.noShocks = false; T.day = day; E.tick(T); return T.cities.riyadh.dem.dates; }
const dr = dem(204), dn = dem(100); ok(dr > dn * 1.25 && dr < dn * 1.35, 'طلب التمر في رمضان أعلى (' + dn.toFixed(2) + '→' + dr.toFixed(2) + ')');
// إشعارات
S = world(10); S.day = 24; let found = 0; for (let i = 0; i < 6; i++) E.tick(S); ok(S.news.some(n => /يقترب موسم الحصاد/.test(n.t)), 'إنذار قبل الموسم') ; ok(S.news.some(n => /بدأ موسم الحصاد/.test(n.t)), 'خبر بداية الموسم');
// بلا تعلّم أو قبل المستوى 4: لا مواسم (معيار الضغط)
const B = E.newGame(11); B.day = 205; ok(E.seasonNow(B) === null && E.seasonMul(B, B.cities.riyadh, 'dates') === 1, 'بلا شخصية: لا مواسم');
const L3 = world(12, 3); L3.day = 205; ok(E.seasonNow(L3) === null, 'قبل المستوى 4: لا مواسم');
console.log(fails ? '\nFAILED ' + fails : '\nكلها نجحت'); process.exit(fails ? 1 : 0);
