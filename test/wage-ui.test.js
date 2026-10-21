// الأجر المعلوم في بطاقات التوظيف (واجهة): node test/wage-ui.test.js
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path'); const URL = 'file://' + path.join(__dirname, '../index.html') + '?learn=1&seed=3';
(async () => {
  const b = await chromium.launch(); let fails = 0; const errs = [];
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
  for (const vp of [{ width: 390, height: 800 }, { width: 1100, height: 800 }]) {
    const t = vp.width + 'px: ';
    const ctx = await b.newContext({ viewport: vp }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL); await p.waitForTimeout(900);
    await p.evaluate(() => { const g = __game, S = g.S; g.E.A.learnSetChar(S, 'trader'); S.learn.level = 6; S.learn.intro = 6; ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'rq', 'cq'].forEach(k => S.learn[k] = []); S.player.gold = 60000; S.phase = Math.max(S.phase, 2); g.go('caravan'); g.renderAll(true); }); await p.waitForTimeout(500);
    const cards = await p.locator('.card.up .wage').allInnerTexts();
    ok(cards.length === 2 && cards.every(x => /أجر معلوم/.test(x) && /مرة/.test(x) && /يومياً/.test(x)), t + 'بطاقتا الحارس والطاقم تعرضان الأجر المعلوم: ' + JSON.stringify(cards));
    ok(/حين تقف/.test(cards.join(' ')), t + 'أجر الوقوف للحارس');
    ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), t + 'بلا تمرير أفقي');
    const g0 = await p.evaluate(() => __game.S.player.caravans[0].guards);
    await p.evaluate(() => document.querySelector('[data-act=guard]').click()); await p.waitForTimeout(400);
    ok(await p.evaluate(() => __game.S.player.caravans[0].guards) === g0 + 1, t + 'توظيف الحارس يعمل');
    const toast = await p.evaluate(() => (document.getElementById('toast') || {}).textContent || '');
    ok(/أجر معلوم/.test(toast), t + 'رسالة التوظيف تذكر الأجر المعلوم: ' + toast.slice(0, 60));
    await p.evaluate(() => { __game.go('empire'); __game.renderAll(true); }); await p.waitForTimeout(500);
    const ct = await p.locator('.wage').allInnerTexts();
    ok(ct.some(x => /أجر معلوم/.test(x) && /يومياً/.test(x)), t + 'بطاقات المرشحين في الأسطول تعرض أجر القائد المعلوم (' + ct.length + ')');
    await ctx.close();
  }
  ok(errs.length === 0, 'بلا أخطاء JS ' + errs.join('|'));
  await b.close(); console.log(fails ? 'ERRORS: ' + fails : 'كل شيء سليم'); process.exit(fails ? 1 : 0);
})();
