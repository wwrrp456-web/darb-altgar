// الدروس الجانبية لا تقفز فوق اللاعب: node test/side-lessons-ui.test.js
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path'); const URL = 'file://' + path.join(__dirname, '../index.html') + '?learn=1&seed=4&cards=1&side=1';
(async () => {
  const b = await chromium.launch(); let fails = 0; const errs = [];
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
  for (const vp of [{ width: 390, height: 800 }, { width: 1100, height: 800 }]) {
    const tag = vp.width + 'px: ';
    const ctx = await b.newContext({ viewport: vp }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL); await p.waitForTimeout(2200);
    await p.evaluate(() => { const g = __game, S = g.S; g.E.A.learnSetChar(S, 'trader'); S.learn.intro = 6; S.learn.level = 6; ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'rq'].forEach(k => S.learn[k] = []); S.learn.sq = ['sa']; S.learn.cq = ['f_sidq']; S.learn.cards = ['f_sidq']; g.renderAll(true); });
    await p.waitForTimeout(300);
    ok(await p.evaluate(() => document.getElementById('lesson').hidden), tag + 'لا نافذة تلقائية للدروس الجانبية');
    await p.evaluate(() => __game.go('home')); await p.waitForTimeout(250);
    ok(/دروس جانبية/.test(await p.locator('#screen').innerText()), tag + 'بطاقة المكتب تعدّها');
    await p.locator('#screen [data-act=sideopen]').first().click(); await p.waitForTimeout(300);
    ok(await p.evaluate(() => !document.getElementById('lesson').hidden), tag + 'الزر يفتحها');
    for (let i = 0; i < 6 && await p.evaluate(() => !document.getElementById('lesson').hidden); i++) {
      await p.evaluate(() => { const n = __game.learnNext(); if (n && n.k === 'card') { const q = __game.E.CARDS.CARDS[n.id].quiz; if (q) document.querySelector('#lesson [data-act=cqa][data-g="' + q.ok + '"]')?.click(); } });
      await p.waitForTimeout(150);
      await p.evaluate(() => { const c = document.querySelector('#lesson [data-act=lclose]:not([disabled])'); if (c) c.click(); }); await p.waitForTimeout(200);
    }
    ok(await p.evaluate(() => __game.S.learn.cq.length === 0 && __game.S.learn.sq.length === 0), tag + 'تُستهلك الطوابير بعد الفتح');
    ok(await p.evaluate(() => document.getElementById('lesson').hidden), tag + 'تُغلق النافذة بعد آخر درس');
    await p.evaluate(() => { __game.S.learn.csq = ['x']; __game.S.learn.csq = []; __game.S.learn.sq = ['eg']; __game.renderAll(true); }); await p.waitForTimeout(250);
    ok(await p.evaluate(() => document.getElementById('lesson').hidden), tag + 'بعد الإغلاق يعود الإخفاء لدرس جديد');
    ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), tag + 'بلا تمرير أفقي');
    await ctx.close();
  }
  ok(errs.length === 0, 'بلا أخطاء JS ' + errs.join('|'));
  await b.close(); console.log(fails ? fails + ' فشل' : 'كلها نجحت'); process.exit(fails ? 1 : 0);
})();
