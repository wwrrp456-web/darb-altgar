// اقتصاد الدكان: دكان بسلع مناسبة وسعر افتراضي يربح ربحاً معقولاً بعد الأجور والصيانة (محرك): node test/shopecon.test.js
const E = require('../src/engine.js'), A = E.A;
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
function run(city, days) {
  const S = E.newGame(5); A.learnSetChar(S, 'trader'); S.phase = 2; S.player.gold = 200000; S.noShocks = true; S.noEvents = true; S.player.caravans[0].city = city;
  A.buildShop(S, city); const sh = E.shopsOf(S, city)[0], c = S.cities[city];
  const goods = E.GIDS.filter(g => E.sells(c, g) && !E.GD[g].sp && !E.GD[g].live).sort((a, b) => c.dem[b] * E.unitPrice(c, b) - c.dem[a] * E.unitPrice(c, a)).slice(0, 4);
  goods.forEach(g => A.shopSetItem(S, city, sh.id, g, E.SHOP_PRICE0, true)); A.hireFill(S, city);
  for (let d = 0; d < days; d++) { E.tick(S); S.pause = false; }
  return { S, pn: E.shopPnl(S, city, 30), staff: E.staffOf(S, city).length };
}
ok(E.SHOP_PRICE0 === 1.8 && E.RETAIL_BASE === 1.5 && E.SHOP_DEMAND >= 3, 'ثوابت الاقتصاد: السعر الافتراضي 180٪ وطلب الدكان ×' + E.SHOP_DEMAND);
const monthly = {};
for (const [city, min] of [['riyadh', 12000], ['cairo', 8000], ['delhi', 10000], ['jeddah', 6000]]) {
  const r = run(city, 90); ok(r.pn && r.pn.days === 30, city + ': سجل الربح يحتفظ بآخر 30 يوماً');
  monthly[city] = r.pn.net * 30; ok(monthly[city] >= min && monthly[city] <= 45000, city + ': صافي الربح الشهري بين ' + min + ' و45000 بعد التكلفة والأجور (' + Math.round(monthly[city]) + ')');
  ok(r.staff === 1, city + ': بائع واحد يكفي الدكان');
}
{ const r = run('aswan', 60); const m = r.pn.net * 30; ok(m > 500 && m < monthly.riyadh * 0.5, 'مدينة أقل ازدهاراً (أسوان) تربح أقل بكثير: ' + Math.round(m) + ' شهرياً مقابل ' + Math.round(monthly.riyadh) + ' في الرياض'); }
{ const S = E.newGame(5); A.learnSetChar(S, 'trader'); S.phase = 2; S.player.gold = 90000; A.buildShop(S, S.player.caravans[0].city); ok(E.shopPnl(S, S.player.caravans[0].city, 7) === null, 'قبل أول يوم: لا تقرير ربح'); }
console.log(fails ? fails + ' FAIL' : 'ALL OK'); process.exit(fails ? 1 : 0);
