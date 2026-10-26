// تقرير الأسطول وتعليمات القوافل في شاشة الإمبراطورية: node test/fleetrep-ui.test.js
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path'); const URL = 'file://' + path.join(__dirname, '../index.html') + '?learn=1&seed=4';
(async () => {
  const b = await chromium.launch(); let fails = 0; const errs = [];
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
  for (const vp of [{ width: 390, height: 800 }, { width: 1100, height: 800 }]) {
    const tag = vp.width + 'px: ';
    const p = await (await b.newContext({ viewport: vp })).newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL); await p.waitForTimeout(900);
    await p.evaluate(() => { const g = __game, S = g.S; g.E.A.learnSetChar(S, 'trader'); S.noLock = 1; S.learn.level = 11; S.learn.intro = 11; S.learn.free = true; S.phase = 2; S.player.gold = 90000; ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'rq', 'cq'].forEach(k => S.learn[k] = []); g.go('empire'); g.renderAll(true); }); await p.waitForTimeout(400);
    ok(await p.locator('.fleetrep').count() === 0, tag + 'بلا قادة: لا تقرير');
    ok(await p.evaluate(() => { const d = document.querySelector('.howto[data-dk=howto-fleet]'); return !!d && d.open; }), tag + 'تعليمات القوافل مفتوحة تلقائياً (لا قادة بعد)');
    await p.evaluate(() => { const g = __game; g.E.A.hireCaptain(g.S, 0); g.renderAll(true); }); await p.waitForTimeout(300);
    ok(await p.locator('.fleetrep').count() === 1 && /تقرير الأسطول/.test(await p.locator('.fleetrep').innerText()), tag + 'بعد توظيف قائد: «تقرير الأسطول» يظهر');
    const t = await p.locator('.fleetrep').innerText();
    ok(/بلا مسار|يستعد|واقف/.test(t), tag + 'فيه حالة القافلة: ' + t.replace(/\s+/g, ' ').slice(0, 90));
    ok(await p.evaluate(() => { const d = document.querySelector('.howto[data-dk=howto-fleet]'); return !!d && !d.open; }), tag + 'وتُطوى التعليمات بعد وجود قائد');
  }
  ok(errs.length === 0, 'بلا أخطاء JS ' + errs.join(' | ')); await b.close(); console.log(fails ? fails + ' FAIL' : 'ALL OK'); process.exit(fails ? 1 : 0);
})();
