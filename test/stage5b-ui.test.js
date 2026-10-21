// واجهة المواسم والمنافس: node test/stage5b-ui.test.js
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path'); const URL = 'file://' + path.join(__dirname, '../index.html') + '?learn=1&seed=4';
(async () => {
  const b = await chromium.launch(); let fails = 0; const errs = [];
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
  for (const vp of [{ width: 390, height: 800 }, { width: 1100, height: 800 }]) {
    const tag = vp.width + 'px: ';
    const ctx = await b.newContext({ viewport: vp }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL); await p.waitForTimeout(2200);
    await p.evaluate(() => { const g = __game, S = g.S, A = g.E.A; A.learnSetChar(S, 'trader'); S.learn.intro = 6; S.learn.level = 6; ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'rq'].forEach(k => S.learn[k] = []); g.E.dateOf(S, 0); S.day = g.E.dayOfHijri(S, 9, 6, 0); S.noShocks = false; g.go('home'); g.renderAll(true); });
    await p.waitForTimeout(300);
    ok(await p.locator('.season').count() >= 1 && /شهر رمضان/.test(await p.locator('.season').first().innerText()), tag + 'بطاقة موسم رمضان في الرئيسية');
    ok(/الطلب على التمر/.test(await p.locator('.season').first().innerText()), tag + 'تذكر السلع المتأثرة');
    await p.evaluate(() => { const g = __game; g.S.day = 80; g.S.rival = null; for (let i = 0; i < 3; i++) g.E.tick(g.S); g.S.rival.gold = 15000; ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'rq'].forEach(k => g.S.learn[k] = []); g.renderAll(true); });
    await p.locator('#hProfile, [data-act=profile]').first().click(); await p.waitForTimeout(300);
    const t = await p.locator('#profile').innerText();
    ok(/منافسك/.test(t) && /يتقدمك|الصدارة/.test(t), tag + 'بطاقة المنافس في ملف التاجر');
    ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), tag + 'بلا تمرير أفقي');
    await ctx.close();
  }
  ok(errs.length === 0, 'بلا أخطاء JS ' + errs.join('|'));
  await b.close(); console.log(fails ? fails + ' فشل' : 'كلها نجحت'); process.exit(fails ? 1 : 0);
})();
