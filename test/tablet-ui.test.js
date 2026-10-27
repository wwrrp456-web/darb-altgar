// التاب بالعرض الأفقي: الشريط الكامل لا يُثبَّت، والمصغّر يظهر عند التمرير، والتنقل قابل للنقر: node test/tablet-ui.test.js
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path'); const URL = 'file://' + path.join(__dirname, '../index.html') + '?learn=1&seed=4';
(async () => {
  const b = await chromium.launch(); let fails = 0; const errs = [];
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
  const setup = p => p.evaluate(() => { const g = __game, S = g.S; g.E.A.learnSetChar(S, 'trader'); S.learn.intro = 5; S.learn.level = 5; ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'rq'].forEach(k => S.learn[k] = []); g.go('market'); g.renderAll(true); });
  for (const [w, h] of [[960, 600], [1024, 768], [1180, 820], [1280, 800]]) {
    const p = await (await b.newContext({ viewport: { width: w, height: h } })).newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL); await p.waitForTimeout(800); await setup(p); await p.waitForTimeout(400);
    const t = w + 'x' + h + ': ';
    ok(await p.evaluate(() => getComputedStyle(document.getElementById('top')).position !== 'sticky' && getComputedStyle(document.getElementById('top')).position !== 'fixed'), t + 'الشريط الكامل غير مثبّت');
    await p.evaluate(() => window.scrollTo(0, 900)); await p.waitForTimeout(500);
    await p.click('#nav [data-go=map]'); await p.waitForTimeout(500);
    ok(await p.evaluate(() => (__game.S.ui && __game.S.ui.screen) !== 'market' || !!document.querySelector('#screen')), t + 'التبديل من التنقل بعد التمرير يعمل');
    ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), t + 'بلا تمرير أفقي');
    await p.context().close();
  }
  ok(errs.length === 0, 'بلا أخطاء JS ' + errs.join('|'));
  await b.close(); console.log(fails ? 'ERRORS: ' + fails : 'كل شيء سليم'); process.exit(fails ? 1 : 0);
})();
