// سوق المواشي بالتبويبات: node test/livestock-tabs-ui.test.js
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path'); const URL = 'file://' + path.join(__dirname, '../index.html') + '?seed=4';
(async () => {
  const b = await chromium.launch(); let fails = 0; const errs = [];
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
  for (const vp of [{ width: 390, height: 800 }, { width: 1100, height: 800 }]) {
    const tag = vp.width + 'px: ';
    const ctx = await b.newContext({ viewport: vp }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL); await p.waitForTimeout(2200);
    await p.evaluate(() => { const g = __game, S = g.S; g.E.A.learnSetChar(S, 'trader'); S.noLock = 1; S.learn.level = 11; ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'cq', 'rq'].forEach(k => S.learn[k] = []); S.phase = 3; S.player.caravans[0].city = 'riyadh'; S.player.caravans[0].left = 0; g.go('market'); g.renderAll(true); });
    await p.waitForTimeout(300);
    await p.locator('#screen [data-mf=live]').first().click(); await p.waitForTimeout(250);
    const tabs = await p.locator('#screen .subtabs [data-act=msub]').count();
    ok(tabs >= 3, tag + 'تبويبات أنواع المواشي (' + tabs + ')');
    const all = await p.locator('#screen .gcard').count();
    const second = p.locator('#screen .subtabs [data-act=msub]').nth(1); const sp = await second.getAttribute('data-g');
    await second.click(); await p.waitForTimeout(250);
    const n = await p.locator('#screen .gcard').count();
    ok(n >= 1 && n <= all && await p.locator('#screen .subtabs .on').getAttribute('data-g') === sp, tag + 'تبويب ' + sp + ' يرشّح البطاقات (' + n + ' من ' + all + ')');
    await p.locator('#screen .subtabs [data-act=msub][data-g=all]').click(); await p.waitForTimeout(250);
    ok(await p.locator('#screen .gcard').count() === all, tag + 'تبويب الكل يعيدها');
    ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), tag + 'بلا تمرير أفقي');
    await ctx.close();
  }
  ok(errs.length === 0, 'بلا أخطاء JS ' + errs.join('|'));
  await b.close(); console.log(fails ? fails + ' فشل' : 'كلها نجحت'); process.exit(fails ? 1 : 0);
})();
