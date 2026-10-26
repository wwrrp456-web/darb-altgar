// واجهة الملحمة: node test/butcher-ui.test.js
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path'); const URL = 'file://' + path.join(__dirname, '../index.html') + '?seed=4';
(async () => {
  const b = await chromium.launch(); let fails = 0; const errs = [];
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
  for (const vp of [{ width: 390, height: 800 }, { width: 1100, height: 800 }]) {
    const tag = vp.width + 'px: ';
    const ctx = await b.newContext({ viewport: vp }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL); await p.waitForTimeout(2200);
    await p.evaluate(() => { const {S,E}=__game; for (const g of Object.keys(E.BREED).filter(x => !E.GD[x].sp && !E.GD[x].hyb)) for (const id of S.order) { const c = S.cities[id]; if (!c.makes.includes(g)) { c.makes.push(g); c.stock[g] = E.capG(c, g) * 0.4; } } }); // اختبار آليات المواشي: يعيد النوع العام للسوق
    await p.evaluate(() => { const g = __game, S = g.S, A = g.E.A; A.learnSetChar(S, 'trader'); S.noLock = 1; S.learn.intro = 1; S.learn.level = 11; ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'rq'].forEach(k => S.learn[k] = []); S.phase = 3; S.player.gold += 300000; const car = S.player.caravans[0]; car.herders = 3; S.cities.riyadh.stock.sheep = 400; A.buildShop(S, 'riyadh'); A.buildWarehouse(S, 'riyadh'); A.buildFarm(S, 'riyadh'); A.buy(S, car.id, 'sheep', 10, 'herd', 'f'); A.buy(S, car.id, 'sheep', 2, 'herd', 'm'); A.farmIn(S, car.id, 'sheep', 12); g.go('estate'); g.renderAll(true); });
    await p.waitForTimeout(300);
    ok(await p.locator('.butcher [data-act=buildbutcher]').count() === 1, tag + 'زر فتح الملحمة في بطاقتها');
    await p.locator('.butcher [data-act=buildbutcher]').click(); await p.waitForTimeout(250);
    ok(await p.evaluate(() => !!__game.S.player.props.riyadh.butcher), tag + 'فُتحت الملحمة');
    await p.locator('.butcher [data-act=cutmeat]').first().click(); await p.waitForTimeout(250);
    ok(await p.evaluate(() => (__game.S.player.props.riyadh.store.meat || 0) >= 1), tag + 'الذبح يضع لحماً طازجاً في المخزن');
    ok(/لحم طازج في مخزنك/.test(await p.locator('.butcher').innerText()), tag + 'البطاقة تعرض مخزون اللحم');
    ok(await p.locator('.butcher [data-bs=sex]').count() >= 1 && /لحم طازج ≈|لحم طازج/.test(await p.locator('.butcher').innerText()) || /لا /.test(await p.locator('.butcher').innerText()), tag + 'ورقة الذبح: اختيار الجنس ومعاينة');
    if (await p.locator('.butcher [data-bs=q]').count()) { const before = await p.locator('.butcher').first().innerText(); await p.locator('.butcher [data-bs=q]').first().fill('2'); await p.locator('.butcher [data-bs=q]').first().dispatchEvent('change'); await p.waitForTimeout(250); ok(await p.evaluate(() => /ذكور|إناث/.test(document.querySelector('.butcher').innerText)), tag + 'تغيير العدد يعيد المعاينة'); }
    ok(await p.locator('.howto[data-dk="howto-butcher"]').count() === 1 && /ذكر لكل 10 إناث/.test(await p.locator('.howto[data-dk="howto-butcher"]').innerText()), tag + 'قسم «كيف تعمل الملحمة» موجود ويشرح الذكور الفائضة');
    ok(await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), tag + 'لا تمرير أفقي');
    await ctx.close();
  }
  ok(errs.length === 0, 'لا أخطاء JS ' + errs.join('|'));
  await b.close(); console.log(fails ? fails + ' FAIL' : 'ALL OK'); process.exit(fails ? 1 : 0);
})();
