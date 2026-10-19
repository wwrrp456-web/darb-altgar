// واجهة الإيجار ثم الشراء: node test/rent-ui.test.js
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path'); const URL = 'file://' + path.join(__dirname, '../index.html') + '?seed=3';
(async () => {
  const b = await chromium.launch(); let fails = 0; const errs = [];
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
  for (const vp of [{ width: 390, height: 800 }, { width: 1100, height: 800 }]) {
    const tag = vp.width + 'px: ';
    const ctx = await b.newContext({ viewport: vp }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL); await p.waitForTimeout(2200);
    await p.evaluate(() => { const g = __game, S = g.S; g.E.A.learnSetChar(S, 'trader'); S.learn.intro = 1; S.learn.level = 5; S.phase = 2; S.player.gold += 30000; g.go('estate'); g.renderAll(true); });
    await p.locator('[data-estcity=riyadh]').first().click().catch(() => {}); await p.waitForTimeout(300);
    ok(await p.locator('[data-act=rentshop]').count() === 2, tag + 'زرّا استئجار البسطة والدكان');
    await p.locator('[data-act=rentshop][data-g=stall]').click(); await p.waitForTimeout(300);
    ok(/مؤجَّرة/.test(await p.locator('.shopbox').innerText()), tag + 'البسطة المؤجَّرة تظهر بإيجارها');
    ok(await p.locator('.shopbox [data-act=upstall]').count() === 1 && await p.locator('.shopbox [data-act=buyshop]').count() === 1, tag + 'زرّا الارتقاء والشراء');
    await p.locator('[data-act=landlord][data-g=boss]').click().catch(() => {}); await p.waitForTimeout(150);
    await p.locator('.shopbox [data-act=upstall]').click(); await p.waitForTimeout(300);
    ok(await p.evaluate(() => __game.E.shKind(__game.S.player.props.riyadh.shops[0]) === 'rent'), tag + 'الارتقاء إلى دكان مؤجَّر');
    await p.locator('.shopbox [data-act=buyshop]').click(); await p.waitForTimeout(300);
    ok(await p.evaluate(() => __game.E.shKind(__game.S.player.props.riyadh.shops[0]) === 'own') && /ملكك/.test(await p.locator('.shopbox').innerText()), tag + 'الشراء يجعله ملكاً');
    ok(await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), tag + 'لا تمرير أفقي');
    await ctx.close();
  }
  ok(errs.length === 0, 'لا أخطاء JS ' + errs.join('|'));
  await b.close(); console.log(fails ? fails + ' FAIL' : 'ALL OK'); process.exit(fails ? 1 : 0);
})();
