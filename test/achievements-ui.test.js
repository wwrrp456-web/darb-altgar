// واجهة الإنجازات (إشعار وقسم ملف التاجر): node test/achievements-ui.test.js
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path'); const URL = 'file://' + path.join(__dirname, '../index.html') + '?learn=1&seed=4';
(async () => {
  const b = await chromium.launch(); let fails = 0; const errs = [];
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
  for (const vp of [{ width: 390, height: 800 }, { width: 1100, height: 800 }]) {
    const tag = vp.width + 'px: ';
    const ctx = await b.newContext({ viewport: vp }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL); await p.waitForTimeout(2200);
    await p.evaluate(() => { const g = __game, S = g.S, A = g.E.A; A.learnSetChar(S, 'trader'); S.learn.intro = 1; S.learn.level = 1; ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'rq'].forEach(k => S.learn[k] = []); S.player.gold = 5000; g.renderAll(true); });
    await p.waitForTimeout(250);
    ok(await p.evaluate(() => !!__game.S.ach), tag + 'حالة الإنجازات تُنشأ للاعب');
    await p.evaluate(() => { const g = __game, S = g.S; const car = S.player.caravans[0]; S.cities[car.city].stock.wheat = 500; g.E.A.buy(S, car.id, 'wheat', 3); g.renderAll(true); });
    await p.waitForTimeout(300);
    ok(/أول صفقة/.test(await p.locator('#toast').innerText()), tag + 'إشعار «أول صفقة» عند النيل');
    await p.locator('#hProfile, [data-act=profile]').first().click(); await p.waitForTimeout(300);
    const t = await p.locator('#profile .achc').innerText();
    ok(/الإنجازات/.test(t) && /من 40/.test(t), tag + 'قسم الإنجازات بعدد الكل 40');
    ok(await p.locator('#profile .achc details[data-dk^=ach_]').count() === 7, tag + 'سبع فئات');
    await p.locator('#profile .achc details').first().locator('summary').click(); await p.waitForTimeout(150);
    ok(await p.locator('#profile .achc .ach.on').count() >= 1 && /أول صفقة/.test(await p.locator('#profile .achc').innerText()), tag + 'الإنجاز المنال بارز بوصفه');
    await p.evaluate(() => { __game.S.ach.got.haggle_read = 3; __game.renderAll(true); });
    const hid = await p.evaluate(() => { const L = __game.E.ACHD.LIST; return L.filter(a => a.hid && __game.S.ach.got[a.id] == null).length; });
    ok(hid === 8, tag + 'المخفية غير المنالة 8 (اسمها مستور)');
    ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), tag + 'بلا تمرير أفقي');
    await ctx.close();
  }
  ok(errs.length === 0, 'بلا أخطاء JS ' + errs.join('|'));
  await b.close(); console.log(fails ? fails + ' فشل' : 'كلها نجحت'); process.exit(fails ? 1 : 0);
})();
