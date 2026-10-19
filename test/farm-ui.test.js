// واجهة المزرعة: node test/farm-ui.test.js
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path'); const URL = 'file://' + path.join(__dirname, '../index.html') + '?seed=3';
(async () => {
  const b = await chromium.launch(); let fails = 0; const errs = [];
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
  for (const vp of [{ width: 390, height: 800 }, { width: 1100, height: 800 }]) {
    const tag = vp.width + 'px: ';
    const ctx = await b.newContext({ viewport: vp }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL); await p.waitForTimeout(2200);
    await p.evaluate(() => { const g = __game, S = g.S; g.E.A.learnSetChar(S, 'trader'); S.learn.intro = 1; S.learn.level = 6; S.phase = 2; S.player.gold += 90000; g.E.A.buildShop(S, 'riyadh'); g.go('estate'); g.renderAll(true); });
    await p.locator('[data-estcity=riyadh]').first().click().catch(() => {}); await p.waitForTimeout(300);
    ok(/الطور 3/.test(await p.locator('.card.locked').last().innerText().catch(() => '')), tag + 'المزرعة مقفلة قبل الطور ٣');
    await p.evaluate(() => { __game.S.phase = 3; __game.renderAll(true); }); await p.waitForTimeout(250);
    ok(await p.locator('[data-act=buildfarm]').count() === 1, tag + 'زر بناء المزرعة');
    await p.locator('[data-act=buildfarm]').click(); await p.waitForTimeout(300);
    ok(await p.locator('.farm').count() === 1 && /السعة/.test(await p.locator('.farm').innerText()), tag + 'بطاقة المزرعة وسعتها');
    await p.evaluate(() => { const g = __game, S = g.S, car = S.player.caravans[0]; g.E.A.hireHerder(S, car.id); g.E.A.buy(S, car.id, 'sheep', 10, 'herd'); g.renderAll(true); }); await p.waitForTimeout(250);
    ok(await p.locator('[data-act=farmin][data-g=sheep]').count() === 1, tag + 'زر وضع الغنم في المزرعة');
    await p.locator('[data-act=farmin][data-g=sheep]').click(); await p.waitForTimeout(300);
    ok(/غنم/.test(await p.locator('.farm').innerText()) && await p.locator('[data-act=slaughter][data-g=sheep]').count() === 1, tag + 'الغنم في المزرعة مع زر الذبح');
    await p.locator('[data-act=slaughter][data-g=sheep]').click(); await p.waitForTimeout(300);
    ok(await p.evaluate(() => (__game.S.player.props.riyadh.store.jerky || 0) >= 1), tag + 'الذبح ينتج لحماً مجففاً');
    ok(await p.locator('[data-act=farmsell]').count() === 1, tag + 'زر بيع البالغة');
    ok(await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), tag + 'لا تمرير أفقي');
    await ctx.close();
  }
  ok(errs.length === 0, 'لا أخطاء JS ' + errs.join('|'));
  await b.close(); console.log(fails ? fails + ' FAIL' : 'ALL OK'); process.exit(fails ? 1 : 0);
})();
