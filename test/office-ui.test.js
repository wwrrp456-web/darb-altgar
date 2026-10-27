// مكتب التاجر وقائمة المراقبة: node test/office-ui.test.js
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path'); const URL = 'file://' + path.join(__dirname, '../index.html') + '?learn=1&seed=4';
(async () => {
  const b = await chromium.launch(); let fails = 0; const errs = [];
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
  for (const vp of [{ width: 390, height: 800 }, { width: 1100, height: 800 }]) {
    const tag = vp.width + 'px: ';
    const p = await (await b.newContext({ viewport: vp })).newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL); await p.waitForTimeout(900);
    const clr = () => p.evaluate(() => ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'rq', 'cq'].forEach(k => __game.S.learn[k] = []));
    await p.evaluate(() => { const g = __game, S = g.S, E = g.E; E.A.learnSetChar(S, 'trader'); S.learn.level = 11; S.learn.intro = 11; S.learn.free = true; S.player.gold = 50000; E.A.buy(S, S.player.caravans[0].id, 'wheat', 5); g.go('office'); g.renderAll(true); });
    await clr(); await p.evaluate(() => __game.renderAll(true)); await p.waitForTimeout(300);
    ok(await p.locator('.office').count() === 1, tag + 'مكتب التاجر على الرئيسية');
    ok(await p.locator('.office [data-ofc=cargo]').count() === 1, tag + 'بطاقة «قافلتك تحمل…» عند الوقوف ببضاعة');
    await p.evaluate(() => { const S = __game.S; S.zakat = S.zakat || {}; S.zakat.due = true; S.zakat.defer = 0; __game.renderAll(true); }); await p.waitForTimeout(200);
    ok(await p.evaluate(() => document.querySelector('.office .ofc').dataset.ofc) === 'zakat', tag + 'الأكثر استعجالاً (الزكاة) أولاً');
    await p.evaluate(() => { __game.S.zakat.due = false; __game.renderAll(true); });
    // سفر
    await p.evaluate(() => { const g = __game, S = g.S, m = S.player.caravans[0]; const d = S.order.find(i => i !== m.city && S.cities[i].country === S.cities[m.city].country); g.E.A.travel(S, m.id, d); g.go('office'); g.renderAll(true); });
    await clr(); await p.evaluate(() => __game.renderAll(true)); await p.waitForTimeout(200);
    ok(await p.locator('.office [data-ofc=trip]').count() === 1, tag + 'أثناء الرحلة: بطاقة الطريق');
    await p.evaluate(() => { const m = __game.S.player.caravans[0]; m.left = 0; m.city = m.dest; __game.renderAll(true); }); await clr();
    // مراقبة: سعر معلوم يتحقق مرة واحدة
    const city = await p.evaluate(() => __game.S.player.caravans[0].city);
    await p.evaluate(() => { __game.go('office'); __game.renderAll(true); }); await p.waitForTimeout(200);
    await p.evaluate(([c]) => { document.getElementById('wG').value = 'wheat'; document.getElementById('wC').value = c; document.getElementById('wD').value = 'above'; document.getElementById('wT').value = '1'; document.querySelector('[data-act=wadd]').click(); }, [city]); await p.waitForTimeout(300);
    ok(await p.locator('.office [data-ofc=watch0]').count() === 1, tag + 'مراقبة متحققة من سعر معلوم: بطاقة تنبيه');
    await p.evaluate(() => __game.renderAll(true)); await p.evaluate(() => __game.renderAll(true));
    ok(await p.locator('.office [data-ofc=watch0]').count() === 1 && await p.evaluate(() => __game.S.watch.length === 1), tag + 'إعادة الرسم لا تكرر المراقبة');
    const gold0 = await p.evaluate(() => __game.S.player.gold);
    await p.evaluate(() => document.querySelector('.office [data-act=ofwatch]').click()); await p.waitForTimeout(300);
    ok(await p.evaluate(() => location.hash) === '#market', tag + '«راجع الصفقة» تفتح السوق (دون شراء أو بيع)');
    ok(await p.evaluate(() => __game.S.player.gold) === gold0, tag + 'لا تغيير في المال');
    await p.evaluate(() => { __game.go('office'); __game.renderAll(true); }); await p.waitForTimeout(200);
    ok(await p.locator('.office [data-ofc=watch0]').count() === 0, tag + 'بعد المراجعة لا يتكرر التنبيه');
    // مدينة لم تزرها: لا معلومة ولا تنبيه (لا كشف لأسعار محجوبة)
    const far = await p.evaluate(() => { const S = __game.S; return S.order.find(i => !S.player.known[i] && i !== S.player.caravans[0].city); });
    await p.evaluate(([c]) => { document.getElementById('wG').value = 'wheat'; document.getElementById('wC').value = c; document.getElementById('wT').value = '1'; document.querySelector('[data-act=wadd]').click(); }, [far]); await p.waitForTimeout(300);
    ok(far ? await p.locator('.office [data-ofc=watch1]').count() === 0 && /لا معلومة بعد/.test(await p.locator('.office').innerText()) : true, tag + 'مدينة لم تعرفها: «لا معلومة بعد» وبلا تنبيه');
    for (let i = 0; i < 3; i++) await p.evaluate(([c]) => { const f = document.querySelector('[data-act=wadd]'); if (f) { document.getElementById('wC').value = c; document.getElementById('wT').value = '5'; f.click(); } }, [city]);
    ok(await p.evaluate(() => __game.S.watch.length) === 3, tag + 'الحد ٣ مراقبات');
    await p.evaluate(() => document.querySelector('[data-act=wdel]').click()); await p.waitForTimeout(200);
    ok(await p.evaluate(() => __game.S.watch.length) === 2, tag + 'الحذف يعمل');
    ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), tag + 'بلا تمرير أفقي');
  }
  ok(errs.length === 0, 'بلا أخطاء JS ' + errs.join('|'));
  await b.close(); console.log(fails ? 'ERRORS: ' + fails : 'كل شيء سليم'); process.exit(fails ? 1 : 0);
})();
