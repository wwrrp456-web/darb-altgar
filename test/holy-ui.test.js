// مكة والمدينة في الواجهة: السوق والخريطة والزعيم: node test/holy-ui.test.js
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path'); const URL = 'file://' + path.join(__dirname, '../index.html') + '?learn=1&seed=3';
(async () => {
  const b = await chromium.launch(); let fails = 0; const errs = [];
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
  for (const vp of [{ width: 390, height: 800 }, { width: 1100, height: 800 }]) {
    const tag = vp.width + 'px: ';
    const ctx = await b.newContext({ viewport: vp }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL); await p.waitForTimeout(900);
    await p.evaluate(() => { const g = __game, S = g.S; g.E.A.learnSetChar(S, 'trader'); S.learn.level = 11; S.learn.intro = 11; S.learn.abroad = true; S.learn.free = true; S.phase = 3; S.player.gold = 60000; ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'rq', 'cq'].forEach(k => S.learn[k] = []); g.go('map'); g.renderAll(true); });
    await p.waitForTimeout(300);
    const names = await p.locator('#map [data-city]').evaluateAll(els => els.map(e => e.getAttribute('aria-label')));
    ok(names.some(n => /مكة المكرمة/.test(n)) && names.some(n => /المدينة المنورة/.test(n)), tag + 'المدينتان على الخريطة');
    await p.evaluate(() => { __game.go('market'); __game.renderAll(true); }); await p.waitForTimeout(250);
    for (const [id, nm] of [['mecca', 'مكة المكرمة'], ['medina', 'المدينة المنورة']]) {
      await p.selectOption('#mktCity', id); await p.waitForTimeout(350);
      const txt = await p.locator('#screen').innerText();
      ok(txt.includes(nm) && await p.locator('img.banner, .plaza .plz-bg').count() >= 1, tag + nm + ': السوق وصورة المدينة');
      ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), tag + nm + ': بلا تمرير أفقي');
    }
    await ctx.close();
  }
  ok(errs.length === 0, 'بلا أخطاء JS ' + errs.join('|'));
  await b.close(); console.log(fails ? 'ERRORS: ' + fails : 'كل شيء سليم'); process.exit(fails ? 1 : 0);
})();
