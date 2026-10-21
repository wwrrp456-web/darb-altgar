// المواسم المربوطة بالتاريخ الهجري والميلادي: node test/seasons.test.js
const E = require('../src/engine.js'), A = E.A, C = E.CAL;
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
function world(seed, lv) { const S = E.newGame(seed); A.learnSetChar(S, 'trader'); S.learn.level = lv == null ? 6 : lv; S.player.gold = 50000; E.dateOf(S, 0); return S; }
const H = (S, m, d) => E.dayOfHijri(S, m, d, 0), G = (S, y, m, d) => C.gregToJd(y, m, d) - S.cal.jd0;
let S = world(8);
const at = (m, d) => E.seasonAt(S, H(S, m, d)), has = (m, d, k) => E.seasonsAt(S, H(S, m, d)).includes(k);
// المواعيد المعتمدة
ok(at(9, 1) === 'ramadan' && at(9, 29) === 'ramadan' && !has(8, 29, 'ramadan') && !has(10, 1, 'ramadan'), 'رمضان من ١ إلى ٣٠ رمضان');
ok(has(10, 1, 'fitr') && has(10, 3, 'fitr') && !has(10, 4, 'fitr') && !has(9, 29, 'fitr'), 'عيد الفطر من ١ إلى ٣ شوال');
ok(has(8, 16, 'shaban') && !has(8, 15, 'shaban') && has(8, 29, 'shaban'), 'استعداد رمضان في النصف الثاني من شعبان');
ok(has(11, 1, 'ukaz') && has(11, 20, 'ukaz') && !has(11, 21, 'ukaz') && !has(10, 30, 'ukaz'), 'عكاظ من ١ إلى ٢٠ ذي القعدة');
ok(has(11, 20, 'majanna') && has(11, 29, 'majanna') && !has(11, 19, 'majanna') && !has(12, 1, 'majanna'), 'مجنّة من ٢٠ إلى آخر ذي القعدة');
ok(has(12, 1, 'majaz') && has(12, 8, 'majaz') && !has(12, 9, 'majaz'), 'ذو المجاز من ١ إلى ٨ ذي الحجة');
ok(has(12, 8, 'hajj') && has(12, 13, 'hajj') && !has(12, 7, 'hajj') && !has(12, 14, 'hajj'), 'الحج من ٨ إلى ١٣ ذي الحجة');
ok(has(12, 10, 'adha') && has(12, 13, 'adha') && !has(12, 9, 'adha'), 'الأضحى من ١٠ إلى ١٣ ذي الحجة');
ok(has(12, 11, 'hajj') && has(12, 11, 'adha') && at(12, 11) === 'adha', 'يتزامن الحج والأضحى ويجتمع أثرهما');
ok(has(7, 1, 'rajab') && has(7, 29, 'rajab') && !has(8, 1, 'rajab'), 'رجب');
ok(E.seasonsAt(S, G(S, 2027, 5, 10)).includes('harvest') && !E.seasonsAt(S, G(S, 2027, 8, 10)).includes('harvest'), 'الحصاد بالتاريخ الميلادي (أبريل إلى يونيو)');
ok(E.seasonsAt(S, G(S, 2027, 1, 10)).includes('winter') && E.seasonsAt(S, G(S, 2026, 12, 20)).includes('winter') && !E.seasonsAt(S, G(S, 2027, 4, 10)).includes('winter'), 'الشتاء بالتاريخ الميلادي (ديسمبر إلى فبراير)');
{ const r = H(S, 9, 1), q = H(S, 12, 8); ok(q - r > 60 && q - r < 120 || r - q > 250, 'الحج بعد رمضان بنحو ثلاثة أشهر (' + (q - r) + ')'); }
// الحالة والمضاعفات
S.day = H(S, 9, 6); ok(E.seasonNow(S) && E.seasonNow(S).k === 'ramadan' && E.seasonNow(S).left === 25, 'رمضان قائم وباقٍ 25');
ok(E.seasonMul(S, S.cities.riyadh, 'dates') === 1.3 && E.seasonMul(S, S.cities.delhi, 'dates') === 1 && E.seasonMul(S, S.cities.riyadh, 'iron') === 1, 'مضاعف الطلب بحسب الدولة والسلعة');
S.day = H(S, 12, 11); ok(Math.abs(E.seasonMul(S, S.cities.riyadh, 'sheep') - 1.3) < 1e-9 && Math.abs(E.seasonMul(S, S.cities.mecca, 'wheat') - 1.35 * 1.2) < 1e-9 && E.seasonMul(S, S.cities.delhi, 'sheep') === 1, 'الأضحى للأنعام والحج للأقوات (بتعزيز مكة)');
S.day = H(S, 9, 1) - 3; ok(E.seasonNext(S) && E.seasonNext(S).k === 'ramadan' && E.seasonNext(S).in === 3, 'يظهر الموسم القادم قبل 3 أيام');
S.day = H(S, 11, 10); ok(E.seasonMul(S, S.cities.mecca, 'leather') > 1 && E.seasonMul(S, S.cities.riyadh, 'leather') === 1, 'عكاظ في الحجاز فقط');
{ const cal = E.seasonCalendar(S); ok(cal.length >= 8 && cal[0].now && cal.every((x, i) => i === 0 || x.in >= cal[i - 1].in) && cal.some(x => x.k === 'hajj' && x.in > 0 && x.jd > 0), 'تقويم المواسم القادمة مرتب'); }
// الطلب فعلاً يرتفع
function dem(f) { const T = world(9); T.noShocks = false; T.day = f(T) - 1; E.tick(T); return T.cities.riyadh.dem.dates; }
const dr = dem(T => H(T, 9, 5)), dn = dem(T => H(T, 3, 10)); ok(dr > dn * 1.25 && dr < dn * 1.35, 'طلب التمر في رمضان أعلى (' + dn.toFixed(2) + '→' + dr.toFixed(2) + ')');
// إشعارات
S = world(10); S.day = G(S, 2027, 4, 15) - 4; for (let i = 0; i < 6; i++) E.tick(S); ok(S.news.some(n => /يقترب موسم الحصاد/.test(n.t)), 'إنذار قبل الموسم'); ok(S.news.some(n => /بدأ موسم الحصاد/.test(n.t)), 'خبر بداية الموسم');
S = world(13); S.day = H(S, 11, 1) - 1; E.tick(S); ok(S.news.some(n => /بدأ سوق عكاظ/.test(n.t)) && S.news.some(n => /محاكاة لأسواق العرب الكبرى/.test(n.t)), 'خبر عكاظ ومعه عبارة المحاكاة التاريخية');
// الأشهر الحرم
S = world(14); ok(E.isSacred(S, H(S, 11, 5)) && E.isSacred(S, H(S, 12, 5)) && E.isSacred(S, H(S, 1, 5)) && E.isSacred(S, H(S, 7, 5)) && !E.isSacred(S, H(S, 3, 5)) && !E.isSacred(S, H(S, 9, 5)) && !E.isSacred(S, H(S, 8, 5)), 'الأشهر الحرم: ذو القعدة وذو الحجة ومحرم ورجب');
S.day = H(S, 11, 1) - 1; E.tick(S); ok(S.news.some(n => /دخلت الأشهر الحُرُم/.test(n.t)), 'خبر دخول الأشهر الحرم');
S = world(15); S.day = H(S, 1, 9); E.tick(S); ok(S.news.some(n => /عاشوراء/.test(n.t)), 'خبر عاشوراء');
// خطر الطريق (للاعب فقط، وفي الجزيرة العربية فقط)
{ const T = world(16), sm = (a, b) => E.sacredMul(T, a, b);
  T.day = H(T, 11, 5); ok(sm('riyadh', 'jeddah') === E.SACRED_RISK && sm('riyadh', 'cairo') === 1 && sm('cairo', 'alex') === 1, 'في الأشهر الحرم يهبط الخطر بين مدن الجزيرة فقط');
  T.day = H(T, 3, 5); ok(sm('riyadh', 'jeddah') === 1, 'خارج الأشهر الحرم لا تخفيض');
  const B2 = E.newGame(18); B2.day = H(T, 11, 5); ok(E.sacredMul(B2, 'riyadh', 'jeddah') === 1, 'للروبوتات لا أثر');
  const L = world(19, 3); L.day = H(T, 11, 5); ok(E.sacredMul(L, 'riyadh', 'jeddah') === 1, 'قبل المستوى 4 لا أثر'); }
// بلا تعلّم أو قبل المستوى 4: لا مواسم (معيار الضغط)
const B = E.newGame(11); B.day = H(world(11), 9, 5); ok(E.seasonNow(B) === null && E.seasonMul(B, B.cities.riyadh, 'dates') === 1, 'بلا شخصية: لا مواسم');
const L3 = world(12, 3); L3.day = H(L3, 9, 5); ok(E.seasonNow(L3) === null, 'قبل المستوى 4: لا مواسم');
// حول الزكاة بالتاريخ الهجري
{ const T = world(17); const len = E.hawlLen(T, 0); ok(len === 354 || len === 355, 'حول من اليوم الأول ' + len);
  const d0 = E.dateOf(T, 0), dEnd = E.dateOf(T, len); ok(dEnd.h.m === d0.h.m && dEnd.h.d === d0.h.d && dEnd.h.y === d0.h.y + 1, 'الحول يتم بالتاريخ الهجري نفسه بعد سنة');
  let a = 0, b = 0; for (let s = 0; s < 800; s += 7) { const l = E.hawlLen(T, s); if (l === 354) a++; else if (l === 355) b++; } ok(a > 0 && b > 0 && a + b === Math.ceil(800 / 7), 'يتراوح بين ٣٥٤ و٣٥٥'); }
console.log(fails ? '\nFAILED ' + fails : '\nكلها نجحت'); process.exit(fails ? 1 : 0);
