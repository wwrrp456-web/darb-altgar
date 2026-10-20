// بطاقة الحول واللقب الممتد في الواجهة: node test/freeplay-ui.test.js
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path'); const URL = 'file://' + path.join(__dirname, '../index.html') + '?learn=1&seed=4';
(async () => {
  const b = await chromium.launch(); let fails = 0; const errs = [];
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
  for (const vp of [{ width: 390, height: 800 }, { width: 1100, height: 800 }]) {
    const tag = vp.width + 'px: ';
    const ctx = await b.newContext({ viewport: vp }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL); await p.waitForTimeout(2200);
    await p.evaluate(() => { const g = __game, S = g.S; g.E.A.learnSetChar(S, 'trader'); S.learn.intro = 11; S.learn.level = 11; ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'rq'].forEach(k => S.learn[k] = []); S.noShocks = true; g.E.tick(S); S.learn.cq = []; ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'rq'].forEach(k => S.learn[k] = []); S.player.gold = 600000; g.renderAll(true); });
    await p.waitForTimeout(300);
    ok(/شيخ التجّار|سيّد السوق|صاحب مصانع/.test(await p.locator('#hTitle').innerText()) && /شيخ التجّار/.test(await p.evaluate(() => __game.E.titleOf(__game.E.netWorth(__game.S)))), tag + 'اللقب الممتد يظهر عند 500 ألف');
    await p.locator('#hProfile, [data-act=profile]').first().click(); await p.waitForTimeout(300);
    const t = await p.locator('#profile .yearc').innerText();
    ok(/اللعب الحر/.test(t) && /الحول 1/.test(t) && /نمّ ثروتك/.test(t) && /صفقة رابحة/.test(t) && /أسواق جديدة/.test(t), tag + 'بطاقة الحول بأهدافها الثلاثة');
    await p.evaluate(() => { const g = __game, S = g.S; S.yr.start = S.day - g.E.FREE_YEAR; g.E.tick(S); ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'rq'].forEach(k => S.learn[k] = []); S.learn.cq = []; g.renderAll(true); });
    await p.waitForTimeout(300);
    const t2 = await p.locator('#profile .yearc').innerText();
    ok(/الحول 2/.test(t2) && await p.locator('#profile .yearc table tr').count() >= 2, tag + 'جدول الحولية بعد انتهاء الحول');
    ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), tag + 'بلا تمرير أفقي');
    await ctx.close();
  }
  ok(errs.length === 0, 'بلا أخطاء JS ' + errs.join('|'));
  await b.close(); console.log(fails ? fails + ' فشل' : 'كلها نجحت'); process.exit(fails ? 1 : 0);
})();
