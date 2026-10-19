// واجهة الصدمات وحدث الطريق: node test/shocks-ui.test.js
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path'); const URL = 'file://' + path.join(__dirname, '../index.html') + '?learn=1&seed=4';
(async () => {
  const b = await chromium.launch(); let fails = 0; const errs = [];
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
  for (const vp of [{ width: 390, height: 800 }, { width: 1100, height: 800 }]) {
    const tag = vp.width + 'px: ';
    const ctx = await b.newContext({ viewport: vp }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL); await p.waitForTimeout(2200);
    await p.evaluate(() => { const g = __game, S = g.S; g.E.A.learnSetChar(S, 'trader'); S.learn.intro = 6; S.learn.level = 6; S.learn.abroad = true; ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'rq'].forEach(k => S.learn[k] = []); S.noShocks = true; S.day = 30; S.shocks = [{ id: 9001, k: 'drought', st: 'rumor', warn: 30, start: 33, end: 45, sev: 1, country: 'ir' }, { id: 9002, k: 'closure', st: 'on', warn: 20, start: 23, end: 40, sev: 1, a: 'sa', b: 'eg' }]; g.go('home'); g.renderAll(true); });
    await p.waitForTimeout(300);
    const t = await p.locator('#screen').innerText();
    ok(/تنبيهات السوق/.test(t) && /إشاعة/.test(t) && /جفاف/.test(t) && /إغلاق حدود/.test(t), tag + 'بطاقة التنبيهات: إشاعة وصدمة جارية');
    // حدث طريق
    await p.evaluate(() => { const g = __game, S = g.S, c = S.player.caravans[0]; c.city = 'riyadh'; c.left = 0; c.guards = 1; c.crew = 3; c.cargo = { coffee: 50 }; S.road = { k: 'bandits', day: S.day, car: c.id, to: 'jeddah', from: 'riyadh', B: 10 }; S.pause = true; g.renderAll(true); });
    await p.waitForTimeout(300);
    ok(await p.locator('#dlg [data-act=roadopt]').count() === 3 && /قطاع طرق/.test(await p.locator('#dlg').innerText()), tag + 'نافذة قطاع الطرق بثلاثة خيارات');
    await p.locator('#dlg [data-act=roadopt][data-c=pay]').click(); await p.waitForTimeout(300);
    ok(await p.evaluate(() => __game.S.road === null) && await p.locator('#dlg').isHidden(), tag + 'اختيار الجزية يحسم الحدث ويغلق النافذة');
    ok(await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), tag + 'لا تمرير أفقي');
    await ctx.close();
  }
  ok(errs.length === 0, 'لا أخطاء JS ' + errs.join('|'));
  await b.close(); console.log(fails ? fails + ' FAIL' : 'ALL OK'); process.exit(fails ? 1 : 0);
})();
