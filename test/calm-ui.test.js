// طبقة انتباه واحدة: لا إنجاز ولا رسالة عائمة فوق بطاقة مفتوحة أو رحلة جارية، وتظهر بعد الفراغ: node test/calm-ui.test.js
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path'); const URL = 'file://' + path.join(__dirname, '../index.html') + '?learn=1&seed=4';
(async () => {
  const b = await chromium.launch(); let fails = 0; const errs = [];
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
  for (const vp of [{ width: 390, height: 800 }, { width: 1100, height: 800 }]) {
    const tag = vp.width + 'px: ';
    const p = await (await b.newContext({ viewport: vp })).newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL); await p.waitForTimeout(900);
    await p.evaluate(() => { const g = __game, S = g.S, E = g.E; E.A.learnSetChar(S, 'trader'); S.learn.level = 11; S.learn.intro = 11; S.learn.free = true; ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'rq', 'cq'].forEach(k => S.learn[k] = []); g.go('map'); g.renderAll(true); });
    // إنجاز أثناء الرحلة: يبقى في الطابور ولا يظهر
    await p.evaluate(() => { const g = __game, S = g.S, m = S.player.caravans[0]; const d = S.order.find(i => i !== m.city && S.cities[i].country === S.cities[m.city].country); g.E.A.travel(S, m.id, d); S.ach = S.ach || {}; S.ach.q = [g.E.ACHD.LIST[0].id]; g.renderAll(true); });
    await p.waitForTimeout(600);
    ok(await p.evaluate(() => __game.S.ach.q.length === 1 && !document.getElementById('toast').classList.contains('show')), tag + 'إنجاز أثناء الرحلة: لا إشعار فوق اللاعب ويبقى في الطابور');
    // بعد الوصول يظهر
    await p.evaluate(() => { const g = __game, m = g.S.player.caravans[0]; m.left = 0; m.city = m.dest || m.city; ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'rq', 'cq'].forEach(k => g.S.learn[k] = []); g.renderAll(true); });
    await p.waitForTimeout(4500);
    ok(await p.evaluate(() => __game.S.ach.q.length === 0), tag + 'بعد الوصول يُعرض الإنجاز ويفرغ الطابور');
    // درس مفتوح: الإنجاز ينتظر حتى يُغلق
    await p.evaluate(() => { const g = __game; g.S.ach.q = [g.E.ACHD.LIST[1].id]; g.S.learn.tq = ['cure2']; g.renderAll(true); });
    await p.waitForTimeout(2500);
    ok(await p.evaluate(() => __game.S.ach.q.length === 1 && !__game.calmNow()), tag + 'مع درس مفتوح يبقى الإنجاز في الطابور');
    await p.evaluate(() => { const g = __game; g.S.learn.tq = []; g.renderAll(true); }); await p.waitForTimeout(4500);
    ok(await p.evaluate(() => __game.S.ach.q.length === 0), tag + 'وبعد إغلاق الدرس يظهر');
    // بطاقة تجهيز الرحلة مفتوحة: غير هادئ
    await p.evaluate(() => { const g = __game, S = g.S, m = S.player.caravans[0]; const d = S.order.find(i => i !== m.city); g.dealGo('wheat', d, 5); });
    ok(await p.evaluate(() => !__game.calmNow()) && await p.locator('.tprep').count() === 1, tag + 'مع بطاقة التجهيز المفتوحة لا شيء يعلوها');
    ok(errs.length === 0, tag + 'بلا أخطاء JS ' + errs.join('|'));
  }
  await b.close(); console.log(fails ? 'ERRORS: ' + fails : 'كل شيء سليم'); process.exit(fails ? 1 : 0);
})();
