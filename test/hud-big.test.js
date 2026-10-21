// أرقام كبيرة في الشريط العلوي والمصغّر: مختصرة (K وM وB) ولا تخرج عن إطارها: node test/hud-big.test.js
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path'); const URL = 'file://' + path.join(__dirname, '../index.html') + '?learn=1&seed=3';
(async () => {
  const b = await chromium.launch(); let fails = 0; const errs = [];
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
  for (const vp of [{ width: 320, height: 700 }, { width: 360, height: 740 }, { width: 390, height: 800 }]) {
    for (const [sar, usd, au, tag, want] of [[800, 0, 0, 'صغيرة', /800/], [1100, 25000, 12500, 'ألوف', /1\.1K/], [2345678, 987654, 54321, 'ملايين', /2\.3M/], [4.2e9, 1.5e9, 2.5e6, 'مليارات', /4\.2B/]]) {
      const t = vp.width + 'px ' + tag + ': ';
      const ctx = await b.newContext({ viewport: vp }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
      await p.goto(URL); await p.waitForTimeout(800);
      await p.evaluate(([sar, usd, au]) => { const g = __game, S = g.S; g.E.A.learnSetChar(S, 'trader'); S.learn.level = 11; S.learn.free = true; ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'rq', 'cq'].forEach(k => S.learn[k] = []); S.player.wallet.sar = sar; S.player.wallet.usd = usd; S.player.wallet.au = au; g.go('home'); g.renderAll(true); }, [sar, usd, au]);
      await p.waitForTimeout(400);
      const full = await p.evaluate(() => [...document.querySelectorAll('#top .wtile b, #top #hNW')].map(e => ({ t: e.textContent.trim(), cut: e.scrollWidth > e.clientWidth + 1 })));
      ok(full.every(x => !x.cut), t + 'خانات الشريط الكامل لا تُقتطع ' + JSON.stringify(full.filter(x => x.cut)));
      ok(full.some(x => want.test(x.t)), t + 'الاختصار المتوقع ' + want + ' في ' + full.map(x => x.t).join('|'));
      await p.evaluate(() => { window.scrollTo(0, 99999); }); await p.waitForTimeout(700);
      const mini = await p.evaluate(() => { const m = document.getElementById('hmini'); return m && m.classList.contains('show') ? [...m.querySelectorAll('.mchip')].filter(c => c.offsetParent).map(c => { const s = c.querySelector('span'); return { t: s.textContent.trim(), w: s.getBoundingClientRect().width, cut: s.scrollWidth > s.clientWidth + 1, over: c.getBoundingClientRect().right > innerWidth + 1 || c.getBoundingClientRect().left < -1 }; }) : null; });
      ok(mini && mini.length >= 2 && mini.every(x => !x.cut && !x.over) && mini.slice(0, 2).every(x => x.w > 20), t + 'الشريط المصغّر: لا اقتطاع ولا خروج عن الشاشة ' + JSON.stringify(mini));
      ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), t + 'بلا تمرير أفقي');
      await ctx.close();
    }
  }
  ok(errs.length === 0, 'بلا أخطاء JS ' + errs.join('|'));
  await b.close(); console.log(fails ? 'ERRORS: ' + fails : 'كل شيء سليم'); process.exit(fails ? 1 : 0);
})();
