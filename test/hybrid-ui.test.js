// واجهة الجنس والتزاوج والهجين: node test/hybrid-ui.test.js
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path'); const URL = 'file://' + path.join(__dirname, '../index.html') + '?seed=4';
(async () => {
  const b = await chromium.launch(); let fails = 0; const errs = [];
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
  for (const vp of [{ width: 390, height: 800 }, { width: 1100, height: 800 }]) {
    const tag = vp.width + 'px: ';
    const ctx = await b.newContext({ viewport: vp }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL); await p.waitForTimeout(2200);
    await p.evaluate(() => { const g = __game, S = g.S; g.E.A.learnSetChar(S, 'trader'); S.learn.intro = 1; S.learn.level = 11; ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'rq'].forEach(k => S.learn[k] = []); S.phase = 3; S.player.gold += 300000; const car = S.player.caravans[0]; car.herders = 3; S.cities.riyadh.stock.arab_kuhaylan = 300; g.go('market'); g.renderAll(true); });
    await p.waitForTimeout(300);
    await p.locator('[data-mf=live]').click(); await p.waitForTimeout(250);
    await p.locator('.gcard[data-gd=arab_kuhaylan] .top').click(); await p.waitForTimeout(250);
    ok(await p.locator('#modal [data-act=buyherd][data-sex=m]').count() === 1 && await p.locator('#modal [data-act=buyherd][data-sex=p]').count() === 1, tag + 'أزرار شراء الذكر والأنثى والحامل');
    ok(/صفات فرس عربي/.test(await p.locator('#modal').innerText()), tag + 'بطاقة صفات الصنف');
    await p.locator('#modal [data-act=buyherd][data-sex=p]').click(); await p.waitForTimeout(250);
    ok(await p.evaluate(() => __game.E.pregOf(__game.S.player.caravans[0], 'arab_kuhaylan') >= 1), tag + 'شراء حامل من الورقة');
    await p.locator('#modal [data-act=buyherd][data-sex=m]').first().click(); await p.waitForTimeout(250);
    ok(/حوامل/.test(await p.locator('#modal').innerText()), tag + 'سطر القطيع يذكر الحوامل');
    await p.keyboard.press('Escape');
    // ذكر من صنف آخر ثم التزاوج
    await p.evaluate(() => { const g = __game, car = g.S.player.caravans[0], b = car.city; car.city = 'xian'; g.S.cities.xian.stock.mongolian = 300; g.E.A.buy(g.S, car.id, 'mongolian', 2, 'herd', 'm'); car.city = b; g.go('caravan'); g.renderAll(true); });
    await p.waitForTimeout(300);
    ok(await p.locator('select[data-pair][data-f=arab_kuhaylan]').count() === 1, tag + 'اختيار ذكر التلقيح ظاهر في بطاقة القطيع');
    await p.selectOption('select[data-pair][data-f=arab_kuhaylan]', 'mongolian'); await p.waitForTimeout(250);
    ok(await p.evaluate(() => __game.S.player.caravans[0].pair && __game.S.player.caravans[0].pair.arab_kuhaylan === 'mongolian'), tag + 'الاختيار يضبط الربط');
    ok(/المولود: خيل هجين/.test(await p.locator('.herd').innerText()), tag + 'معاينة المولود الهجين');
    ok(await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), tag + 'لا تمرير أفقي');
    await ctx.close();
  }
  ok(errs.length === 0, 'لا أخطاء JS ' + errs.join('|'));
  await b.close(); console.log(fails ? fails + ' FAIL' : 'ALL OK'); process.exit(fails ? 1 : 0);
})();
