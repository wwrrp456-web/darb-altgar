// التكاثر في القطيع الماشي: ذكور وإناث وصغار: node test/breed.test.js
const E = require('../src/engine.js'), A = E.A;
require('./lib/legacy-market.js')(E);
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
const fresh = seed => { const S = E.newGame(seed || 3); for (let i = 0; i < 20; i++) E.tick(S); S.player.gold = 90000; const car = S.player.caravans[0]; A.hireHerder(S, car.id); A.hireHerder(S, car.id); A.hireHerder(S, car.id); return { S, car }; };
const travel = (S, car, days) => { car.left = days; car.total = days; car.dest = 'jeddah'; car.from = 'riyadh'; car.hungry = false; };
let { S, car } = fresh();
A.buy(S, car.id, 'sheep', 30, 'herd'); const x0 = E.hxOf(car, 'sheep');
ok(Math.abs(x0.m - 8) <= 1 && E.malesOf(car, 'sheep') >= 5, 'الشراء يأتي بذكور وإناث (ذكور ' + Math.round(x0.m) + ' من 30)');
const one = fresh(); A.buy(one.S, one.car.id, 'sheep', 1, 'herd'); ok(E.malesOf(one.car, 'sheep') === 0, 'رأس واحد = أنثى (لا ذكر)');
// لا تكاثر والقافلة واقفة
for (let i = 0; i < 30; i++) E.tick(S); ok(E.youngOf(car, 'sheep') === 0, 'لا تكاثر والقافلة واقفة');
// تكاثر في الطريق
travel(S, car, 40); car.supplies = 999; S.player.gold = 99999; for (let i = 0; i < 30; i++) E.tick(S);
ok(E.youngOf(car, 'sheep') > 1, 'تكاثر على الطريق: صغار ' + E.youngOf(car, 'sheep').toFixed(1));
ok(E.herdUnits(car) > 30, 'الصغار يحتلون نصف وحدة من السعة (' + E.herdUnits(car).toFixed(1) + ')');
ok(E.fodderDay(car) > 30 * E.GD.sheep.fod, 'الصغار يأكلون نصف علف');
const nw1 = E.netWorth(S); car.hx.sheep.y += 10; ok(E.netWorth(S) > nw1 + 300, 'الصغار في الثروة بنصف قيمتهم');
// النضج
const M = fresh(); const mc = M.car; A.buy(M.S, mc.id, 'sheep', 10, 'herd'); E.hxOf(mc, 'sheep').y = 8; travel(M.S, mc, 100); mc.supplies = 999; M.S.player.gold = 99999;
const a0 = mc.herd.sheep; for (let i = 0; i < 60; i++) E.tick(M.S); ok(mc.herd.sheep > a0 + 3, 'الصغار يكبرون ويصيرون بالغين (' + a0 + ' ← ' + mc.herd.sheep.toFixed(1) + ')');
// بلا ذكر: لا ولادة
const N = fresh(); const nc = N.car; A.buy(N.S, nc.id, 'sheep', 10, 'herd'); E.hxOf(nc, 'sheep').m = 0; travel(N.S, nc, 60); nc.supplies = 999; N.S.player.gold = 99999; for (let i = 0; i < 50; i++) E.tick(N.S);
ok(E.youngOf(nc, 'sheep') === 0, 'بلا ذكر لا ولادة');
// الجوع يمنع
const H = fresh(); const hc = H.car; A.buy(H.S, hc.id, 'sheep', 20, 'herd'); travel(H.S, hc, 60); hc.hungry = true; hc.supplies = 0; H.S.player.gold = 99999; for (let i = 0; i < 30; i++) { hc.hungry = true; E.tick(H.S); }
ok(E.youngOf(hc, 'sheep') === 0, 'القافلة الجائعة لا تلد مواشيها');
// السعة تمنع
const C = fresh(); const cc = C.car; cc.herders = 1; A.buy(C.S, cc.id, 'sheep', 20, 'herd'); travel(C.S, cc, 120); cc.supplies = 999; C.S.player.gold = 99999; for (let i = 0; i < 80; i++) E.tick(C.S);
ok(E.herdUnits(cc) <= E.herdCap(cc) + 1.5, 'لا ولادة فوق سعة الرعاة (' + E.herdUnits(cc).toFixed(1) + ' ≤ ' + E.herdCap(cc) + ')');
// بيع الصغار بنصف السعر
const B = fresh(); const bc = B.car; A.buy(B.S, bc.id, 'sheep', 10, 'herd'); E.hxOf(bc, 'sheep').y = 6; const price = E.unitPrice(B.S.cities[bc.city], 'sheep'); const g0 = B.S.player.gold;
const sy = A.sellYoung(B.S, bc.id, 'sheep', 4); ok(sy.ok && sy.n === 4 && Math.abs(E.youngOf(bc, 'sheep') - 2) < 1e-9 && sy.net < price * 4 * 0.6 && sy.net > price * 4 * 0.3, 'بيع الصغار بنحو نصف السعر (' + Math.round(sy.net) + ' مقابل ' + Math.round(price * 4) + ')');
ok(!A.sellYoung(B.S, bc.id, 'goat', 1).ok, 'لا صغار منها');
// بيع البالغين يحافظ على نسبة الذكور
const R = fresh(); const rc = R.car; A.buy(R.S, rc.id, 'sheep', 20, 'herd'); const m0 = E.hxOf(rc, 'sheep').m; A.sell(R.S, rc.id, 'sheep', 10, 'herd');
ok(Math.abs(E.hxOf(rc, 'sheep').m - m0 / 2) < 0.51 && rc.herd.sheep === 10, 'البيع يُبقي نسبة الذكور (' + E.hxOf(rc, 'sheep').m.toFixed(1) + ')');
// ترحيل قطيع قديم بلا hx
const O = fresh(); const oc = O.car; oc.herd = { sheep: 20 }; delete oc.hx; ok(E.malesOf(oc, 'sheep') === 5 || (E.hxOf(oc, 'sheep'), E.malesOf(oc, 'sheep') === 5), 'قطيع قديم بلا تفاصيل: ربعه ذكور');
const L = E.load(E.save(S)); ok(L.player.caravans[0].hx && Math.abs(L.player.caravans[0].hx.sheep.y - car.hx.sheep.y) < 1e-9, 'الحفظ والتحميل يبقي الصغار');
const st = E.stressTest({ seeds: 8, days: 100, bot: true }); ok(st.nan === 0, 'الضغط بلا NaN');
console.log(fails ? '\nFAILED ' + fails : '\nكلها نجحت'); process.exit(fails ? 1 : 0);
