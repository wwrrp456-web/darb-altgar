// إيصال الصفقة: يبقى حتى يُقرأ، ويطابق الفعل الفعلي: node test/receipt-ui.test.js
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path'); const URL = 'file://' + path.join(__dirname, '../index.html') + '?learn=1&seed=4';
(async () => {
  const b = await chromium.launch(); let fails = 0; const errs = [];
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
  for (const vp of [{ width: 390, height: 800 }, { width: 1100, height: 800 }]) {
    const tag = vp.width + 'px: ';
    const p = await (await b.newContext({ viewport: vp })).newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL); await p.waitForTimeout(900);
    await p.evaluate(() => { const g = __game, S = g.S; g.E.A.learnSetChar(S, 'trader'); S.learn.level = 11; S.learn.intro = 11; S.learn.free = true; ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'rq', 'cq'].forEach(k => S.learn[k] = []); S.player.gold = 50000; g.go('market'); g.renderAll(true); });
    const fire = (act, gd, q) => p.evaluate(([a, g, q]) => { document.querySelectorAll('.__t').forEach(e => e.remove()); document.body.insertAdjacentHTML('beforeend', '<button class="__t" data-act="' + a + '" data-g="' + g + '" data-q="' + q + '"></button>'); document.querySelector('.__t').click(); }, [act, gd, q]);
    const spent = await p.evaluate(() => { const S = __game.S, m = S.player.caravans[0]; return __game.E.quoteBuy(S, m.city, 'wheat', 4, null).cost; });
    await fire('buy', 'wheat', 4); await p.waitForTimeout(300);
    ok(await p.locator('#rcpt:not([hidden])').count() === 1 && /اشتريت 4/.test(await p.locator('#rcpt').innerText()), tag + 'بعد الشراء: إيصال بالكمية الفعلية');
    ok((await p.locator('#rcpt').innerText()).replace(/,/g, '').includes(String(Math.round(spent))), tag + 'المبلغ في الإيصال = تكلفة الشراء في المحرك (لا فرق الرصيد الذي قد يضم مكافأة درس)');
    await p.waitForTimeout(3500);
    ok(await p.locator('#rcpt:not([hidden])').count() === 1, tag + 'يبقى بعد زوال الإشعار المؤقت (لا سباق مع مؤقت)');
    const got = await p.evaluate(() => { const S = __game.S, m = S.player.caravans[0]; return __game.E.quoteSell(S, m.city, 'wheat', 4, 1).net; });
    await fire('sell', 'wheat', 4); await p.waitForTimeout(300);
    const txt = (await p.locator('#rcpt').innerText()).replace(/,/g, '');
    ok(/بعت 4/.test(txt) && (txt.includes(String(Math.round(got))) || txt.includes(String(Math.round(got) + 1)) || txt.includes(String(Math.round(got) - 1))) && /ربح البيع|صافي البيع/.test(txt), tag + 'إيصال البيع: الكمية والصافي مطابقان، والربح منفصل');
    await p.evaluate(() => document.querySelector('#rcpt [data-act=rcptclose]').click()); await p.waitForTimeout(200);
    ok(await p.locator('#rcpt:not([hidden])').count() === 0, tag + '«تم» تغلقه');
    // فشل: لا إيصال نجاح
    await fire('sell', 'wheat', 4); await p.waitForTimeout(250);
    ok(await p.locator('#rcpt:not([hidden])').count() === 0, tag + 'فشل العملية لا ينتج إيصال نجاح');
    ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), tag + 'بلا تمرير أفقي');
  }
  ok(errs.length === 0, 'بلا أخطاء JS ' + errs.join('|'));
  await b.close(); console.log(fails ? 'ERRORS: ' + fails : 'كل شيء سليم'); process.exit(fails ? 1 : 0);
})();
