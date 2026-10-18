// قصص الزعماء وأسرار الأسواق في المحرك: node test/lore.test.js
const E = require('../src/engine.js'); const A = E.A;
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
const mk = () => { const S = E.newGame(21); A.learnSetChar(S, 'trader'); S.learn.level = 3; return S; };
let S = mk(), L = S.learn;
ok(L.cv.riyadh === 1 && Array.isArray(L.bq) && Array.isArray(L.csq), 'حالة الحكايات والأسرار تُهيَّأ مع اللعبة');
E.loreCheck(S); ok(L.lore.riyadh === 1 && L.bq.length === 1 && L.bq[0].c === 'riyadh' && L.bq[0].n === 1, 'الفصل ١ عند أول وصول إلى مدينة الزعيم');
E.loreCheck(S); ok(L.bq.length === 1, 'لا فتح مكرر');
ok(L.lore.jeddah == null || L.lore.jeddah === 0, 'مدينة لم تُزر لا فصل لها');
// تحت المستوى ٣ لا شيء
let S2 = E.newGame(21); A.learnSetChar(S2, 'trader'); E.loreCheck(S2); ok((S2.learn.bq || []).length === 0, 'قبل المستوى ٣ لا إشعارات');
// فصل ٢: بعد هدية
S.phase = 2; S.player.gold = 50000; const r = A.gift(S, 'riyadh'); ok(r.ok !== false, 'هدية للزعيم: ' + r.msg);
E.loreCheck(S); ok(L.lore.riyadh === 2 && L.bq.length === 2, 'الفصل ٢ بعد الهدية');
// فصل ٣: بعد عقد أو ثقة ٣٥
S.bosses.riyadh.trust = 40; E.loreCheck(S); ok(L.lore.riyadh === 3, 'الفصل ٣ عند ثقة ٣٥');
// أثر الطبع: كريم (جدة) هديته +٩، الرياض (صبور) +٦
const t0 = S.bosses.jeddah.trust; S.bosses.jeddah.gift = -99; A.gift(S, 'jeddah'); ok(S.bosses.jeddah.trust - t0 === 9, 'الكريم: الهدية +٩');
const t1 = S.bosses.riyadh.trust; S.bosses.riyadh.gift = -99; A.gift(S, 'riyadh'); ok(Math.round(S.bosses.riyadh.trust - t1) === 6, 'الصبور: الهدية +٦');
// سرّ السوق: زيارتان ومبيعات ١٠٠٠
S = mk(); L = S.learn; L.cv.riyadh = 2; L.cs.riyadh = 999; E.loreCheck(S); ok(!L.csec.includes('riyadh'), 'تحت شرط المبيعات لا سرّ');
L.cs.riyadh = 1500; E.loreCheck(S); ok(L.csec.includes('riyadh') && L.csq[0] === 'riyadh', 'سرّ السوق يُفتح بالزيارات والمبيعات');
ok(L.perks.buy_riyadh === 0.98, 'ميزة السوق: الشراء أرخص ٢٪');
const c = S.cities.riyadh, g = 'wool'; S.learn.perks.buy_riyadh = 1; const q1 = E.quoteBuy(S, 'riyadh', g, 5).cost; S.learn.perks.buy_riyadh = 0.98; const q2 = E.quoteBuy(S, 'riyadh', g, 5).cost;
ok(q2 < q1 && Math.abs(q2 / q1 - 0.98) < 0.01, 'الخصم يظهر في التسعير: ' + (q2 / q1).toFixed(3));
// المبيعات تُسجَّل من البيع الحقيقي
S = mk(); L = S.learn; S.player.gold = 5000; const car = S.player.caravans[0]; A.buy(S, car.id, 'wool', 20); const sr = A.sell(S, car.id, 'wool', 20); ok(sr.ok !== false && L.cs.riyadh > 0, 'مبيعات المدينة تُحسب من البيع: ' + Math.round(L.cs.riyadh || 0));
// حفظ قديم بلا الحقول
S = mk(); delete S.learn.lore; delete S.learn.cv; delete S.learn.bq; const S3 = E.load(JSON.stringify(S)); ok(!!S3.learn.lore && !!S3.learn.bq && !!S3.learn.csq, 'ترحيل الحفظ القديم');
// كل زعيم له حكاية وكل مدينة لها سرّ (ما تم تسليمه)
const missing = E.BOSS_NAMES ? Object.keys(E.BOSS_NAMES).filter(id => !E.LORE.BOSS_LORE[id]) : [];
console.log('   ℹ️ زعماء بلا حكاية بعد: ' + (missing.join(',') || 'لا أحد'));
for (const id in E.LORE.BOSS_LORE) { const lo = E.LORE.BOSS_LORE[id]; ok(lo.ch.length === 3 && E.LORE.STYLES[lo.style] && lo.tip && lo.likes && lo.dislikes && E.LORE.CITY_SECRETS[id] && S.cities[id], 'اكتمال بيانات ' + id); }
console.log(fails ? fails + ' FAIL' : 'ALL OK'); process.exit(fails ? 1 : 0);
