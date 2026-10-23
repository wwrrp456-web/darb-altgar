// الشريط العلوي (فجوات وصفّ واحد للحمولة والدَّين) وتبويب «الدفتر» بجوال حقيقي الشكل: node test/header-ledger.test.js
const { chromium } = require('/opt/node-tools/node_modules/playwright'); const path = require('path');
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch();
  for (const w of [390, 360, 320]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 800 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('file://' + path.join(__dirname, '../index.html?learn=1&seed=3')); await p.waitForTimeout(1500);
    await p.evaluate(() => { const { S, E } = __game, A = E.A; A.chooseStart(S, 'sa'); A.learnSetChar(S, 'trader'); S.learn.level = 4; S.learn.intro = 4; S.pause = true; S.player.gold = 9000; S.player.wallet.usd = 5; S.player.wallet.au = 1;
      const car = S.player.caravans[0], c = S.cities[car.city]; for (const g of E.GIDS) { if (g === 'wheat' || !E.sells(c, g)) continue; c.stock[g] = 5000; if (A.buy(S, car.id, g, 3).ok) A.sell(S, car.id, g, 3); }
      S.player.led.exp.customs = 123456.7; S.player.led.inc.shops = 9999999; ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'rq'].forEach(k => S.learn[k].length = 0); S.learn.rest = null; __game.renderAll(true); });
    await p.waitForTimeout(300);
    const primary=await p.locator('#hSar,#hLoad,#hDebt').evaluateAll(a=>a.map(e=>{const r=e.getBoundingClientRect();return {top:r.top,width:r.width,height:r.height};}));
    ok(primary.every(r=>r.width>=44&&r.height>=44)&&Math.max(...primary.map(r=>r.top))-Math.min(...primary.map(r=>r.top))<2,`${w}px: الريال والحمولة والدين في صف واحد بأهداف44px`);
    await p.locator('#hHudMore').click();
    const g=await p.evaluate(()=>{const a=['hSar','hUsd','hGold'].map(id=>document.getElementById(id).getBoundingClientRect()),gaps=[];for(let i=0;i<a.length;i++)for(let j=i+1;j<a.length;j++)gaps.push(Math.max(a[i].left-a[j].right,a[j].left-a[i].right,a[i].top-a[j].bottom,a[j].top-a[i].bottom));return {gaps,visible:a.every(r=>r.width>=44&&r.height>=44)};});
    ok(g.visible&&g.gaps.every(n=>n>=7),`${w}px: العملات الموسعة مستقلة وفجواتها لا تقل عن7px (${g.gaps.map(Math.round)})`);
    await p.evaluate(() => __game.go('cities')); await p.waitForTimeout(400);
    ok(await p.locator('#journeyBar #mission').count() === 0 && await p.locator('#hSalem').isVisible(), `${w}px: لا بطاقة مهمة ثابتة أعلى الشاشة، وزر عمّ سالم في الشريط`);
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
