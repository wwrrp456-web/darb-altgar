// البضاعة المعيبة (واجهة): بطاقة الرد والأرش في السوق: node test/defect-ui.test.js
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path'); const URL = 'file://' + path.join(__dirname, '../index.html') + '?learn=1&seed=3';
(async () => {
  const b = await chromium.launch(); let fails = 0; const errs = [];
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
  for (const vp of [{ width: 390, height: 800 }, { width: 1100, height: 800 }]) {
    const tag = vp.width + 'px: ';
    for (const mode of ['ret', 'arsh']) {
      const ctx = await b.newContext({ viewport: vp }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
      await p.goto(URL); await p.waitForTimeout(900);
      await p.evaluate(() => { const g = __game, S = g.S; g.E.A.learnSetChar(S, 'trader'); S.learn.level = 5; S.learn.intro = 5; S.learn.abroad = true; ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'rq', 'cq'].forEach(k => S.learn[k] = []); S.noShocks = true; S.player.gold = 50000; S.learn.eq = [];
        const car = S.player.caravans[0], c = S.cities[car.city], gd = g.E.GIDS.find(x => g.E.sells(c, x) && !g.E.GD[x].live && c.stock[x] > 50);
        g.E.A.buy(S, car.id, gd, 8); S.defects = [{ id: 99, car: car.id, city: car.city, g: gd, n: 8, cost: 400, day: S.day, st: 'found', k: 8 }]; car.basis[gd].w = car.basis[gd].q * 0.5; S.bosses && S.bosses[car.city] && (S.bosses[car.city].trust = 50);
        S.learn.tab = ['cure1', 'cure2', 'cure3', 'cure4', 'cure5', 'cure6', 'cure7']; S.learn.tq = []; S.learn.sq = []; S.learn.eq = []; S.learn.rq = []; g.go('market'); g.renderAll(true); });
      await p.waitForTimeout(500);
      const card = p.locator('.defcard'); ok(await card.count() === 1, tag + mode + ': بطاقة البضاعة المعيبة تظهر');
      const t = await card.innerText(); ok(/بضاعة معيبة: 8/.test(t) && /طلب رد السلعة المعيبة/.test(t) && /طلب الأرش/.test(t) && /تبقى \d+ يوماً/.test(t), tag + mode + ': نصها وزراها والمهلة');
      ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), tag + mode + ': بلا تمرير أفقي');
      const g0 = await p.evaluate(() => __game.S.player.gold);
      await card.locator(mode === 'ret' ? '[data-act=defret]' : '[data-act=defarsh]').evaluate(el => el.click()); await p.waitForTimeout(500);
      ok(await p.evaluate(() => __game.S.player.gold) === g0 + (mode === 'ret' ? 400 : 200), tag + mode + ': المال بعد ' + (mode === 'ret' ? 'الرد' : 'الأرش'));
      ok(await p.locator('.defcard').count() === 0, tag + mode + ': تختفي البطاقة بعد الطلب');
      await ctx.close();
    }
  }
  ok(errs.length === 0, 'بلا أخطاء JS ' + errs.join('|'));
  await b.close(); console.log(fails ? 'ERRORS: ' + fails : 'كل شيء سليم'); process.exit(fails ? 1 : 0);
})();
