// أيقونات المكتب الإحدى عشرة: node test/office-icons-ui.test.js
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path'); const URL = 'file://' + path.join(__dirname, '../index.html') + '?learn=1&seed=16';
(async () => {
  const b = await chromium.launch(); let fails = 0; const errs = [];
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
  for (const vp of [{ width: 390, height: 900 }, { width: 820, height: 900 }]) {
    const tag = vp.width + 'px: ';
    const ctx = await b.newContext({ viewport: vp }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL); await p.waitForFunction(() => !!window.__game);
    await p.evaluate(() => { const g = __game, S = g.S; g.setSpeed(0); const A = g.E.A; A.learnSetChar(S, 'trader'); S.noLock = 1; Object.assign(S.learn, { intro: 11, level: 11, stage: 23, stageIntro: 22, free: true, zseen: 1, datePend: false, tab: Object.keys(g.E.BAB.TABLETS) }); for (const k of ['tq', 'eq', 'fq', 'rq', 'up', 'stageUp', 'sq', 'cq', 'bq', 'csq']) S.learn[k] = []; S.player.fixedEma = 100; S.player.gold = 250; S.player.wallet.sar = 250; S.lastAway = { day: S.day, days: 3, change: 50, empty: [], events: [] }; g.go('office'); g.renderAll(true); });
    await p.waitForTimeout(400);
    const off = p.locator('.office');
    ok(await off.locator('h2 img.oic').count() === 1, tag + 'أيقونة المكتب في العنوان');
    ok(await off.locator('[data-ofc=cashlow] img.oic').count() === 1 && /لا يكفي/.test(await off.locator('[data-ofc=cashlow]').innerText()), tag + 'تنبيه السيولة بأيقونته');
    ok(await off.locator('[data-ofc=lastaway] img.oic').count() === 1, tag + 'تقرير الغياب بأيقونته');
    await p.evaluate(() => { const S = __game.S; S.player.gold = 5000; S.player.wallet.sar = 5000; __game.renderAll(true); });
    ok(await p.locator('.office [data-ofc=cashlow]').count() === 0, tag + 'لا تنبيه حين يكفي النقد');
    ok(await p.locator('#hVault img.vault-art').count() === 1, tag + 'الحصّالة بصورتها');
    await p.evaluate(() => { __game.go('cities'); __game.renderAll(true); try { __game.salem(true, 'lessons'); } catch (e) {} });
    const broken = await p.evaluate(() => [...document.querySelectorAll('img.oic,img.vault-art')].filter(i => i.complete && i.naturalWidth === 0).length);
    ok(broken === 0, tag + 'لا صورة معطوبة');
    ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), tag + 'بلا تمرير أفقي');
    await ctx.close();
  }
  ok(errs.length === 0, 'بلا أخطاء JS ' + errs.join('|'));
  await b.close(); console.log(fails ? fails + ' فشل' : 'كلها نجحت'); process.exit(fails ? 1 : 0);
})();
