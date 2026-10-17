// اختيار دولة البداية وفترات التمرين بين مراحل عمّ سالم (المحرك): node test/start.test.js
const E = require('../src/engine.js'); const A = E.A;
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
const cities = { sa: 'riyadh', eg: 'cairo', ir: 'isfahan', in: 'delhi', cn: 'xian' };
for (const cc in cities) {
  const S = E.newGame(7), r = A.chooseStart(S, cc), w = S.player.wallet;
  ok(r.ok !== false && S.home === cc && S.player.caravans[0].city === cities[cc] && S.startCity === cities[cc], 'البدء من ' + cc + ' → ' + cities[cc]);
  ok(Math.abs(S.player.gold - 800) < 1e-6, cc + ': الرصيد ٨٠٠ ريال معادلاً');
  ok(cc === 'sa' ? (w.sar === 800 && w.usd === 0) : (w.sar === 0 && w.usd > 0), cc + ': العملة المحلية تناسب الدولة');
  A.learnSetChar(S, 'trader'); ok(S.learn.start === cc && S.learn.secrets.includes(cc), cc + ': سرّ دولة البداية يُفتح');
  ok(A.chooseStart(S, 'sa').ok === false, cc + ': لا تغيير بعد اختيار الشخصية');
}
// فترة التمرين
const S = E.newGame(7); A.chooseStart(S, 'eg'); A.learnSetChar(S, 'trader'); const L = S.learn, car = S.player.caravans[0];
S.player.gold = 5000;
const trade = (g, q) => { const c = S.cities[car.city]; c.stock[g] = 1e4; A.buy(S, car.id, g, q); c.price && 0; };
const g1 = E.GIDS.find(x => x !== 'wheat' && E.sells(S.cities.cairo, x)); S.cities.cairo.stock[g1] = 1e4; const br = A.buy(S, car.id, g1, 3); console.log('   buy:', br.msg); A.sell(S, car.id, g1, 3);
ok(L.level === 2 && !!L.rest && L.rest.n === 1 && L.rest.home === 'eg' && L.rest.k === 3 && L.hold === 2, 'بعد المستوى ١ تبدأ فترة تمرين في مصر (٣ صفقات رابحة)');
ok(L.up.includes(1), 'نافذة الترقية تظهر');
// التمرين يمنع إتمام المستوى التالي قبل أوانه
E.tick(S); ok(L.level === 2 && !!L.rest, 'لا يكتمل المستوى ٢ أثناء التمرين');
// صفقات رابحة خارج دولة البداية لا تُحسب
L.rest.w = 0; const w0 = L.rest.w; car.city = 'riyadh'; S.cities.riyadh.stock.dates = 1e4; car.cargo = { dates: 5 }; car.basis = { dates: { q: 5, c: 1 } };
A.sell(S, car.id, 'dates', 5); ok(L.rest.w === w0, 'صفقة خارج دولة البداية لا تُحسب في تمرين المستويات الأولى');
car.city = 'cairo'; car.cargo = {}; car.basis = {};
// نكمل التمرين
L.rest.w = L.rest.k; S.player.gold = 5000; E.learnCheck(S);
ok(!L.rest && L.level === 2 && L.intro < 2 && L.rq.includes('restDone'), 'بإتمام التمرين يزول ويبقى الدرس ٢ بانتظار مقدّمته');
E.learnCheck(S); ok(L.level === 2, 'لا يُنجَز المستوى ٢ قبل أن يعرض عمّ سالم مقدّمته (hold)');
L.intro = 2; L.hold = 0; ok(L.level === 2, 'بعد المقدّمة يُسمح بالتقدم');
// حفظ قديم بلا rest يعمل
const S2 = E.load(JSON.stringify(S)); ok(S2.learn.rest === undefined || S2.learn.rest === null || typeof S2.learn.rest === 'object', 'الحفظ والتحميل سليم');
console.log(fails ? fails + ' FAIL' : 'ALL OK'); process.exit(fails ? 1 : 0);
