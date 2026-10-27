// درس الزكاة يُفتح من المكتب عند بلوغ النصاب: node test/zakat-lesson-ui.test.js
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path'); const URL = 'file://' + path.join(__dirname, '../index.html') + '?learn=1&seed=4&side=1';
(async () => {
  const b = await chromium.launch(); let fails = 0; const errs = [];
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
  const ctx = await b.newContext({ viewport: { width: 390, height: 800 } }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
  await p.goto(URL); await p.waitForTimeout(2200);
  await p.evaluate(() => { const g = __game, S = g.S; g.E.A.learnSetChar(S, 'trader'); S.learn.intro = 6; S.learn.level = 6; ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'cq', 'rq'].forEach(k => S.learn[k] = []); S.zakat.start = null; S.learn.zseen = 0; g.go('home'); g.renderAll(true); });
  await p.waitForTimeout(300);
  ok(!/درس الزكاة جاهز/.test(await p.locator('#screen').innerText()), 'قبل النصاب لا بطاقة');
  await p.evaluate(() => { __game.S.zakat.start = __game.S.day; __game.renderAll(true); }); await p.waitForTimeout(300);
  ok(await p.evaluate(() => document.getElementById('lesson').hidden), 'بلوغ النصاب لا يقتحم الشاشة');
  ok(/درس الزكاة جاهز/.test(await p.locator('#screen').innerText()), 'بطاقة المكتب تظهر');
  await p.locator('#screen [data-act=zlopen]').first().click(); await p.waitForTimeout(300);
  ok(/زكاة عروض التجارة/.test(await p.locator('#lesson').innerText()), 'الزر يفتح الدرس');
  for (let i = 0; i < 12 && await p.evaluate(() => !document.getElementById('lesson').hidden); i++) {
    await p.evaluate(() => { const n = document.querySelector('#lesson [data-act=lans][data-g]'); const q = __game.learnNext(); const bt = document.querySelector('#lesson .opt:not([disabled])'); if (bt) { const ok = __game.E.LS.ZAKAT_LESSON.quiz; } });
    const opts = await p.locator('#lesson .opt:not([disabled])').count();
    if (opts) { for (let k = 0; k < opts && await p.locator('#lesson [data-act=lnext]').count() === 0; k++) { await p.locator('#lesson .opt:not([disabled])').first().click(); await p.waitForTimeout(80); } }
    const nx = p.locator('#lesson [data-act=lnext]'); if (await nx.count()) await nx.first().click(); else { const c = p.locator('#lesson [data-act=lclose]:not([disabled])'); if (await c.count()) await c.first().click(); }
    await p.waitForTimeout(120);
  }
  ok(await p.evaluate(() => __game.S.learn.zseen === 1 && document.getElementById('lesson').hidden), 'يكتمل ويُسجَّل');
  ok(!/درس الزكاة جاهز/.test(await p.locator('#screen').innerText()), 'تختفي البطاقة بعده');
  ok(errs.length === 0, 'بلا أخطاء JS ' + errs.join('|'));
  await b.close(); console.log(fails ? fails + ' فشل' : 'كلها نجحت'); process.exit(fails ? 1 : 0);
})();
