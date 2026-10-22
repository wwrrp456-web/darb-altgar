// نمو الثروة وسيولة الزكاة بعد اقتصاد الدكاكين الجديد (محرك): node test/wealth.test.js
const E = require('../src/engine.js'), A = E.A;
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
const cash = S => S.player.gold;
// ١) لاعب آلي عبر سنة: الثروة تنمو بلا قفزات ولا ركود، والسيولة تكفي الزكاة
const seeds = [1, 2, 3, 4, 5, 6], nw = { 100: [], 200: [], 354: [] }; let liquid = 0, withDue = 0;
for (const s of seeds) {
  const S = E.newGame(s * 7919);
  for (let d = 1; d <= 354; d++) {
    E.botMain(S); E.botBuild(S); E.tick(S);
    if (nw[d]) nw[d].push(E.netWorth(S));
  }
  const z = E.zakatBase(S); if (z.met) { withDue++; if (z.amount <= cash(S)) liquid++; }
  ok(Number.isFinite(E.netWorth(S)), 'البذرة ' + s + ': ثروة سليمة بلا NaN');
}
const avg = a => a.reduce((x, y) => x + y, 0) / a.length;
ok(avg(nw[200]) > avg(nw[100]) && avg(nw[354]) > avg(nw[200]), 'الثروة تنمو عبر السنة (' + Math.round(avg(nw[100])) + ' ← ' + Math.round(avg(nw[200])) + ' ← ' + Math.round(avg(nw[354])) + ')');
ok(avg(nw[354]) / avg(nw[100]) < 12, 'لا انفجار في الثروة: النمو خلال سنة أقل من ١٢ ضعفاً (' + (avg(nw[354]) / avg(nw[100])).toFixed(1) + '×)');
ok(withDue === 0 || liquid / withDue >= 0.8, 'السيولة تكفي الزكاة لدى معظم اللاعبين (' + liquid + ' من ' + withDue + ')');
// ٢) صاحب ثلاثة دكاكين في مدينة مزدهرة: ثروة تنمو وسيولة تغطي الزكاة بوفرة
{
  const S = E.newGame(5); A.learnSetChar(S, 'trader'); S.phase = 2; S.player.gold = 60000; S.noShocks = true; S.noEvents = true; S.player.caravans[0].city = 'riyadh';
  const c = S.cities.riyadh, goods = E.GIDS.filter(g => E.sells(c, g) && !E.GD[g].sp && !E.GD[g].live).sort((a, b) => c.dem[b] * E.unitPrice(c, b) - c.dem[a] * E.unitPrice(c, a)).slice(0, 4);
  for (let i = 0; i < 3; i++) A.buildShop(S, 'riyadh');
  E.shopsOf(S, 'riyadh').forEach(sh => goods.forEach(g => A.shopSetItem(S, 'riyadh', sh.id, g, E.SHOP_PRICE0, true))); A.hireFill(S, 'riyadh');
  const w0 = E.netWorth(S); for (let d = 0; d < 360; d++) { E.tick(S); S.pause = false; }
  const w1 = E.netWorth(S), z = E.zakatBase(S);
  ok(w1 > w0 * 2 && Number.isFinite(w1), 'صاحب ثلاثة دكاكين: الثروة تنمو خلال سنة (' + Math.round(w0) + ' ← ' + Math.round(w1) + ')');
  ok(z.met && z.amount < cash(S) * 0.3, 'الزكاة المستحقة (' + z.amount + ') أقل بكثير من السيولة (' + Math.round(cash(S)) + ')');
}
console.log(fails ? fails + ' FAIL' : 'ALL OK'); process.exit(fails ? 1 : 0);
