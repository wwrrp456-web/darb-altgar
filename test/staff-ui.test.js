// واجهة طاقم المتاجر: node test/staff-ui.test.js
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path'); const URL = 'file://' + path.join(__dirname, '../index.html') + '?seed=3';
(async () => {
  const b = await chromium.launch(); let fails = 0; const errs = [];
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
  for (const vp of [{ width: 390, height: 800 }, { width: 1100, height: 800 }]) {
    const tag = vp.width + 'px: ';
    const ctx = await b.newContext({ viewport: vp }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL); await p.waitForTimeout(2200);
    await p.evaluate(() => { const g = __game, S = g.S; g.E.A.learnSetChar(S, 'trader'); S.noLock = 1; S.learn.intro = 1; S.learn.level = 5; S.phase = 2; S.player.gold += 30000; g.E.A.buildShop(S, 'riyadh'); g.E.A.buildWarehouse(S, 'riyadh'); g.go('estate'); g.renderAll(true); });
    await p.locator('[data-estcity=riyadh]').first().click().catch(() => {}); await p.waitForTimeout(300);
    ok(await p.locator('.staff').count() === 1, tag + 'بطاقة الطاقم ظاهرة في العقارات');
    const t = await p.locator('.staff').innerText();
    ok(/بائعون/.test(t) && /أمناء مخازن/.test(t) && /مجاناً/.test(t), tag + 'تعرض الحاجة والعمّال والمجانية');
    ok(await p.locator('[data-act=hirefill]').isDisabled(), tag + 'الطاقم مكتمل فزر التوظيف معطّل');
    await p.locator('[data-act=firestaff]').first().click(); await p.waitForTimeout(250);
    ok(/تبيع \d+٪ فقط|بلا بائع|يتناقص/.test(await p.locator('.staff').innerText()), tag + 'نقص الطاقم يظهر تحذيراً');
    await p.locator('[data-act=hirefill]').click(); await p.waitForTimeout(250);
    ok(await p.evaluate(() => __game.E.sellFactor(__game.S, 'riyadh') >= 1), tag + 'زر الإكمال يعيد الطاقم');
    ok(await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), tag + 'لا تمرير أفقي');
    await ctx.close();
  }
  ok(errs.length === 0, 'لا أخطاء JS ' + errs.join('|'));
  await b.close(); console.log(fails ? fails + ' FAIL' : 'ALL OK'); process.exit(fails ? 1 : 0);
})();
