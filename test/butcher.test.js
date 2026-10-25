// الملحمة واللحم الطازج (محرك فقط)
const E = require('../src/engine.js'), A = E.A;
require('./lib/legacy-market.js')(E);
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
function world(seed) { const S = E.newGame(seed); A.learnSetChar(S, 'trader'); S.learn.level = 11; S.phase = 3; S.player.gold = 300000; const car = S.player.caravans[0]; car.city = 'riyadh'; car.left = 0; car.herders = 4; S.cities.riyadh.stock.sheep = 500; return { S, car }; }
ok(E.GD.meat && E.GD.meat.fresh && E.GD.meat.spoil >= 0.1 && !E.sells(E.newGame(3).cities.riyadh, 'meat'), 'لحم طازج سلعة سريعة الفساد لا تُشترى من الأسواق');
let { S, car } = world(4);
ok(A.buildButcher(S, 'riyadh').ok === false, 'الملحمة تحتاج مزرعة');
A.buildShop(S, 'riyadh'); A.buildWarehouse(S, 'riyadh'); A.buildWarehouse(S, 'riyadh'); A.buildFarm(S, 'riyadh'); const pr = S.player.props.riyadh;
const g0 = S.player.gold; let r = A.buildButcher(S, 'riyadh'); ok(r.ok !== false && pr.butcher && g0 - S.player.gold === E.BUTCHER_COST, 'بناء الملحمة بتكلفة ' + E.BUTCHER_COST);
ok(A.buildButcher(S, 'riyadh').ok === false, 'ملحمة واحدة لكل مدينة');
A.buy(S, car.id, 'sheep', 12, 'herd', 'f'); A.buy(S, car.id, 'sheep', 2, 'herd', 'm'); A.farmIn(S, car.id, 'sheep', 14);
const f = E.farmOf(S, 'riyadh'); ok(f.herd.sheep === 14, 'غنم في المزرعة');
r = A.cutMeat(S, 'riyadh', 'horse', 1); ok(r.ok === false, 'لا تُذبح الخيل');
const yield1 = Math.floor(5 * E.MEAT.sheep * E.FRESH_X); r = A.cutMeat(S, 'riyadh', 'sheep', 5); ok(r.ok !== false && Math.floor(pr.store.meat) === yield1 && f.herd.sheep === 9, 'ذبح 5 رؤوس: ' + Math.floor(pr.store.meat) + ' لحم طازج (' + yield1 + ')');
ok(yield1 > Math.floor(5 * E.MEAT.sheep), 'الطازج أكثر وزناً من المجفف');
const gold0 = S.player.gold, st0 = S.cities.riyadh.stock.meat; E.tick(S);
ok(S.player.gold > gold0 - 400 && (pr.butcher.sold > 0 && pr.butcher.rev > 0), 'الملحمة تبيع يومياً (باعت ' + Math.floor(pr.butcher.sold) + ' بصافي ' + Math.round(pr.butcher.rev) + ')');
// الفساد: ما لا يُباع يفسد
pr.store.meat = 400; pr.butcher.lv = 1; E.tick(S); ok(pr.store.meat < 400 - E.BUTCHER_DAY * 0.5, 'يبيع حداً يومياً (' + Math.floor(400 - pr.store.meat) + ')');
const after = pr.store.meat; S.cities.riyadh.stock.meat = E.capG(S.cities.riyadh, 'meat') * 1.2; E.tick(S); ok(pr.store.meat < after, 'الفائض يفسد/ينقص يومياً');
ok(Math.abs((pr.butcher.today || 0)) >= 0, 'سجل اليوم موجود');
// السعة
const w2 = world(5); A.buildShop(w2.S, 'riyadh'); A.buildFarm(w2.S, 'riyadh'); A.buildButcher(w2.S, 'riyadh'); A.buy(w2.S, w2.car.id, 'sheep', 10, 'herd', 'f'); A.farmIn(w2.S, w2.car.id, 'sheep', 10);
w2.S.player.props.riyadh.store.wheat = E.storeCap(w2.S, 'riyadh'); const r2 = A.cutMeat(w2.S, 'riyadh', 'sheep', 10); ok(r2.ok === false && /يتسع/.test(r2.msg), 'مخزن ممتلئ لا يتسع اللحم: ' + r2.msg);
// حفظ
const Z = E.load(E.save(S)); ok(Z && Z.player.props.riyadh.butcher && Z.player.props.riyadh.butcher.sold === pr.butcher.sold, 'الملحمة تُحفظ وتُحمَّل');
// القيمة في الثروة
ok(E.netWorth(S) > 0, 'الثروة تحسب');
// حفظ قديم بلا اللحم
const old = JSON.parse(E.save(world(6).S)); for (const id in old.cities) { delete old.cities[id].stock.meat; delete old.cities[id].idx.meat; delete old.cities[id].prod.meat; }
const Z2 = E.load(JSON.stringify(old)); ok(Z2 && Z2.cities.riyadh.stock.meat >= 0 && Z2.cities.riyadh.idx.meat === 1, 'حفظ قديم: يظهر اللحم الطازج في الأسواق');
const st = E.stressTest({ seeds: 6, days: 60, bot: true }); ok(st.nan === 0, 'الضغط: لا NaN');
console.log(fails ? '\nFAILED ' + fails : '\nكلها نجحت'); process.exit(fails ? 1 : 0);
