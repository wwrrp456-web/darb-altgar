// واجهة القطيع الماشي: node test/herd-ui.test.js
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path'); const URL = 'file://' + path.join(__dirname, '../index.html') + '?seed=3';
(async () => {
  const b = await chromium.launch(); let fails = 0; const errs = [];
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
  for (const vp of [{ width: 390, height: 800 }, { width: 1100, height: 800 }]) {
    const tag = vp.width + 'px: ';
    const ctx = await b.newContext({ viewport: vp }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL); await p.waitForTimeout(2200);
    await p.evaluate(() => { const g = __game, S = g.S; g.E.A.learnSetChar(S, 'trader'); S.learn.intro = 1; S.learn.level = 3; S.phase = 2; S.player.gold += 30000; g.go('caravan'); g.renderAll(true); });
    await p.waitForTimeout(300);
    ok(await p.locator('.herd').count() === 1 && /رعاة/.test(await p.locator('.herd').innerText()), tag + 'بطاقة القطيع في شاشة القافلة');
    await p.locator('[data-act=hherder]').click(); await p.waitForTimeout(250);
    ok(await p.evaluate(() => __game.S.player.caravans[0].herders === 1), tag + 'توظيف راعٍ بالضغط');
    await p.evaluate(() => { const g = __game; g.go('market'); g.renderAll(true); }); await p.waitForTimeout(300);
    await p.locator('[data-mf=live]').click(); await p.waitForTimeout(250);
    const n = await p.locator('.gcard').count(); ok(n >= 1, tag + 'شريحة «مواشي» تعرض بطاقات (' + n + ')');
    const card = p.locator('.gcard[data-gd=sheep]'); ok(await card.count() === 1, tag + 'بطاقة الغنم في الرياض');
    await card.locator('.top').click(); await p.waitForTimeout(250);
    ok(/علف/.test(await p.locator('#modal').innerText()) && /القطيع الماشي/.test(await p.locator('#modal').innerText()), tag + 'الورقة تذكر العلف والقطيع');
    await p.locator('#modal [data-act=buyherd]').click(); await p.waitForTimeout(300); await p.keyboard.press('Escape');
    ok(await p.evaluate(() => (__game.S.player.caravans[0].herd.sheep || 0) >= 1), tag + 'الشراء للقطيع من البطاقة');
    await p.evaluate(() => { __game.go('caravan'); __game.renderAll(true); }); await p.waitForTimeout(250);
    ok(/غنم/.test(await p.locator('.herd').innerText()), tag + 'القطيع يظهر في شاشة القافلة');
    ok(await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), tag + 'لا تمرير أفقي');
    await ctx.close();
  }
  ok(errs.length === 0, 'لا أخطاء JS ' + errs.join('|'));
  await b.close(); console.log(fails ? fails + ' FAIL' : 'ALL OK'); process.exit(fails ? 1 : 0);
})();
