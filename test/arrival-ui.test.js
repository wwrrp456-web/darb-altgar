// وصول القافلة: إشعار واحد بالمدينة والحمولة، والانتقال التلقائي للسوق لا يقطع كتابة اللاعب: node test/arrival-ui.test.js
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path'); const URL = 'file://' + path.join(__dirname, '../index.html') + '?learn=1&seed=4';
(async () => {
  const b = await chromium.launch(); let fails = 0; const errs = [];
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
  const start = p => p.evaluate(() => { const g = __game, S = g.S, E = g.E; E.A.learnSetChar(S, 'trader'); S.learn.level = 11; S.learn.intro = 11; S.learn.free = true; ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'rq', 'cq'].forEach(k => S.learn[k] = []);
    const m = S.player.caravans[0]; const d = S.order.find(i => i !== m.city && S.cities[i].country === S.cities[m.city].country); E.A.buy(S, m.id, 'wheat', 5); E.A.travel(S, m.id, d); ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'rq', 'cq'].forEach(k => S.learn[k] = []); g.go('map'); g.renderAll(true); return d; });
  const arrive = p => p.evaluate(() => { const g = __game, m = g.S.player.caravans[0]; m.left = 0; m.city = m.dest || m.city; ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'rq', 'cq'].forEach(k => g.S.learn[k] = []); g.renderAll(false); });
  for (const vp of [{ width: 390, height: 800 }, { width: 1100, height: 800 }]) {
    const tag = vp.width + 'px: ';
    const p = await (await b.newContext({ viewport: vp })).newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL); await p.waitForTimeout(900);
    let d = await start(p); await p.waitForTimeout(300); await arrive(p); await p.waitForTimeout(400);
    ok(await p.evaluate(() => location.hash) === '#market' && await p.locator('.arrcard').count() === 1, tag + 'عند الوصول: السوق يفتح وبطاقة وصول واحدة');
    ok(/وصلت قافلتك إلى/.test(await p.locator('.arrcard').innerText()) && /قمح/.test(await p.locator('.arrcard').innerText()), tag + 'البطاقة فيها المدينة والحمولة الفعلية');
    await p.evaluate(() => __game.renderAll(false)); await p.evaluate(() => __game.renderAll(true));
    ok(await p.locator('.arrcard').count() === 1, tag + 'إعادة الرسم لا تكرر الإشعار');
    await p.locator('.arrcard [data-act=arrclose]').click(); await p.waitForTimeout(200);
    ok(await p.locator('.arrcard').count() === 0, tag + '«تم» تغلقها');
    // اللاعب يكتب كمية: لا ينتزع الانتقال الشاشة
    d = await start(p); await p.waitForTimeout(300);
    await p.evaluate(() => { __game.go('map'); __game.renderAll(true); const i = document.createElement('input'); i.id = '__q'; document.getElementById('screen').appendChild(i); i.focus(); });
    await arrive(p); await p.waitForTimeout(300);
    ok(await p.evaluate(() => location.hash) !== '#market' && await p.evaluate(() => document.activeElement && document.activeElement.id === '__q'), tag + 'أثناء الكتابة: بلا انتقال ولا فقد للتركيز');
    ok(await p.locator('.arrcard [data-act=arrsell]').count() === 1, tag + 'البطاقة (والحمولة معك) تعرض «بِع بضاعتي»');
    await p.evaluate(() => document.querySelector('.arrcard [data-act=arrsell]').click()); await p.waitForTimeout(500);
    ok(await p.locator('#mycargo').count() === 1 && /قمح/.test(await p.locator('#mycargo').innerText()), tag + 'السوق يعرض بطاقة «بضاعتي» بما في القافلة');
    ok(await p.evaluate(() => location.hash) === '#market' && await p.evaluate(() => __game.S.player.caravans[0].city) !== undefined, tag + '«بِع بضاعتي» تفتح السوق');
    ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), tag + 'بلا تمرير أفقي');
  }
  ok(errs.length === 0, 'بلا أخطاء JS ' + errs.join('|'));
  await b.close(); console.log(fails ? 'ERRORS: ' + fails : 'كل شيء سليم'); process.exit(fails ? 1 : 0);
})();
