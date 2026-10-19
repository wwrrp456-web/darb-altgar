// واجهة المساومة ودفتر التاجر: node test/haggle-ui.test.js
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path'); const URL = 'file://' + path.join(__dirname, '../index.html') + '?learn=1&seed=4';
(async () => {
  const b = await chromium.launch(); let fails = 0; const errs = [];
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
  for (const vp of [{ width: 390, height: 800 }, { width: 1100, height: 800 }]) {
    const tag = vp.width + 'px: ';
    const ctx = await b.newContext({ viewport: vp }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL); await p.waitForTimeout(2200);
    await p.evaluate(() => { const g = __game, S = g.S; g.E.A.learnSetChar(S, 'trader'); S.learn.intro = 5; S.learn.level = 5; ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'rq'].forEach(k => S.learn[k] = []); S.player.gold = 50000; S.cities.riyadh.stock.coffee = 500; g.go('market'); g.renderAll(true); });
    await p.waitForTimeout(300);
    await p.locator('.gcard[data-gd=coffee] .top').first().click(); await p.waitForTimeout(250);
    ok(await p.locator('#modal .haggle [data-act=haggle][data-side=buy]').count() === 1, tag + 'زر المساومة على الشراء في ورقة السلعة');
    await p.locator('#modal [data-act=haggle][data-side=buy]').click(); await p.waitForTimeout(250);
    ok(await p.locator('#modal [data-act=hgchoose]').count() === 3, tag + 'ثلاثة أساليب للإقناع');
    for (let i = 0; i < 3; i++) {
      await p.evaluate(() => { ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'rq'].forEach(k => __game.S.learn[k] = []); __game.renderAll(true); });
      const best = await p.evaluate(() => { const G = __game.S.player.hg.game; return G && !G.done ? __game.E.HG_BEST[G.moods[G.round]] : null; });
      if (!best) break; await p.locator('#modal [data-act=hgchoose][data-c=' + best + ']').click(); await p.waitForTimeout(200);
    }
    ok(await p.evaluate(() => __game.S.player.hg.game.done && __game.S.player.hg.game.wins === 3), tag + 'ثلاث إصابات متتالية');
    ok(/اتفقتما/.test(await p.locator('#modal .haggle').innerText()), tag + 'نتيجة الاتفاق ظاهرة');
    await p.locator('#modal [data-act=hgclose]').click(); await p.waitForTimeout(200);
    ok(/اتفاقك: خصم 6٪/.test(await p.locator('#modal .haggle').innerText()), tag + 'القسيمة ظاهرة بعد الإغلاق');
    await p.keyboard.press('Escape');
    // الدفتر
    await p.evaluate(() => __game.salem(true, 'journal')); await p.waitForTimeout(250);
    ok(await p.locator('#salemPanel .jtabs button').count() === 3, tag + 'الدفتر بثلاثة أقسام');
    ok(/أتممتَها/.test(await p.locator('#salemPanel').innerText()), tag + 'المهام المنجزة في الدفتر');
    await p.locator('#salemPanel [data-act=jtab][data-g=clues]').click(); await p.waitForTimeout(200);
    ok(await p.locator('#salemPanel .clue').count() >= 1, tag + 'الخيوط تعرض ما بقي لاكتشافه');
    await p.locator('#salemPanel [data-act=jtab][data-g=album]').click(); await p.waitForTimeout(200);
    ok(/ذكريات جدّك/.test(await p.locator('#salemPanel').innerText()), tag + 'الألبوم يجمع الحكايات');
    ok(await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), tag + 'لا تمرير أفقي');
    await ctx.close();
  }
  ok(errs.length === 0, 'لا أخطاء JS ' + errs.join('|'));
  await b.close(); console.log(fails ? fails + ' FAIL' : 'ALL OK'); process.exit(fails ? 1 : 0);
})();
