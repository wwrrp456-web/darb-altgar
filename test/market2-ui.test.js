// واجهة المنتج الخاص: الحصة، علاوة المسافة، بطاقة الزعيم، لوحة السمعة: node test/market2-ui.test.js
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path'); const URL = 'file://' + path.join(__dirname, '../index.html') + '?seed=3';
(async () => {
  const b = await chromium.launch(); let fails = 0; const errs = [];
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
  for (const vp of [{ width: 390, height: 800 }, { width: 1100, height: 800 }]) {
    const tag = vp.width + 'px: ';
    const ctx = await b.newContext({ viewport: vp }); const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL); await p.waitForTimeout(2200);
    await p.evaluate(() => { const S = __game.S; __game.E.A.learnSetChar(S, 'trader'); S.learn.intro = 1; S.learn.level = 3; S.phase = 2; S.player.gold += 30000; __game.go('market'); __game.renderAll(true); });
    await p.waitForTimeout(300);
    ok(await p.locator('.gcard[data-gd=perfume] .quota').count() === 0, tag + 'قبل المستوى ٤ لا حصة على بطاقة العطور');
    await p.evaluate(() => { __game.S.learn.level = 4; __game.renderAll(true); }); await p.waitForTimeout(300);
    ok(await p.locator('.gcard[data-gd=perfume] .quota').count() === 1, tag + 'من المستوى ٤: بطاقة منتج الرياض الخاص فيها حصتك');
    ok(await p.locator('.gcard[data-gd=wheat] .quota').count() === 0, tag + 'القمح بلا حصة');
    ok(/منتج خاص بهذا السوق/.test(await p.locator('.gcard[data-gd=perfume]').innerText()), tag + 'شارة المنتج الخاص');
    // استهلاك الرصيد ثم رسالة الحد
    await p.evaluate(() => { const g = __game, c = g.S.cities.riyadh; c.stock.perfume = 5000; g.S.player.caravans[0].carts = 40; g.E.A.buy(g.S, g.S.player.caravans[0].id, 'perfume', 9999); g.renderAll(true); });
    await p.waitForTimeout(300);
    ok(/حصتك|انتهت|لا يكفي|بلغتَ/.test(await p.locator('.gcard[data-gd=perfume]').innerText()), tag + 'البطاقة تشرح أن الحصة نفدت');
    // علاوة المسافة في سوق بعيد
    await p.evaluate(() => { const g = __game; g.S.player.caravans[0].cargo.perfume = 5; g.S.player.caravans[0].city = 'shanghai'; g.S.player.known = g.S.player.known || {}; g.renderAll(true); });
    await p.locator('[data-city=shanghai]').first().click().catch(() => {}); await p.waitForTimeout(300);
    const card = await p.locator('.gcard[data-gd=perfume]').first().innerText();
    ok(/علاوة المسافة \+\d+٪/.test(card), tag + 'بطاقة العطور في شنغهاي تعرض علاوة المسافة');
    ok(await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), tag + 'لا تمرير أفقي في السوق');
    // شاشة الزعماء
    await p.evaluate(() => { const g = __game; g.S.player.caravans[0].city = 'riyadh'; g.go('lords'); g.renderAll(true); });
    await p.locator('[data-lcity=riyadh]').first().click().catch(() => {}); await p.waitForTimeout(300);
    ok(/حصتك اليومية من عطور/.test(await p.locator('#screen').innerText()), tag + 'بطاقة الزعيم تعرض الحصة اليومية');
    ok(/عقد حصري/.test(await p.locator('#screen').innerText()), tag + 'العقد الحصري ضمن العروض');
    ok(await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), tag + 'لا تمرير أفقي في الزعماء');
    // ملف التاجر
    await p.locator('[data-act=profile]').first().click(); await p.waitForTimeout(300);
    const pf = await p.locator('#profile').innerText();
    ok(/سمعة التاجر/.test(pf) && ['الوفاء بالأقساط', 'إتمام العقود', 'ثقة الزعماء', 'الإتقان', 'الوفاء بالزكاة'].every(t => pf.includes(t)), tag + 'لوحة السمعة بأشرطتها الخمسة في ملف التاجر');
    ok(await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), tag + 'لا تمرير أفقي في الملف');
    await ctx.close();
  }
  ok(errs.length === 0, 'لا أخطاء JS ' + errs.join('|'));
  await b.close(); console.log(fails ? fails + ' FAIL' : 'ALL OK'); process.exit(fails ? 1 : 0);
})();
