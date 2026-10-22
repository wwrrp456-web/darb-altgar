// الدجاج والبط: أزرار ذكر/أنثى عند الشراء للتربية في نافذة السلعة: node test/poultry-ui.test.js
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
    await p.evaluate(() => { const g = __game, S = g.S; g.E.A.learnSetChar(S, 'trader'); S.fxFree = true; S.learn.level = 11; S.learn.intro = 11; S.learn.free = true; S.player.gold = 90000; S.phase = 3; ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'rq', 'cq'].forEach(k => S.learn[k] = []); const m = S.player.caravans[0]; m.city = 'cairo'; m.left = 0; S.cities.cairo.stock.chicken = 500; g.go('market'); g.renderAll(true); });
    await clr(); await p.evaluate(() => { document.body.insertAdjacentHTML('beforeend', '<button class="__t" data-gd="fayoumi"></button>'); document.querySelector('.__t').click(); }); await p.waitForTimeout(300);
    ok(await p.locator('#modal .poultry [data-act=buysex]').count() === 2, tag + 'الدجاج: زرّا «ذكر» و«أنثى» عند الشراء للتربية');
    await clr(); await p.evaluate(() => { const b = document.querySelectorAll('#modal .poultry [data-act=buysex]')[0]; b.dataset.q = '5'; b.click(); }); await p.waitForTimeout(300);
    const cx = await p.evaluate(() => __game.E.cxOf(__game.S.player.caravans[0], 'fayoumi'));
    ok(cx.m === 5, tag + 'الشراء كـ«ذكر» يسجّل ٥ ذكور (' + cx.m + ')');
    ok(/في قافلتك:/.test(await p.locator('#modal .poultry').innerText()) && /ذكر/.test(await p.locator('#modal .poultry').innerText()), tag + 'النافذة تعرض تركيبة الأجناس في القافلة');
    ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), tag + 'بلا تمرير أفقي');
  }
  ok(errs.length === 0, 'بلا أخطاء JS ' + errs.join('|'));
  await b.close(); console.log(fails ? 'ERRORS: ' + fails : 'كل شيء سليم'); process.exit(fails ? 1 : 0);
})();
