// واجهة المصانع غير المحلية والمدير والجودة: node test/factories-ui.test.js
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path'); const URL = 'file://' + path.join(__dirname, '../index.html') + '?seed=4';
(async () => {
  const b = await chromium.launch(); let fails = 0; const errs = [];
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
  for (const vp of [{ width: 390, height: 800 }, { width: 1100, height: 800 }]) {
    const tag = vp.width + 'px: ';
    const ctx = await b.newContext({ viewport: vp }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL); await p.waitForTimeout(2200);
    await p.evaluate(() => { const g = __game, S = g.S, A = g.E.A; A.learnSetChar(S, 'trader'); S.learn.intro = 1; S.learn.level = 11; ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'rq'].forEach(k => S.learn[k] = []); S.phase = 3; S.player.gold += 300000; const car = S.player.caravans[0]; car.city = 'cairo'; A.buildShop(S, 'cairo'); A.buildWarehouse(S, 'cairo'); S.bosses.xian.craft = true; g.go('empire'); g.renderAll(true); });
    await p.waitForTimeout(300);
    await p.locator('#screen [data-ee=eg]').first().click(); await p.waitForTimeout(250); await p.locator('#screen [data-estcity2=cairo]').first().click(); await p.waitForTimeout(250);
    ok(/غير محلية/.test(await p.locator('#screen').innerText()), tag + 'قسم المصانع غير المحلية ظاهر');
    await p.locator('details[data-dk=fabr] summary').click(); await p.waitForTimeout(150);
    ok(await p.locator('[data-act=factory][data-r=silk]').count() === 1, tag + 'بطاقة مشغل الحرير');
    await p.locator('[data-act=factory][data-r=silk]').click(); await p.waitForTimeout(300);
    ok(await p.evaluate(() => __game.S.player.factories.some(f => f.recipe === 'silk' && f.local === false)), tag + 'بُني مصنع غير محلي');
    ok(/صنعة محلية \d+٪/.test(await p.locator('.fact').first().innerText()) && await p.locator('.fact .bar, .fact [class*=bar]').count() >= 1, tag + 'بطاقة المصنع: الجودة والصحة');
    ok(await p.locator('[data-act=hiremgr]').count() >= 1, tag + 'بطاقة المدير بأزرار التعيين');
    await p.locator('[data-act=hiremgr][data-lv="2"]').click(); await p.waitForTimeout(300);
    ok(await p.locator('.fact [data-fset=sell]').count() === 1, tag + 'إعدادات المصنع تظهر مع المدير');
    await p.selectOption('.fact [data-fset=sell]', 'now'); await p.waitForTimeout(200);
    ok(await p.evaluate(() => __game.S.player.factories[0].set.sell === 'now'), tag + 'ضبط البيع الفوري');
    ok(await p.locator('[data-act=auditmgr]').count() === 1, tag + 'زر مراجعة الحسابات');
    await p.evaluate(() => { const f = __game.S.player.factories[0]; f.hp = 0; f.crisis = { day: __game.S.day }; __game.renderAll(true); }); await p.waitForTimeout(250);
    ok(await p.locator('[data-act=rescuefact]').count() === 1, tag + 'زر الإنقاذ عند الانهيار');
    ok(await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), tag + 'لا تمرير أفقي');
    await ctx.close();
  }
  ok(errs.length === 0, 'لا أخطاء JS ' + errs.join('|'));
  await b.close(); console.log(fails ? fails + ' FAIL' : 'ALL OK'); process.exit(fails ? 1 : 0);
})();
