// زكاة بهيمة الأنعام في الواجهة: غرض القطيع والواجب والإخراج: node test/zakat-an-ui.test.js
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path'); const URL = 'file://' + path.join(__dirname, '../index.html') + '?learn=1&seed=3';
(async () => {
  const b = await chromium.launch(); let fails = 0; const errs = [];
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
  for (const vp of [{ width: 390, height: 800 }, { width: 1100, height: 800 }]) {
    const tag = vp.width + 'px: ';
    const ctx = await b.newContext({ viewport: vp }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL); await p.waitForTimeout(900);
    await p.evaluate(() => { const g = __game, S = g.S; g.E.A.learnSetChar(S, 'trader'); S.learn.level = 11; S.learn.intro = 11; S.player.gold = 60000; ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'rq', 'cq'].forEach(k => S.learn[k] = []); S.noShocks = true; const car = S.player.caravans[0]; car.herd = { sheep: 120, camel: 5 }; car.herders = 5; S.zakat.start = S.day - 360; g.E.tick(S); S.pause = false; g.go('market'); g.renderAll(true); });
    await p.waitForTimeout(500);
    ok(await p.evaluate(() => __game.S.zakat.due === true), tag + 'حال الحول');
    let txt = await p.locator('#lesson').innerText();
    ok(/زكاة بهيمة الأنعام/.test(txt) && /للتجارة والبيع/.test(txt) && /للرعي والنسل/.test(txt), tag + 'يظهر خيار غرض القطيع');
    ok(!/النصاب 40/.test(txt), tag + 'بغرض التجارة لا يظهر جدول الأنصبة');
    await p.locator('#lesson [data-act=zhm][data-g=sawm]').click(); await p.waitForTimeout(400);
    txt = await p.locator('#lesson').innerText();
    ok(/النصاب 40/.test(txt) && /النصاب 5\b/.test(txt) && /1 شاة/.test(txt), tag + 'للرعي والنسل: جدول الأنصبة والواجب (شاة للغنم وشاة للإبل)');
    ok(await p.locator('#lesson [data-act=zan]').count() === 2, tag + 'زرّا الإخراج: عيناً ونقداً');
    ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1 && document.querySelector('#lesson').scrollWidth <= innerWidth + 1), tag + 'بلا تمرير أفقي');
    const sheep0 = await p.evaluate(() => Math.floor(__game.S.player.caravans[0].herd.sheep));
    await p.locator('#lesson [data-act=zan][data-g=kind]').click(); await p.waitForTimeout(500);
    ok(await p.evaluate(() => __game.S.zakat.anLeft === 0 && Math.floor(__game.S.player.caravans[0].herd.sheep) < 120), tag + 'الإخراج عيناً يخصم من القطيع');
    const left = await p.evaluate(() => ({ due: __game.S.zakat.due, amt: __game.S.zakat.amount }));
    if (left.due && left.amt > 0) { await p.locator('#lesson [data-act=zpay]').click(); await p.waitForTimeout(400); }
    ok(await p.evaluate(() => !__game.S.zakat.due), tag + 'بعد زكاة المال وزكاة الأنعام ينتهي الحول');
    await ctx.close();
  }
  ok(errs.length === 0, 'بلا أخطاء JS ' + errs.join('|'));
  await b.close(); console.log(fails ? 'ERRORS: ' + fails : 'كل شيء سليم'); process.exit(fails ? 1 : 0);
})();
