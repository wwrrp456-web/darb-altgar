// واجهة المراكب والتأمين وتحسين الدكان والقوالب: node test/stage5a-ui.test.js
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path'); const URL = 'file://' + path.join(__dirname, '../index.html') + '?seed=4';
(async () => {
  const b = await chromium.launch(); let fails = 0; const errs = [];
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
  for (const vp of [{ width: 390, height: 800 }, { width: 1100, height: 800 }]) {
    const tag = vp.width + 'px: ';
    const ctx = await b.newContext({ viewport: vp }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL); await p.waitForTimeout(2200);
    await p.evaluate(() => { const g = __game, S = g.S, A = g.E.A; S.phase = 3; S.player.gold = 90000; S.player.caravans[0].city = 'riyadh'; A.buildShop(S, 'riyadh'); A.buildWarehouse(S, 'riyadh'); S.player.props.riyadh.store = { coffee: 50 }; A.hireCaptain(S, 0); const c = S.player.caravans[1]; c.route = { a: 'riyadh', b: 'jeddah', buyA: 'dates', buyB: 'coffee' }; g.go('empire'); g.renderAll(true); });
    await p.waitForTimeout(300);
    ok(await p.locator('.mountrow').count() === 2, tag + 'صف مركب لكل قافلة');
    await p.locator('[data-act=buymount][data-k=camel]').first().click(); await p.waitForTimeout(250);
    ok(await p.evaluate(() => __game.S.player.caravans[0].mount && __game.S.player.caravans[0].mount.kind === 'camel'), tag + 'شراء جمل من الواجهة');
    ok(await p.locator('[data-act=sellmount]').count() === 1, tag + 'يظهر زر البيع');
    await p.locator('[data-act=tplsave]:not([disabled])').first().click(); await p.waitForTimeout(250);
    ok(await p.evaluate(() => __game.S.player.tpl && __game.S.player.tpl.length === 1), tag + 'حفظ القالب');
    ok(await p.locator('[data-act=tplapply]').count() >= 1, tag + 'زر التطبيق يظهر');
    // التأمين في مدينة بملكيات
    await p.evaluate(() => { __game.go('empire'); __game.renderAll(true); });
    await p.evaluate(() => { __game.S.player.props.riyadh.store = { coffee: 50 }; __game.go('empire'); __game.renderAll(true); });
    const ec = await p.locator('#screen [data-ee=sa]').count(); if (ec) await p.locator('#screen [data-ee=sa]').first().click(); await p.waitForTimeout(150);
    ok(await p.locator('[data-act=insure][data-on="1"]').count() === 1, tag + 'زر التأمين ظاهر');
    await p.locator('[data-act=insure]').click(); await p.waitForTimeout(250);
    ok(await p.evaluate(() => __game.E.insOn(__game.S, 'riyadh')), tag + 'تفعيل التأمين من الواجهة');
    // تحسين الدكان
    await p.evaluate(() => { const g = __game; g.S.player.caravans[0].city = 'riyadh'; g.go('estate'); g.renderAll(true); });
    await p.waitForTimeout(300);
    if (await p.locator('[data-act=shopup]').count()) {
      await p.locator('[data-act=shopup][data-k=shelf]').first().click(); await p.waitForTimeout(250);
      ok(await p.evaluate(() => __game.E.shUp(__game.S.player.props.riyadh.shops[0], 'shelf')) === 1, tag + 'ترقية الرفوف من الواجهة');
    } else ok(false, tag + 'أزرار تحسين الدكان غير ظاهرة');
    ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), tag + 'بلا تمرير أفقي');
    await ctx.close();
  }
  ok(errs.length === 0, 'بلا أخطاء JS ' + errs.join('|'));
  await b.close(); console.log(fails ? fails + ' فشل' : 'كلها نجحت'); process.exit(fails ? 1 : 0);
})();
