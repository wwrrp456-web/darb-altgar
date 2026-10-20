// الفضة في الواجهة وعملات الدول: node test/silver-ui.test.js
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path'); const URL = 'file://' + path.join(__dirname, '../index.html') + '?learn=1&seed=4';
(async () => {
  const b = await chromium.launch(); let fails = 0; const errs = [];
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
  for (const vp of [{ width: 390, height: 800 }, { width: 1100, height: 800 }]) {
    const tag = vp.width + 'px: ';
    let clr; const mkClr = p => { clr = () => p.evaluate(() => { const L = __game.S.learn; ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'rq', 'cq'].forEach(k => L[k] = []); __game.renderAll(true); }); };
    const ctx = await b.newContext({ viewport: vp }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); mkClr(p);
    await p.goto(URL); await p.waitForTimeout(900);
    await p.evaluate(() => { const g = __game, S = g.S; g.E.A.learnSetChar(S, 'trader'); S.learn.intro = 5; S.learn.level = 5; ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'rq'].forEach(k => S.learn[k] = []); g.go('home'); g.renderAll(true); });
    await p.waitForTimeout(250);
    ok(await p.locator('#hSilver').isHidden(), tag + 'الفضة مخفية قبل المستوى ٦ وبلا رصيد');
    await p.evaluate(() => { __game.S.learn.level = 6; __game.S.learn.intro = 6; __game.renderAll(true); }); await p.waitForTimeout(200);
    ok(await p.locator('#hSilver').isVisible(), tag + 'تظهر من المستوى ٦');
    await p.evaluate(() => { const g = __game; g.S.player.wallet.sar = 5000; g.go('cities'); g.renderAll(true); }); await clr(); await p.waitForTimeout(250);
    await p.evaluate(() => { document.querySelector('[data-ct=fx]').click(); }); await p.waitForTimeout(250);
    const t = await p.locator('#screen').innerText();
    ok(/الفضة \(غرام\)/.test(t) && /ضعف الفضة/.test(t), tag + 'بطاقة الفضة والنسبة في الصرافة');
    ok(await p.locator('#fxFrom option[value=ag]').count() === 1 && await p.locator('#fxTo option[value=ag]').count() >= 1, tag + 'الفضة في قوائم الصرف');
    ok(/عملات الدول/.test(t) && /الجنيه المصري/.test(t) && /اليوان الصيني/.test(t) && /الروبية الهندية/.test(t) && /الريال الإيراني/.test(t), tag + 'بطاقة عملات الدول الخمس');
    await p.selectOption('#fxFrom', 'sar'); await p.waitForTimeout(150); await p.selectOption('#fxTo', 'ag'); await p.fill('#fxAmt', '1000'); await p.waitForTimeout(150);
    ok(/فضة/.test(await p.locator('#fxPrev').innerText()), tag + 'معاينة الصرف إلى الفضة');
    await p.evaluate(() => { __game.E.A.exchange(__game.S, 'sar', 'ag', 1000); __game.renderAll(true); }); await clr(); await p.waitForTimeout(250);
    ok(+(await p.evaluate(() => __game.S.player.wallet.ag)) > 100 && /غ|\d/.test(await p.locator('#hSilver').innerText()), tag + 'رصيد الفضة يظهر في الشريط');
    await p.locator('#hSilver').click(); await p.waitForTimeout(250);
    ok(/فضة/.test(await p.locator('#resourceMenu').innerText()), tag + 'قائمة الفضة المنسدلة');
    await p.keyboard.press('Escape');
    // سعر في سوق أجنبي بعملته
    await p.evaluate(() => { const g = __game; g.S.player.caravans[0].city = 'cairo'; g.S.player.caravans[0].left = 0; g.go('market'); g.renderAll(true); }); await clr(); await p.waitForTimeout(350);
    ok(/جنيه/.test(await p.locator('#screen').innerText()), tag + 'أسعار القاهرة تُعرض بالجنيه بجانب الريال');
    ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), tag + 'بلا تمرير أفقي');
    await ctx.close();
  }
  ok(errs.length === 0, 'بلا أخطاء JS ' + errs.join('|'));
  await b.close(); console.log(fails ? 'ERRORS: ' + fails : 'كل شيء سليم'); process.exit(fails ? 1 : 0);
})();
