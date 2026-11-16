'use strict';
// 055: سيناريو الحصّالة الثابت (بذرة 7، 400 يوم): خطة year ثم sale، بيع يدوي بربح، قافلة آلية، دكان، دخل مشروع حقنٌ في الدفتر. يعيد الحالة للبصمة.
module.exports = function run(E) {
  const A = E.A, S = E.newGame(7); A.learnSetChar(S, 'trader'); S.learn.intro = 1; S.noLock = 1; S.phase = 4; S.noShocks = true; S.noEvents = true;
  const P = S.player; P.gold = 300000; if (P.wallet) P.wallet.sar = 300000; const home = 'riyadh', c = S.cities[home], car = P.caravans[0];
  A.buildShop(S, home); A.buildWarehouse(S, home); const goods = E.GIDS.filter(g => E.sells(c, g) && !E.GD[g].sp && !E.GD[g].live).slice(0, 3);
  for (const sh of E.shopsOf(S, home)) for (const g of goods) A.shopSetItem(S, home, sh.id, g, 1.5, true); A.hireFill(S, home);
  const car2 = (A.hireCaptain(S), P.caravans[P.caravans.length - 1]); car2.route = { a: 'jeddah', b: 'riyadh', buyA: goods[0], buyB: goods[1] };
  A.savingsPlan(S, true, 10, 'year');
  for (let d = 0; d < 400; d++) {
    if (d === 200) A.savingsPlan(S, true, 15, 'sale');
    if (d === 150) { P.led.inc.projectIncome = (P.led.inc.projectIncome || 0) + 1000; P.led.inc.oppRent = (P.led.inc.oppRent || 0) + 200; }
    if (d % 10 === 5 && car.left === 0) { const g = goods[d / 10 % 3 | 0]; const b = A.buy(S, car.id, g, 20); if (b.ok) { c.idx[g] = Math.min(1.25, c.idx[g] * 1.15); A.sell(S, car.id, g, 20); } }
    E.tick(S); S.pause = false; if (S.road) A.roadChoose(S, 'fight'); if (S.life && S.life.pending) S.life.pending = null;
  }
  return { save: JSON.stringify(P.save), vault: P.vault || 0, sar: P.wallet && P.wallet.sar, total: P.save && P.save.total };
};
