// شرح كل رتبة في هرم الفريق عند الضغط عليها: node test/team-rank-info-ui.test.js
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path'); const URL = 'file://' + path.join(__dirname, '../index.html') + '?learn=1&seed=16';
(async () => {
  const b = await chromium.launch(); let fails = 0; const errs = [];
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
  for (const vp of [{ width: 390, height: 900 }, { width: 820, height: 900 }]) {
    const tag = vp.width + 'px: ';
    const ctx = await b.newContext({ viewport: vp }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL); await p.waitForFunction(() => !!window.__game);
    await p.evaluate(() => { const g = __game, S = g.S; g.setSpeed(0); const A = g.E.A; A.learnSetChar(S, 'trader'); S.noLock = 1; Object.assign(S.learn, { intro: 11, level: 11, stage: 23, stageIntro: 22, free: true, zseen: 1, datePend: false, tab: Object.keys(g.E.BAB.TABLETS) }); for (const k of ['tq', 'eq', 'fq', 'rq', 'up', 'stageUp', 'sq', 'cq', 'bq', 'csq']) S.learn[k] = []; S.phase = 4; S.player.wallet.sar = 1e6; A.buildShop(S, 'riyadh'); A.buildWarehouse(S, 'riyadh'); g.go('estate'); g.renderAll(true); });
    await p.waitForTimeout(400);
    const card = p.locator('.team-card');
    ok(await card.locator('.rank-panel').count() === 0, tag + 'لا شرح قبل الضغط');
    for (const [rank, word] of [[1, 'البائع يبيع'], [2, 'يعدّل الأسعار'], [3, 'يشرف على كل ممتلكات'], [4, 'لم تُفعَّل']]) {
      await p.evaluate(r => document.querySelector('.team-card [data-act=teamrank][data-g="' + r + '"]').click(), rank); await p.waitForTimeout(200);
      const t = await card.locator('.rank-panel').innerText();
      ok(t.includes(word) && /مهمته/.test(t) && /ما تستفيده/.test(t), tag + 'شرح الرتبة ' + rank);
      if (rank === 2) ok(/هل يستحق/.test(t) && /التكلفة/.test(t), tag + 'الرتبة 2: التكلفة وهل يستحق');
    }
    await p.evaluate(() => document.querySelector('.team-card [data-act=teamrank][data-g="4"]').click()); await p.waitForTimeout(200);
    ok(await card.locator('.rank-panel').count() === 0, tag + 'الضغط الثاني يطوي الشرح');
    ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), tag + 'بلا تمرير أفقي');
    await ctx.close();
  }
  ok(errs.length === 0, 'بلا أخطاء JS ' + errs.join('|'));
  await b.close(); console.log(fails ? fails + ' فشل' : 'كلها نجحت'); process.exit(fails ? 1 : 0);
})();
