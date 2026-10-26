// اقتصاد الدكان: دكان بسلع مناسبة وسعر افتراضي يربح ربحاً معقولاً بعد الأجور والصيانة (محرك): node test/shopecon.test.js
const E = require('../src/engine.js'), A = E.A;
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
function run(city, days, n = 1) {
  const S = E.newGame(5); A.learnSetChar(S, 'trader'); S.noLock = 1; S.phase = 2; S.player.gold = 400000; S.noShocks = true; S.noEvents = true; S.player.caravans[0].city = city;
  const c = S.cities[city], goods = E.GIDS.filter(g => E.sells(c, g) && !E.GD[g].sp && !E.GD[g].live).sort((a, b) => c.dem[b] * E.unitPrice(c, b) - c.dem[a] * E.unitPrice(c, a)).slice(0, 4);
  let cost = 0; for (let i = 0; i < n; i++) { const g0 = S.player.gold; A.buildShop(S, city); cost += g0 - S.player.gold; }
  E.shopsOf(S, city).forEach(sh => goods.forEach(g => A.shopSetItem(S, city, sh.id, g, E.SHOP_PRICE0, true))); A.hireFill(S, city);
  for (let d = 0; d < days; d++) { E.tick(S); S.pause = false; }
  return { S, pn: E.shopPnl(S, city, 30), staff: E.staffOf(S, city).length, cost, prosper: E.shopProsper(c) };
}
// الاقتصاد نسبي: الدخل ينشأ من فرق الجملة والتجزئة وازدهار المدينة، وليس من مبالغ مثبّتة
ok(E.SHOP_PRICE0 === 1.8 && E.RETAIL_BASE === 1.5 && E.SHOP_DEMAND >= 1, 'ثوابت الاقتصاد: السعر الافتراضي 180٪ وطلب الدكان ×' + E.SHOP_DEMAND);
const cities = ['riyadh', 'cairo', 'delhi', 'jeddah', 'aswan'], R = {};
for (const city of cities) {
  const r = run(city, 90); R[city] = r; const net = r.pn.net * 30;
  ok(r.pn && r.pn.days === 30, city + ': سجل الربح يحتفظ بآخر 30 يوماً');
  ok(net > 0 && Number.isFinite(net), city + ': الدكان يربح بعد الأجور والصيانة (' + Math.round(net) + ' شهرياً)');
  ok(r.pn.net <= r.pn.rev && r.pn.net / r.pn.rev > 0.05 && r.pn.net / r.pn.rev < 0.8, city + ': هامش صافٍ معقول من الإيراد (' + Math.round(100 * r.pn.net / r.pn.rev) + '٪)');
  ok(r.cost / net <= 12, city + ': يسترد تكلفة بنائه خلال سنة (' + (r.cost / net).toFixed(1) + ' شهر)');
  ok(r.staff === 1, city + ': بائع واحد يكفي الدكان');
}
{ const by = cities.slice().sort((a, b) => R[a].prosper - R[b].prosper), lo = by[0], hi = by[by.length - 1];
  ok(R[hi].pn.net > R[lo].pn.net, 'المدينة الأكثر ازدهاراً (' + hi + ') تربح أكثر من الأقل (' + lo + ')'); }
{ const n1 = run('riyadh', 90, 1).pn.net, n2 = run('riyadh', 90, 2).pn.net, n3 = run('riyadh', 90, 3).pn.net, n4 = run('riyadh', 90, 4).pn.net;
  ok(n2 > n1 && n3 > n2, 'التوسعة تزيد الدخل: دكان < دكانان < ثلاثة');
  ok(n4 - n3 < n3 - n2 && n4 / 4 < n2 / 2, 'التشبّع: الدكان الرابع يضيف أقل من الثالث، ومتوسط ربح الدكان يهبط مع كثرة الدكاكين'); }
{ const S = E.newGame(5); A.learnSetChar(S, 'trader'); S.noLock = 1; S.phase = 2; S.player.gold = 90000; A.buildShop(S, S.player.caravans[0].city); ok(E.shopPnl(S, S.player.caravans[0].city, 7) === null, 'قبل أول يوم: لا تقرير ربح'); }
require('./lib/early-qard-report')();
require('./lib/early-qard-ceiling-report')();
console.log(fails ? fails + ' FAIL' : 'ALL OK'); process.exit(fails ? 1 : 0);
