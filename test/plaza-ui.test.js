// ساحة الرياض والحوارات والمهام في الواجهة: node test/plaza-ui.test.js
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path'); const URL = 'file://' + path.join(__dirname, '../index.html') + '?learn=1&seed=4';
(async () => {
  const b = await chromium.launch(); let fails = 0; const errs = [];
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
  for (const vp of [{ width: 390, height: 800 }, { width: 1100, height: 800 }]) {
    const tag = vp.width + 'px: ';
    const ctx = await b.newContext({ viewport: vp }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL); await p.waitForTimeout(2200);
    await p.evaluate(() => { const g = __game, S = g.S; g.E.A.learnSetChar(S, 'trader'); S.learn.intro = 5; S.learn.level = 5; ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'rq'].forEach(k => S.learn[k] = []); S.player.gold = 20000; S.cities.riyadh.stock.coffee = 500; g.go('market'); g.renderAll(true); });
    await p.waitForTimeout(300);
    ok(await p.locator('.plaza .spot').count() === 3, tag + 'ساحة الرياض بثلاث نقاط ضغط');
    ok(await p.evaluate(() => { const r = document.querySelector('.plaza .plz-bg').getBoundingClientRect(); return r.width > 300 && r.height > 100; }), tag + 'صورة المشهد ظاهرة');
    await p.locator('.plaza .spot[data-g=riyadh_boss]').click(); await p.waitForTimeout(250);
    ok(await p.locator('#dlg .dlg-box').isVisible() && /أهلاً بك في سوق الرياض/.test(await p.locator('#dlg').innerText()), tag + 'حوار الزعيم يفتح بالمقدمة');
    ok(await p.locator('#dlg img.dlg-face').count() === 1, tag + 'صورة الزعيم بتعبيره');
    await p.locator('#dlg [data-act=dlgopt]').first().click(); await p.waitForTimeout(250);
    ok(/ماذا تريد يا ولدي/.test(await p.locator('#dlg').innerText()), tag + 'الانتقال إلى قائمة الخيارات');
    const g0 = await p.evaluate(() => __game.S.player.gold);
    await p.locator('#dlg [data-act=dlgopt]', { hasText: 'هديةً' }).click(); await p.waitForTimeout(250);
    ok(await p.evaluate(g => __game.S.player.gold === g - 100, g0), tag + 'الهدية تخصم 100');
    await p.keyboard.press('Escape'); await p.waitForTimeout(200);
    ok(await p.locator('#dlg').isHidden(), tag + 'Esc يغلق الحوار');
    // التاجر والمهمة
    await p.locator('.plaza .spot[data-g=riyadh_trader]').click(); await p.waitForTimeout(250);
    await p.locator('#dlg [data-act=dlgopt]').nth(1).click(); await p.waitForTimeout(200);
    await p.locator('#dlg [data-act=dlgopt]', { hasText: 'تحتاج' }).click(); await p.waitForTimeout(200);
    await p.locator('#dlg [data-act=dlgopt]', { hasText: 'أبشر' }).click(); await p.waitForTimeout(250);
    ok(await p.evaluate(() => __game.E.questState(__game.S, 'q_coffee') === 'active') && await p.locator('#dlg').isHidden(), tag + 'قبول المهمة وإغلاق الحوار');
    await p.evaluate(() => { __game.E.A.buy(__game.S, 1, 'coffee', 8); __game.salem(true, 'journal'); }); await p.waitForTimeout(300);
    ok(/قهوة لعرس/.test(await p.locator('#salemPanel').innerText()) && /معك 8 من 8/.test(await p.locator('#salemPanel').innerText()), tag + 'المهمة في الدفتر مع التقدّم');
    await p.evaluate(() => { ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'rq'].forEach(k => __game.S.learn[k] = []); __game.salem(false); }); await p.waitForTimeout(250);
    await p.locator('.plaza .spot[data-g=riyadh_trader]').click(); await p.waitForTimeout(250);
    await p.locator('#dlg [data-act=dlgopt]', { hasText: 'هذه ثمان' }).click(); await p.waitForTimeout(250);
    ok(await p.evaluate(() => __game.E.questState(__game.S, 'q_coffee') === 'done'), tag + 'تسليم المهمة');
    await p.locator('#dlg [data-act=dlgclose]').click(); await p.waitForTimeout(200);
    // مدينة بلا مشهد
    await p.evaluate(() => { __game.go('market'); const sel = document.querySelector('#mktCity'); }); await p.selectOption('#mktCity', 'jeddah'); await p.waitForTimeout(250);
    ok(await p.locator('.plaza').count() === 0, tag + 'مدينة بلا مشهد: اللافتة العادية');
    await p.selectOption('#mktCity', 'riyadh'); await p.waitForTimeout(250);
    ok(await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), tag + 'لا تمرير أفقي');
    await ctx.close();
  }
  ok(errs.length === 0, 'لا أخطاء JS ' + errs.join('|'));
  await b.close(); console.log(fails ? fails + ' FAIL' : 'ALL OK'); process.exit(fails ? 1 : 0);
})();
