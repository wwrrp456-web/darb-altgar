// مشاهد درجات المرافق (تحميل كسول): node test/tier-scenes-ui.test.js
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path'); const URL = 'file://' + path.join(__dirname, '../index.html') + '?learn=1&seed=16';
(async () => {
  const b = await chromium.launch(); let fails = 0; const errs = [];
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
  for (const vp of [{ width: 390, height: 900 }, { width: 820, height: 900 }]) {
    const tag = vp.width + 'px: ';
    const ctx = await b.newContext({ viewport: vp }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL); await p.waitForFunction(() => !!window.__game);
    await p.evaluate(() => { const g = __game, S = g.S; g.setSpeed(0); const A = g.E.A; A.learnSetChar(S, 'trader'); S.noLock = 1; Object.assign(S.learn, { intro: 11, level: 11, stage: 23, stageIntro: 22, free: true, zseen: 1, datePend: false, tab: Object.keys(g.E.BAB.TABLETS) }); for (const k of ['tq', 'eq', 'fq', 'rq', 'up', 'stageUp', 'sq', 'cq', 'bq', 'csq']) S.learn[k] = []; S.phase = 4; S.player.wallet.sar = 1e6; A.buildShop(S, 'riyadh'); A.buildWarehouse(S, 'riyadh'); A.buildFarm(S, 'riyadh'); A.buildButcher(S, 'riyadh'); A.buildFactory(S, 'riyadh', 'perfume'); const car = S.player.caravans[0]; car.city = 'riyadh'; car.left = 0; g.go('estate'); g.renderAll(true); });
    await p.waitForTimeout(600);
    const keys = await p.evaluate(() => [...document.querySelectorAll('#screen img[data-art^="tier/"]')].map(i => i.dataset.art));
    for (const k of ['tier/shop_basic', 'tier/warehouse_empty', 'tier/farm_1', 'tier/butcher']) ok(keys.includes(k), tag + 'مشهد ' + k);
    await p.evaluate(() => { __game.go('empire'); __game.renderAll(true); }); await p.waitForTimeout(500);
    ok(await p.evaluate(() => [...document.querySelectorAll('#screen img[data-art^="tier/"]')].some(i => i.dataset.art === 'tier/perfume_1')), tag + 'مشهد مصنع العطور tier/perfume_1');
    await p.evaluate(() => { __game.go('estate'); __game.renderAll(true); }); await p.waitForTimeout(400);
    // لوحات القصة وبانر سوق المواشي
    await p.evaluate(() => { const g = __game, S = g.S; S.ach = S.ach || { got: {}, q: [] }; S.ach.got = Object.assign(S.ach.got || {}, { own_shop: S.day, factory_first: S.day, trade_first: S.day }); g.go('market'); g.renderAll(true); });
    await p.waitForTimeout(300);
    await p.evaluate(() => document.querySelector('#screen [data-mf=live]').click()); await p.waitForTimeout(300);
    ok(await p.locator('#screen img[data-art="market/livestock_market"]').count() === 1, tag + 'بانر سوق المواشي');
    const tl = await p.evaluate(() => { __game.go('home'); __game.renderAll(true); return typeof timelineHTML === 'function' ? 1 : 0; });
    await p.evaluate(() => { __game.salem(true, 'journal'); }); await p.waitForTimeout(300);
    const ev = await p.evaluate(() => [...document.querySelectorAll('img[data-art^="event/"]')].map(i => i.dataset.art));
    ok(ev.length === 0 || ev.every(k => /^event\/(first_|annual|retire|restart|steward)/.test(k)), tag + 'مفاتيح مشاهد القصة صحيحة (' + ev.join(',') + ')');
    await p.evaluate(() => { __game.go('estate'); __game.renderAll(true); }); await p.waitForTimeout(300);
    const lazy = await p.evaluate(() => [...document.querySelectorAll('#screen img[data-art^="tier/"]')].every(i => i.getAttribute('src').startsWith('img/tier/') && i.getAttribute('loading') === 'lazy'));
    ok(lazy, tag + 'كلها ملفات كسولة وليست داخل الصفحة');
    await p.evaluate(() => { document.querySelectorAll('#screen img[data-art^="tier/"]').forEach(i => { i.loading = 'eager'; }); });
    await p.waitForTimeout(800);
    const broken = await p.evaluate(() => [...document.querySelectorAll('#screen img[data-art^="tier/"]')].filter(i => i.complete && i.naturalWidth === 0).length);
    ok(broken === 0, tag + 'لا مشهد معطوب');
    ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), tag + 'بلا تمرير أفقي');
    await ctx.close();
  }
  ok(errs.length === 0, 'بلا أخطاء JS ' + errs.join('|'));
  await b.close(); console.log(fails ? fails + ' فشل' : 'كلها نجحت'); process.exit(fails ? 1 : 0);
})();
