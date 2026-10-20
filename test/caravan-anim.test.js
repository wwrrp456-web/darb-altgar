// القافلة المتحركة على الخريطة المسطّحة: node test/caravan-anim.test.js
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path'); const URL = 'file://' + path.join(__dirname, '../index.html') + '?seed=4&map=2d';
(async () => {
  const b = await chromium.launch(); let fails = 0; const errs = [];
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
  for (const vp of [{ width: 390, height: 800 }, { width: 1100, height: 800 }]) {
    const tag = vp.width + 'px: ';
    const ctx = await b.newContext({ viewport: vp }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL); await p.waitForTimeout(2200);
    await p.evaluate(() => { const g = __game, S = g.S; S.noShocks = true; const car = S.player.caravans[0]; car.city = 'riyadh'; car.left = 0; g.E.A.travel(S, car.id, 'cairo'); g.go('map'); g.renderAll(true); });
    await p.waitForTimeout(400);
    ok(await p.locator('#map .map-caravan.moving').count() === 1, tag + 'القافلة تتحرك (صنف moving)');
    ok(await p.locator('#map .map-caravan.moving .dustspr').count() === 1 && await p.locator('#map .map-caravan .camwalk').count() === 1 && await p.locator('#map .map-caravan .bob').count() === 1, tag + 'جمل يمشي بإطاراته وغبار وتمايل');
    ok(await p.locator('#map .map-done').count() === 1, tag + 'الجزء المقطوع من المسار بخط ذهبي');
    const x0 = +(await p.locator('#map .map-caravan').first().getAttribute('data-x'));
    await p.evaluate(() => { const g = __game; g.E.tick(g.S); g.renderAll(true); }); await p.waitForTimeout(60);
    const x1 = +(await p.locator('#map .map-caravan').first().getAttribute('data-x'));
    ok(x0 !== x1, tag + 'تقدّمت القافلة (' + x0.toFixed(0) + '→' + x1.toFixed(0) + ')');
    ok(await p.evaluate(() => document.querySelector('#map .map-caravan').getAnimations().some(a => a.effect && a.effect.getKeyframes && a.effect.getKeyframes().some(k => k.transform))), tag + 'انزلاق سلس بين الموضعين');
    await p.evaluate(() => { const g = __game, S = g.S; const car = S.player.caravans[0]; car.left = 0; car.city = 'cairo'; g.renderAll(true); }); await p.waitForTimeout(100);
    ok(await p.locator('#map .map-caravan.moving').count() === 0 && await p.locator('#map .map-done').count() === 0, tag + 'عند الوقوف لا غبار ولا مسار');
    ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), tag + 'بلا تمرير أفقي');
    await ctx.close();
  }
  ok(errs.length === 0, 'بلا أخطاء JS ' + errs.join('|'));
  await b.close(); console.log(fails ? fails + ' فشل' : 'كلها نجحت'); process.exit(fails ? 1 : 0);
})();
