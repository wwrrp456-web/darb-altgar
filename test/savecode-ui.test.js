// تصدير الحفظ واستيراده من ملف التاجر: node test/savecode-ui.test.js
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path'); const URL = 'file://' + path.join(__dirname, '../index.html') + '?learn=1&seed=4';
(async () => {
  const b = await chromium.launch(); let fails = 0; const errs = [];
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
  for (const vp of [{ width: 390, height: 800 }, { width: 1100, height: 800 }]) {
    const tag = vp.width + 'px: ';
    const ctx = await b.newContext({ viewport: vp }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL); await p.waitForTimeout(2200);
    await p.evaluate(() => { const g = __game, S = g.S; g.E.A.learnSetChar(S, 'trader'); S.learn.intro = 1; ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'rq'].forEach(k => S.learn[k] = []); S.player.gold = 12345; g.renderAll(true); });
    await p.waitForTimeout(300);
    await p.locator('#hProfile, [data-act=profile]').first().click(); await p.waitForTimeout(300);
    ok(await p.locator('#profile [data-act=savecode]').count() === 1, tag + 'زر إنشاء رمز الحفظ في الملف');
    await p.locator('#profile [data-act=savecode]').click(); await p.waitForTimeout(300);
    const code = await p.locator('#scOut').inputValue(); ok(/^DT1-/.test(code) && code.length > 200, tag + 'ظهر رمز يبدأ بـ DT1 (' + code.length + ' حرفاً)');
    // تغيير الحالة ثم الاستعادة من الرمز
    await p.evaluate(() => { __game.S.player.gold = 1; __game.persist && __game.persist(); });
    await p.locator('#scIn').fill(code); await p.locator('#profile [data-act=saveimport]').click(); await p.waitForTimeout(200);
    ok(/متأكد/.test(await p.locator('#profile').innerText()), tag + 'تأكيد قبل الاستعادة');
    await p.locator('#profile [data-act=saveno]').click(); await p.waitForTimeout(150);
    ok(await p.evaluate(() => __game.S.player.gold) === 1, tag + 'الرفض لا يغيّر شيئاً');
    await p.locator('#scIn').fill(code); await p.locator('#profile [data-act=saveimport]').click(); await p.waitForTimeout(150);
    await Promise.all([p.waitForNavigation({ waitUntil: 'load', timeout: 8000 }).catch(() => {}), p.locator('#profile [data-act=saveimport]').click()]); await p.waitForTimeout(2500);
    const g = await p.evaluate(() => (window.__game && __game.S.player.gold) || -1); ok(Math.abs(g - 12345) < 5, tag + 'الاستعادة أعادت الرصيد (' + Math.round(g) + ')');
    await p.locator('[data-act=profile]').first().click(); await p.waitForTimeout(300);
    await p.locator('#scIn').fill('DT1-xxxx'); await p.locator('#profile [data-act=saveimport]').click(); await p.waitForTimeout(150); await p.locator('#profile [data-act=saveimport]').click(); await p.waitForTimeout(250);
    ok(/ناقص|تالف|غير/.test(await p.locator('#toast').innerText()), tag + 'رمز تالف: رسالة عربية واضحة (' + (await p.locator('#toast').innerText()).slice(0, 40) + ')');
    ok(await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), tag + 'لا تمرير أفقي');
    await ctx.close();
  }
  ok(errs.length === 0, 'لا أخطاء JS ' + errs.join('|'));
  await b.close(); console.log(fails ? fails + ' FAIL' : 'ALL OK'); process.exit(fails ? 1 : 0);
})();
