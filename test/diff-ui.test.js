// اختيار الصعوبة من ملف التاجر: node test/diff-ui.test.js
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path'); const URL = 'file://' + path.join(__dirname, '../index.html') + '?seed=4&learn=1';
(async () => {
  const b = await chromium.launch(); let fails = 0; const errs = [];
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
  for (const vp of [{ width: 390, height: 800 }, { width: 1100, height: 800 }]) {
    const tag = vp.width + 'px: ';
    const ctx = await b.newContext({ viewport: vp }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL); await p.waitForTimeout(2200);
    await p.evaluate(() => { const g = __game, S = g.S; g.E.A.learnSetChar(S, 'trader'); S.learn.intro = 1; ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'rq'].forEach(k => S.learn[k] = []); g.renderAll(true); });
    await p.waitForTimeout(300);
    await p.locator('#hProfile, [data-act=profile]').first().click(); await p.waitForTimeout(300);
    ok(await p.locator('#profile [data-act=diff]').count() === 3 && await p.locator('#profile [data-act=diff].on').count() === 1, tag + 'ثلاثة خيارات والعادي مختار');
    await p.locator('#profile [data-act=diff][data-k=hard]').click(); await p.waitForTimeout(300);
    ok(await p.evaluate(() => __game.S.diff === 'hard' && __game.E.diffOf(__game.S) === 1.4), tag + 'اختيار صعب يُطبَّق');
    ok(await p.locator('#profile [data-act=diff][data-k=hard].on').count() === 1, tag + 'الاختيار ظاهر');
    await p.locator('#profile [data-act=diff][data-k=calm]').click(); await p.waitForTimeout(300);
    ok(await p.evaluate(() => __game.E.diffOf(__game.S) === 0.6), tag + 'هادئ');
    await ctx.close();
  }
  ok(errs.length === 0, 'بلا أخطاء JS ' + errs.join('|'));
  await b.close(); console.log(fails ? fails + ' فشل' : 'كلها نجحت'); process.exit(fails ? 1 : 0);
})();
