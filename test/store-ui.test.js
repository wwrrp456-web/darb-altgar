// تفاصيل بضاعة القافلة وإنزالها في المخزن بأسهم الكمية: node test/store-ui.test.js
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path'); const URL = 'file://' + path.join(__dirname, '../index.html') + '?seed=3';
(async () => {
  const b = await chromium.launch(); let fails = 0; const errs = [];
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
  for (const vp of [{ width: 390, height: 800 }, { width: 1100, height: 800 }]) {
    const tag = vp.width + 'px: ';
    const ctx = await b.newContext({ viewport: vp }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL); await p.waitForTimeout(2200);
    await p.evaluate(() => { const g = __game, S = g.S, E = g.E, A = E.A; A.learnSetChar(S, 'trader'); S.learn.intro = 1; S.learn.level = 5; ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'rq'].forEach(k => S.learn[k] = []); S.phase = 2; S.player.gold += 30000;
      const car = S.player.caravans[0], c = S.cities[car.city]; A.buildShop(S, car.city); A.buildWarehouse(S, car.city);
      const gd = E.GIDS.find(x => x !== 'wheat' && E.sells(c, x)); c.stock[gd] = 5000; A.buy(S, car.id, gd, 6); window.__gd = gd; g.go('caravan'); g.renderAll(true); });
    await p.waitForTimeout(300);
    const gd = await p.evaluate(() => window.__gd);
    ok(await p.locator('[data-act=cargo]').count() >= 1, tag + 'أنواع الحمولة قابلة للضغط');
    await p.locator('[data-act=cargo]').first().click(); await p.waitForTimeout(250);
    const txt = await p.locator('#modal').innerText();
    ok(!(await p.locator('#modal').isHidden()) && /الكمية معك/.test(txt) && /الوزن الذي تشغله/.test(txt) && /متوسط تكلفتك/.test(txt), tag + 'النافذة تعرض الكمية والوزن والتكلفة');
    ok(/السعر المعتاد/.test(txt) && /أفضل أماكن البيع/.test(txt), tag + 'وفيها السعر المعتاد وأفضل أماكن البيع');
    ok(await p.locator('#modal [data-act=stow]').count() === 1, tag + 'وفيها إيداع بالأسهم لأن لك مخزناً هنا');
    await p.locator('#modal [data-act=qstep][data-d="1"]').first().click(); await p.waitForTimeout(150);
    ok(await p.evaluate(() => +document.querySelector('#modal .qin').value) === 2, tag + 'السهم يرفع الكمية إلى ٢');
    const before = await p.evaluate(g => Math.floor(__game.S.player.caravans[0].cargo[g]), gd);
    await p.locator('#modal [data-act=stow]').click(); await p.waitForTimeout(250);
    const after = await p.evaluate(g => ({ c: Math.floor(__game.S.player.caravans[0].cargo[g] || 0), s: Math.floor(__game.S.player.props[__game.S.player.caravans[0].city].store[g] || 0) }), gd);
    ok(before - after.c === 2 && after.s === 2, tag + 'أُودعت وحدتان فقط (' + before + '←' + after.c + '، المخزن ' + after.s + ')');
    await p.locator('#modal [data-act=cgclose]').click(); await p.waitForTimeout(200);
    ok(await p.locator('#modal').isHidden(), tag + 'الإغلاق يخفي النافذة');
    await p.evaluate(() => { __game.go('estate'); __game.renderAll(true); }); await p.waitForTimeout(300);
    ok(await p.locator('.strow').count() >= 1, tag + 'العقارات: صف لكل بضاعة بأسهم الكمية');
    await p.locator('.strow [data-act=qstep][data-d="1"]').first().click(); await p.waitForTimeout(150);
    await p.locator('.strow [data-act=unstow]').first().click(); await p.waitForTimeout(250);
    const aft2 = await p.evaluate(g => ({ c: Math.floor(__game.S.player.caravans[0].cargo[g] || 0), s: Math.floor(__game.S.player.props[__game.S.player.caravans[0].city].store[g] || 0) }), gd);
    ok(aft2.c === after.c + 2 && aft2.s === 0, tag + 'تحميل وحدتين فقط من المخزن (' + JSON.stringify(aft2) + ')');
    ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), tag + 'بلا تمرير أفقي');
    await ctx.close();
  }
  ok(errs.length === 0, 'بلا أخطاء JS ' + errs.join('|'));
  await b.close(); console.log(fails ? 'ERRORS: ' + fails : 'كل شيء سليم'); process.exit(fails ? 1 : 0);
})();
