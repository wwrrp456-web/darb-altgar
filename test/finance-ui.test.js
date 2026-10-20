// واجهة التمويل المشروع: node test/finance-ui.test.js
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path'); const URL = 'file://' + path.join(__dirname, '../index.html') + '?seed=4';
(async () => {
  const b = await chromium.launch(); let fails = 0; const errs = [];
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
  for (const vp of [{ width: 390, height: 800 }, { width: 1100, height: 800 }]) {
    const tag = vp.width + 'px: ';
    const ctx = await b.newContext({ viewport: vp }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL); await p.waitForTimeout(2200);
    await p.evaluate(() => { const g = __game, S = g.S; S.phase = 4; S.player.gold = 60000; const car = S.player.caravans[0]; car.city = 'riyadh'; car.left = 0; S.cities.riyadh.stock.coffee = 500; S.bosses.riyadh.trust = 40; g.go('empire'); g.renderAll(true); });
    await p.waitForTimeout(300);
    const t = await p.locator('#screen').innerText();
    ok(/المضاربة/.test(t) && /تمويل المرابحة/.test(t) && /القرض الحسن/.test(t) && /صكوك المشاركة/.test(t), tag + 'الأقسام الأربعة ظاهرة');
    ok(!/فائدة 0\.25|سند حرب|اقترض 5000/.test(t), tag + 'لا فوائد ولا سندات حرب');
    await p.locator('[data-act=invest][data-q="1000"]').click(); await p.waitForTimeout(250);
    ok(await p.evaluate(() => __game.S.player.bank.dep.riyadh === 1000), tag + 'مضاربة بألف');
    ok(/الثمن الآن/.test(await p.locator('#screen').innerText()), tag + 'عرض المرابحة الحي');
    await p.selectOption('[data-mur=g]', 'coffee'); await p.waitForTimeout(200);
    await p.locator('[data-mur=q]').fill('12'); await p.locator('[data-mur=q]').dispatchEvent('change'); await p.waitForTimeout(200);
    await p.selectOption('[data-mur=t]', '60'); await p.waitForTimeout(200);
    ok(/60 يوماً/.test(await p.locator('#screen .fin').nth(1).innerText()) || /بعد 60 يوماً/.test(await p.locator('#screen').innerText()), tag + 'الأجل المختار 60 يوماً يظهر في الحساب');
    const g0 = await p.evaluate(() => __game.S.player.gold);
    await p.locator('[data-act=murabaha]').click(); await p.waitForTimeout(250);
    ok(await p.evaluate(g => __game.S.player.gold === g && __game.S.player.bank.loans.length === 1 && __game.S.player.bank.loans[0].due === __game.S.day + 60, g0), tag + 'تمويل المرابحة بلا نقد وبأجل 60');
    ok(/التزاماتك/.test(await p.locator('#screen').innerText()) && /مرابحة/.test(await p.locator('#screen').innerText()), tag + 'قائمة الالتزامات');
    await p.locator('[data-act=qard][data-q="1000"]').click(); await p.waitForTimeout(250);
    ok(await p.evaluate(() => __game.S.player.bank.loans.some(l => l.type === 'qard')), tag + 'قرض حسن من الزعيم');
    await p.locator('[data-act=sukuk]').click(); await p.waitForTimeout(250);
    ok(await p.evaluate(() => __game.S.player.bank.bonds.length === 1), tag + 'صك مشاركة');
    await p.locator('[data-act=settle][data-id=""]').click(); await p.waitForTimeout(250);
    ok(await p.evaluate(() => __game.S.player.bank.loans.length === 0), tag + 'سداد الكل');
    ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), tag + 'بلا تمرير أفقي');
    await ctx.close();
  }
  ok(errs.length === 0, 'بلا أخطاء JS ' + errs.join('|'));
  await b.close(); console.log(fails ? fails + ' فشل' : 'كلها نجحت'); process.exit(fails ? 1 : 0);
})();
