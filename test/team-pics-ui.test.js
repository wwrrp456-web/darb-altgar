// صور فريق العمل في هرم الفريق والمزرعة والمصنع: node test/team-pics-ui.test.js
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path'); const URL = 'file://' + path.join(__dirname, '../index.html') + '?learn=1&seed=16';
(async () => {
  const b = await chromium.launch(); let fails = 0; const errs = [];
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
  for (const vp of [{ width: 390, height: 900 }, { width: 820, height: 900 }]) {
    const tag = vp.width + 'px: ';
    const ctx = await b.newContext({ viewport: vp }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL); await p.waitForFunction(() => !!window.__game);
    await p.evaluate(() => { const g = __game, S = g.S; g.setSpeed(0); const A = g.E.A; A.learnSetChar(S, 'trader'); S.noLock = 1; Object.assign(S.learn, { intro: 11, level: 11, stage: 23, stageIntro: 22, free: true, zseen: 1, datePend: false, tab: Object.keys(g.E.BAB.TABLETS) }); for (const k of ['tq', 'eq', 'fq', 'rq', 'up', 'stageUp', 'sq', 'cq', 'bq', 'csq']) S.learn[k] = []; S.phase = 4; S.player.wallet.sar = 1e6; A.buildShop(S, 'riyadh'); A.buildWarehouse(S, 'riyadh'); A.buildFarm(S, 'riyadh'); const car = S.player.caravans[0]; car.city = 'riyadh'; car.left = 0; g.go('estate'); g.renderAll(true); });
    await p.waitForTimeout(400);
    const team = await p.locator('.team-card .team-pics img[data-art^="team/"]').count();
    ok(team === 4, tag + 'هرم الفريق: أربع صور (' + team + ')');
    ok(await p.locator('.team-pics .tp.on').count() === 1, tag + 'الرتبة الحالية مميّزة');
    ok(await p.locator('.farm img[data-art="team/farmer"]').count() >= 1, tag + 'صورة المزارع في شروط المزرعة');
    ok(await p.locator('.farm img[data-art="team/shepherd"]').count() >= 1 || await p.locator('details[data-dk=farmadd] img[data-art="team/shepherd"]').count() >= 1, tag + 'صورة الراعي في إضافة المواشي');
    const broken = await p.evaluate(() => [...document.querySelectorAll('img[data-art^="team/"]')].filter(i => i.complete && i.naturalWidth === 0).length);
    ok(broken === 0, tag + 'لا صورة معطوبة');
    ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), tag + 'بلا تمرير أفقي');
    await ctx.close();
  }
  ok(errs.length === 0, 'بلا أخطاء JS ' + errs.join('|'));
  await b.close(); console.log(fails ? fails + ' فشل' : 'كلها نجحت'); process.exit(fails ? 1 : 0);
})();
