// كتابة الحوار حرفاً حرفاً: node test/typing-ui.test.js
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path'); const URL = 'file://' + path.join(__dirname, '../index.html') + '?learn=1&seed=4&type=1';
(async () => {
  const b = await chromium.launch(); let fails = 0; const errs = [];
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
  for (const vp of [{ width: 390, height: 800 }, { width: 1100, height: 800 }]) {
    const tag = vp.width + 'px: ';
    const ctx = await b.newContext({ viewport: vp }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL); await p.waitForTimeout(2200);
    await p.evaluate(() => { const g = __game, S = g.S; g.E.A.learnSetChar(S, 'trader'); S.learn.intro = 5; S.learn.level = 5; ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'rq'].forEach(k => S.learn[k] = []); g.go('market'); g.renderAll(true); });
    await p.waitForTimeout(300);
    const full = 'أهلاً بك في سوق الرياض';
    await p.locator('.plaza .spot[data-g=riyadh_boss]').click(); await p.waitForTimeout(150);
    const t1 = (await p.locator('#dlg .dlg-say').innerText()).length;
    ok(t1 < 40 && await p.locator('#dlg .dlg-say.typing').count() === 1, tag + 'النص يبدأ جزئياً (' + t1 + ' حرفاً)');
    ok(await p.locator('#dlg .dlg-opts.wait').count() === 1, tag + 'الخيارات مخفية أثناء الكتابة');
    await p.waitForTimeout(700); const t2 = (await p.locator('#dlg .dlg-say').innerText()).length;
    ok(t2 > t1, tag + 'يزداد النص مع الوقت (' + t1 + '→' + t2 + ')');
    await p.evaluate(() => { __game.renderAll(true); }); await p.waitForTimeout(100);
    ok((await p.locator('#dlg .dlg-say').innerText()).length >= t2, tag + 'إعادة الرسم لا تعيد الكتابة من أولها');
    await p.locator('#dlg .dlg-say').click(); await p.waitForTimeout(100);
    const txt = await p.locator('#dlg .dlg-say').innerText();
    ok(txt.includes(full) && txt.length > 100 && await p.locator('#dlg .dlg-say.typing').count() === 0, tag + 'النقر يكمل النص كاملاً');
    ok(await p.locator('#dlg .dlg-opts.wait').count() === 0 && await p.locator('#dlg .dlg-opts button').first().isVisible(), tag + 'ظهرت الخيارات');
    await p.locator('#dlg [data-act=dlgopt]').first().click(); await p.waitForTimeout(150);
    ok(await p.locator('#dlg .dlg-say.typing').count() === 1, tag + 'الرد التالي يُكتب من جديد');
    await p.waitForTimeout(2500);
    ok(/ماذا تريد يا ولدي/.test(await p.locator('#dlg .dlg-say').innerText()) && await p.locator('#dlg .dlg-opts.wait').count() === 0, tag + 'ينتهي الرد تلقائياً وتظهر الخيارات');
    ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), tag + 'بلا تمرير أفقي');
    await ctx.close();
  }
  // الاختبارات الآلية بلا ?type=1: النص فوري
  const c2 = await b.newContext({ viewport: { width: 390, height: 800 } }); const q = await c2.newPage();
  await q.goto(URL.replace('&type=1', '')); await q.waitForTimeout(2200);
  await q.evaluate(() => { const g = __game, S = g.S; g.E.A.learnSetChar(S, 'trader'); S.learn.intro = 5; S.learn.level = 5; ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'rq'].forEach(k => S.learn[k] = []); g.go('market'); g.renderAll(true); });
  await q.waitForTimeout(300); await q.locator('.plaza .spot[data-g=riyadh_boss]').click(); await q.waitForTimeout(150);
  ok(/أهلاً بك في سوق الرياض/.test(await q.locator('#dlg .dlg-say').innerText()) && await q.locator('#dlg .dlg-say.typing').count() === 0, 'في الأتمتة النص فوري');
  ok(errs.length === 0, 'بلا أخطاء JS ' + errs.join('|'));
  await b.close(); console.log(fails ? fails + ' فشل' : 'كلها نجحت'); process.exit(fails ? 1 : 0);
})();
