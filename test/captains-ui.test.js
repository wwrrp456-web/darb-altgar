// واجهة توظيف القادة بالمرشحين والعلاوة: node test/captains-ui.test.js
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path'); const URL = 'file://' + path.join(__dirname, '../index.html') + '?seed=4';
(async () => {
  const b = await chromium.launch(); let fails = 0; const errs = [];
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
  for (const vp of [{ width: 390, height: 800 }, { width: 1100, height: 800 }]) {
    const tag = vp.width + 'px: ';
    const ctx = await b.newContext({ viewport: vp }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL); await p.waitForTimeout(2200);
    await p.evaluate(() => { const g = __game, S = g.S; S.phase = 3; S.player.gold += 50000; g.go('empire'); g.renderAll(true); });
    await p.waitForTimeout(300);
    ok(await p.locator('.capcard').count() === 3, tag + 'ثلاث بطاقات مرشحين');
    ok(/خبير|عيون|ابن البلد|رسول|المستقل|الوفيّ/.test(await p.locator('.capcard').first().innerText()), tag + 'الدور ظاهر');
    const fee = await p.evaluate(() => __game.E.captainPool(__game.S)[0].fee);
    const g0 = await p.evaluate(() => __game.S.player.gold);
    await p.locator('[data-act=hirecand][data-i="0"]').click(); await p.waitForTimeout(300);
    ok(await p.evaluate(() => __game.S.player.caravans.length) === 2 && g0 - await p.evaluate(() => __game.S.player.gold) === fee, tag + 'وُظّف المرشح برسمه');
    ok(await p.locator('.capline').count() === 1 && /ولاء 70/.test(await p.locator('.capline').innerText()), tag + 'سطر الدور والولاء والأجر');
    await p.locator('[data-act=raisecap]').click(); await p.waitForTimeout(300);
    ok(/ولاء 82/.test(await p.locator('.capline').innerText()), tag + 'العلاوة ترفع الولاء إلى 82');
    ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), tag + 'بلا تمرير أفقي');
    await ctx.close();
  }
  ok(errs.length === 0, 'بلا أخطاء JS ' + errs.join('|'));
  await b.close(); console.log(fails ? fails + ' فشل' : 'كلها نجحت'); process.exit(fails ? 1 : 0);
})();
