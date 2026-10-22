// ذاكرة موضع التمرير: العودة للشاشة بالتنقل تستعيد موضعها، ومدينة جديدة تبدأ من الأعلى: node test/scrollmem-ui.test.js
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path'); const URL = 'file://' + path.join(__dirname, '../index.html') + '?learn=1&seed=4';
(async () => {
  const b = await chromium.launch(); let fails = 0; const errs = [];
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
  for (const vp of [{ width: 390, height: 800 }, { width: 1100, height: 800 }]) {
    const tag = vp.width + 'px: ';
    const p = await (await b.newContext({ viewport: vp })).newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL); await p.waitForTimeout(900);
    await p.evaluate(() => { const g = __game, S = g.S; g.E.A.learnSetChar(S, 'trader'); S.learn.level = 11; S.learn.intro = 11; S.learn.free = true; ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'rq', 'cq'].forEach(k => S.learn[k] = []); S.player.gold = 50000; g.go('market'); g.renderAll(true); });
    await p.waitForTimeout(300);
    await p.evaluate(() => window.scrollTo(0, 900)); await p.waitForTimeout(300);
    const y0 = await p.evaluate(() => Math.round(scrollY));
    ok(y0 > 300, tag + 'السوق طويل ويمكن التمرير فيه (' + y0 + ')');
    await p.evaluate(() => document.querySelector('#nav [data-go=map]').click()); await p.waitForTimeout(400);
    ok(await p.evaluate(() => Math.round(scrollY)) < 50, tag + 'شاشة الخريطة تبدأ من أعلاها');
    await p.evaluate(() => document.querySelector('#nav [data-go=market]').click()); await p.waitForTimeout(600);
    const y1 = await p.evaluate(() => Math.round(scrollY));
    ok(Math.abs(y1 - y0) <= 40, tag + 'الرجوع للسوق بالتنقل يستعيد موضعه (' + y0 + ' ← ' + y1 + ')');
    // فتح تفاصيل سلعة وإغلاقها لا يقفز
    await p.evaluate(() => { const b = document.querySelector('#screen [data-gd]'); b.click(); }); await p.waitForTimeout(300);
    await p.evaluate(() => document.getElementById('modal').dispatchEvent(new MouseEvent('click', { bubbles: true }))); await p.waitForTimeout(400);
    const y2 = await p.evaluate(() => Math.round(scrollY));
    ok(Math.abs(y2 - y1) <= 60, tag + 'فتح التفاصيل وإغلاقها يحفظان الموضع (' + y1 + ' ← ' + y2 + ')');
    ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), tag + 'بلا تمرير أفقي');
  }
  ok(errs.length === 0, 'بلا أخطاء JS ' + errs.join('|'));
  await b.close(); console.log(fails ? 'ERRORS: ' + fails : 'كل شيء سليم'); process.exit(fails ? 1 : 0);
})();
