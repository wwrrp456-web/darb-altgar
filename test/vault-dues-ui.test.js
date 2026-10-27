// تنبيه الحصّالة «مستحقات متأخرة» يعرض تفاصيله وزر سداد: node test/vault-dues-ui.test.js
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path'); const URL = 'file://' + path.join(__dirname, '../index.html') + '?learn=1&seed=16';
(async () => {
  const b = await chromium.launch(); let fails = 0; const errs = [];
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
  const ctx = await b.newContext({ viewport: { width: 390, height: 900 } }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
  await p.goto(URL); await p.waitForFunction(() => !!window.__game);
  await p.evaluate(() => { const g = __game, S = g.S; g.setSpeed(0); const A = g.E.A; A.learnSetChar(S, 'trader'); S.noLock = 1; Object.assign(S.learn, { intro: 11, level: 11, stage: 23, stageIntro: 22, free: true, zseen: 1, datePend: false, tab: Object.keys(g.E.BAB.TABLETS) }); for (const k of ['tq', 'eq', 'fq', 'rq', 'up', 'stageUp', 'sq', 'cq', 'bq', 'csq']) S.learn[k] = []; S.player.vault = 5000; S.player.gold = 100; S.player.wallet.sar = 100; S.paymentDues = [{ id: 1, city: 'riyadh', kind: 'staff', cat: 'staff', label: 'أجور العمّال', amount: 320, since: S.day - 4 }]; S.paymentNext = 1; g.go('home'); g.renderAll(true); document.getElementById('hVault').click(); });
  await p.waitForTimeout(400);
  const panel = p.locator('#vaultPanel');
  ok(await panel.locator('.vault-dues').count() === 1, 'تفاصيل المستحقات ظاهرة');
  ok(/أجور العمّال/.test(await panel.locator('.vault-dues').innerText()) && /320/.test(await panel.locator('.vault-dues').innerText()), 'نوع المستحق والمبلغ');
  ok(await panel.locator('[data-act=settlepayment]').isDisabled(), 'زر السداد معطّل والنقد لا يكفي');
  ok(/اسحب من حصّالتك/.test(await panel.locator('.vault-dues').innerText()), 'يرشد إلى السحب من الحصّالة أولاً');
  await p.evaluate(() => { __game.S.player.gold = 1000; __game.S.player.wallet.sar = 1000; __game.renderAll(true); });
  await p.waitForTimeout(300);
  ok(!(await panel.locator('[data-act=settlepayment]').isDisabled()), 'بعد توفر النقد يتفعّل السداد');
  await p.evaluate(() => document.querySelector('#vaultPanel [data-act=settlepayment]').click()); await p.waitForTimeout(400);
  ok(await p.evaluate(() => (__game.S.paymentDues || []).length === 0), 'السداد يمحو المستحق');
  ok(await p.locator('#vaultPanel .vault-dues').count() === 0, 'وتختفي التفاصيل');
  ok(errs.length === 0, 'بلا أخطاء JS ' + errs.join('|'));
  await b.close(); console.log(fails ? fails + ' فشل' : 'كلها نجحت'); process.exit(fails ? 1 : 0);
})();
