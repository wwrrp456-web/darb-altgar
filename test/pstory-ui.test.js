// ألبوم حكايات المنتجات في الدفتر: node test/pstory-ui.test.js
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path'); const URL = 'file://' + path.join(__dirname, '../index.html') + '?learn=1&seed=4';
(async () => {
  const b = await chromium.launch(); let fails = 0; const errs = [];
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
  for (const vp of [{ width: 390, height: 800 }, { width: 1100, height: 800 }]) {
    const tag = vp.width + 'px: ';
    const ctx = await b.newContext({ viewport: vp }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL); await p.waitForTimeout(2200);
    await p.evaluate(() => { const g = __game, S = g.S, A = g.E.A; A.learnSetChar(S, 'trader'); S.learn.intro = 5; S.learn.level = 5; ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'rq'].forEach(k => S.learn[k] = []); const car = S.player.caravans[0]; car.city = 'hail'; car.left = 0; S.cities.hail.stock.dates = 300; S.player.gold = 5000; A.buy(S, car.id, 'dates', 4); ['tq','eq','bq','csq','fq','up','stageUp','sq','rq'].forEach(k => S.learn[k] = []); g.renderAll(true); });
    await p.waitForTimeout(250);
    await p.evaluate(() => __game.salem(true, 'journal')); await p.waitForTimeout(250);
    await p.locator('#salemPanel [data-act=jtab][data-g=album]').click(); await p.waitForTimeout(250);
    ok(/حكايات المنتجات 1/.test(await p.locator('#salemPanel').innerText()), tag + 'عداد الحكايات 1');
    await p.locator('#salemPanel details:has-text("حكايات المنتجات") summary').first().click(); await p.waitForTimeout(150);
    const t = await p.locator('#salemPanel').innerText();
    ok(/تمر حائل/.test(t) && /زاد المسافر/.test(t), tag + 'حكاية التمر ظاهرة');
    ok(/اشترِ هذه السلعة أو بِعها/.test(t), tag + 'الحكايات المقفلة بتلميح');
    ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), tag + 'بلا تمرير أفقي');
    await ctx.close();
  }
  ok(errs.length === 0, 'بلا أخطاء JS ' + errs.join('|'));
  await b.close(); console.log(fails ? fails + ' فشل' : 'كلها نجحت'); process.exit(fails ? 1 : 0);
})();
