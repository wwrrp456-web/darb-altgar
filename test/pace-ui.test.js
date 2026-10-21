// إيقاع السفر في الواجهة: مستويات مؤن السفر، الانتظار الفعلي، المشهد العابر: node test/pace-ui.test.js
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path'); const URL = 'file://' + path.join(__dirname, '../index.html') + '?learn=1&seed=3';
(async () => {
  const b = await chromium.launch(); let fails = 0; const errs = [];
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
  for (const vp of [{ width: 390, height: 800 }, { width: 1100, height: 800 }]) {
    const tag = vp.width + 'px: ';
    const ctx = await b.newContext({ viewport: vp }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL); await p.waitForTimeout(900);
    await p.evaluate(() => { const g = __game, S = g.S; g.E.A.learnSetChar(S, 'trader'); S.learn.level = 11; S.learn.intro = 11; S.learn.abroad = true; S.learn.free = true; S.phase = 3; S.player.gold = 60000; ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'rq', 'cq'].forEach(k => S.learn[k] = []); g.go('map'); g.renderAll(true); });
    await p.waitForTimeout(300);
    await p.evaluate(() => { __game.go('market'); __game.renderAll(true); }); await p.waitForTimeout(300);
    ok(await p.locator('.packcard').count() === 1, tag + 'بطاقة مؤن السفر في السوق');
    await p.locator('.packcard [data-act=qstep][data-d="1"]').first().click(); await p.waitForTimeout(150);
    const q1 = await p.evaluate(() => +document.querySelector('.packcard .qin').value);
    await p.locator('[data-act=buypack]').click(); await p.waitForTimeout(250);
    ok(q1 === 6 && await p.evaluate(() => __game.S.player.caravans[0].pack) === 6 && /معك 6/.test(await p.locator('.packcard').innerText()), tag + 'السهم يرفع الكمية والشراء يضيفها للمخزون (' + q1 + ')');
    await p.evaluate(() => { __game.go('map'); __game.renderAll(true); }); await p.waitForTimeout(300);
    await p.evaluate(() => document.querySelector('button[data-city=cairo]').click()); await p.waitForTimeout(300);
    ok(await p.locator('.pacebox').count() === 1 && await p.locator('.pacebox [data-act=pacelv]').count() === 3, tag + 'لوحة مؤن السفر بثلاثة مستويات');
    ok(/نفقة الطريق/.test(await p.locator('.map-panel').innerText()) && !/\bالمؤن\b/.test(await p.locator('.map-panel').innerText()), tag + 'المؤن الإلزامية سُمّيت نفقة الطريق');
    const t0 = await p.locator('.pacebox').innerText();
    await p.locator('.pacebox [data-act=pacelv][data-lv="2"]').click(); await p.waitForTimeout(250);
    const t2 = await p.locator('.pacebox').innerText();
    ok(/←/.test(t2) && !/←/.test(t0) && /تستهلك/.test(t2), tag + 'اختيار «أسرع» يعرض الانتظار قبل وبعد والوحدات');
    ok(await p.locator('.pacebox [data-act=pacelv][data-lv="2"]').getAttribute('aria-pressed') === 'true', tag + 'المستوى المختار مضغوط');
    await p.locator('[data-act=go]').first().click(); await p.waitForTimeout(500);
    const st = await p.evaluate(() => { const m = __game.S.player.caravans[0]; return { left: m.left, lv: m.pace && m.pace.lv, ms: m.pace && m.pace.ms, pack: m.pack, total: m.total }; });
    ok(st.left > 0 && st.lv === 2 && st.ms >= 2000 && st.pack >= 0, tag + 'الانطلاق بمستوى أسرع (' + JSON.stringify(st) + ')');
    ok(await p.locator('.jcard').count() === 1 && await p.locator('.journey').count() === 0 && await p.locator('#map .map-caravan.moving').count() >= 1, tag + 'بطاقة رحلة صغيرة بلا منظر مكرر والقافلة تتحرك على الخريطة');
    if (vp.width === 390) {
      await p.evaluate(() => __game.setSpeed(1)); const t1 = Date.now();
      await p.waitForFunction(() => __game.S.player.caravans[0].left < 4, null, { timeout: 15000 });
      const dt = Date.now() - t1;
      ok(dt >= st.ms * 0.8 && dt <= st.ms * 1.6, tag + 'اليوم الأول استغرق ' + dt + ' مللي (المتوقع ' + st.ms + ')');
      await p.waitForSelector('.ambline', { timeout: 3000 }).catch(() => {});
      ok(await p.locator('.ambline').count() === 1, tag + 'ظهر مشهد عابر في بطاقة الرحلة');
      ok(/زمن الرحلة الفعلي/.test(await p.locator('#screen').innerText()), tag + 'بطاقة الرحلة تذكر الزمن الفعلي');
      await p.evaluate(() => __game.setSpeed(0));
    }
    ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), tag + 'بلا تمرير أفقي');
    await ctx.close();
  }
  ok(errs.length === 0, 'بلا أخطاء JS ' + errs.join('|'));
  await b.close(); console.log(fails ? 'ERRORS: ' + fails : 'كل شيء سليم'); process.exit(fails ? 1 : 0);
})();
