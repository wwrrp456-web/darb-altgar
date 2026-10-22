// مقارنة دخل القطاعات بعد سنة من رأس مال متساوٍ (محرك): node test/sectors.test.js
// المقياس: التغيّر في صافي الثروة (يشمل الأصول بقيمتها الدفترية) بعد 354 يوماً من 20000 ريال في الطور 3 دون صدمات
const E = require('../src/engine.js'), A = E.A;
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
const START = 20000;
function game() { const S = E.newGame(5); A.learnSetChar(S, 'trader'); S.phase = 3; S.player.gold = START; S.noShocks = true; S.noEvents = true; S.player.caravans[0].city = 'riyadh'; return S; }
function year(S, step) { const w0 = E.netWorth(S); for (let d = 0; d < 354; d++) { if (step) step(S, d); E.tick(S); S.pause = false; } return E.netWorth(S) - w0; }
const R = {};
R.idle = year(game());
R.direct = year(game(), S => { E.botMain(S); });
{ const S = game(); for (let i = 0; i < 3; i++) { A.hireCaptain(S); const car = S.player.caravans[S.player.caravans.length - 1]; car.captain.role = 'indep'; car.captain.home = 'sa'; } R.auto = year(S); }
{ const S = game(), c = S.cities.riyadh, goods = E.GIDS.filter(g => E.sells(c, g) && !E.GD[g].sp && !E.GD[g].live).sort((a, b) => c.dem[b] * E.unitPrice(c, b) - c.dem[a] * E.unitPrice(c, a)).slice(0, 4);
  for (let i = 0; i < 3; i++) A.buildShop(S, 'riyadh'); E.shopsOf(S, 'riyadh').forEach(sh => goods.forEach(g => A.shopSetItem(S, 'riyadh', sh.id, g, E.SHOP_PRICE0, true))); A.hireFill(S, 'riyadh'); R.shops3 = year(S); }
{ const S = game(), c = S.cities.riyadh, goods = E.GIDS.filter(g => E.sells(c, g) && !E.GD[g].sp && !E.GD[g].live).sort((a, b) => c.dem[b] * E.unitPrice(c, b) - c.dem[a] * E.unitPrice(c, a)).slice(0, 4);
  A.buildShop(S, 'riyadh'); const sh = E.shopsOf(S, 'riyadh')[0]; goods.forEach(g => A.shopSetItem(S, 'riyadh', sh.id, g, E.SHOP_PRICE0, true)); A.hireFill(S, 'riyadh'); A.buildWarehouse(S, 'riyadh'); const f = A.buildFactory(S, 'riyadh', 'perfume'); R.factoryOk = f.ok; R.factory = year(S, S => { if (S.day % 5 === 0) A.hireFill(S, 'riyadh'); }); }
console.log('\nالتغيّر في صافي الثروة بعد سنة من 20000 ريال:');
Object.keys(R).filter(k => k !== 'factoryOk').forEach(k => console.log('  ' + k.padEnd(8) + String(Math.round(R[k])).padStart(10) + '   ×' + (R[k] / Math.max(1, Math.abs(R.direct))).toFixed(1) + ' من التجارة المباشرة'));
Object.keys(R).forEach(k => ok(k === 'factoryOk' || Number.isFinite(R[k]), k + ': قيمة سليمة'));
ok(R.shops3 > R.idle && R.factory > R.idle && R.auto > R.idle, 'الدكاكين والمصنع والقادة المستقلون يتفوقون على الخمول');
ok(R.shops3 < 8 * R.auto, 'التوازن: ثلاثة دكاكين لا تتجاوز ثمانية أضعاف أسطول ثلاثة قادة مستقلين (' + (R.shops3 / R.auto).toFixed(1) + '×)');
console.log('\nتنبيه: لاعب آلي ساذج يخسر معظم رأسماله في التجارة المباشرة والتلقائية عند رأس مال كبير نسبياً، فلا يُقرأ الجدول كمقياس للاعب ماهر؛ دلالته أن الدكاكين تتفوق على التجارة بأضعاف كثيرة.');
console.log(fails ? fails + ' FAIL' : 'ALL OK'); process.exit(fails ? 1 : 0);
