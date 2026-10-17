// الشريط العلوي (فجوات وصفّ واحد للحمولة والدَّين) وتبويب «الدفتر» بجوال حقيقي الشكل: node test/header-ledger.test.js
const { chromium } = require('/opt/node-tools/node_modules/playwright'); const path = require('path');
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch();
  for (const w of [390, 360, 320]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 800 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('file://' + path.join(__dirname, '../index.html?learn=1&seed=3')); await p.waitForTimeout(1500);
    await p.evaluate(() => { const { S, E } = __game, A = E.A; A.chooseStart(S, 'sa'); A.learnSetChar(S, 'trader'); S.learn.level = 4; S.learn.intro = 4; S.pause = true; S.player.gold = 9000;
      const car = S.player.caravans[0], c = S.cities[car.city]; for (const g of E.GIDS) { if (g === 'wheat' || !E.sells(c, g)) continue; c.stock[g] = 5000; if (A.buy(S, car.id, g, 3).ok) A.sell(S, car.id, g, 3); }
      S.player.led.exp.customs = 123456.7; S.player.led.inc.shops = 9999999; ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'rq'].forEach(k => S.learn[k].length = 0); S.learn.rest = null; __game.renderAll(true); });
    await p.waitForTimeout(300);
    const g = await p.evaluate(() => { const r = id => document.getElementById(id).getBoundingClientRect(), t = [...document.querySelectorAll('#hWallets .wtile')].map(e => e.getBoundingClientRect()).sort((a, b) => a.left - b.left);
      return { gap1: Math.round(t[1].left - t[0].right), gap2: Math.round(t[2].left - t[1].right), loadTop: Math.round(r('hLoad').top), debtTop: Math.round(r('hDebt').top), debtH: Math.round(r('hDebt').height), W: document.documentElement.scrollWidth, iw: innerWidth }; });
    ok(g.gap1 >= 7 && g.gap2 >= 7, `${w}px: فجوة بين الريال والدولار والذهب ≥ ٧px (${g.gap1}/${g.gap2})`);
    ok(g.loadTop === g.debtTop && g.debtH < 60, `${w}px: الحمولة والدَّين في صف واحد وبارتفاع صغير (${g.debtH}px)`);
    await p.evaluate(() => __game.go('cities')); await p.waitForTimeout(400);
    ok(await p.locator('#mission.compact').count() === 1, `${w}px: بطاقة المهمة مضغوطة في شاشة الدول`);
    for (const tab of ['ledger', 'fx', 'cities', 'ledger']) {
      await p.evaluate(() => window.scrollTo(0, 2000)); await p.waitForTimeout(100);
      await p.tap('[data-ct=' + tab + ']'); await p.waitForTimeout(900);
      const r = await p.evaluate(() => ({ W: document.documentElement.scrollWidth, iw: innerWidth, chipTop: document.querySelector('#screen .chips').getBoundingClientRect().top, ih: innerHeight, on: document.querySelector('[data-ct].on').dataset.ct }));
      ok(r.W <= r.iw && r.chipTop >= -1 && r.chipTop < r.ih * 0.5, `${w}px: «${tab}» بلا تمرير أفقي والتبويبات ظاهرة بعد التبديل (${Math.round(r.chipTop)}px)`);
    }
    ok(errs.length === 0, `${w}px: لا أخطاء JS`); await ctx.close();
  }
  await b.close(); console.log(fails ? fails + ' FAIL' : 'ALL OK'); process.exit(fails ? 1 : 0);
})();
