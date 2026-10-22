// «جهّز دكانك» وتقرير البائع في صفحة العقارات: node test/shopsetup-ui.test.js
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path'); const URL = 'file://' + path.join(__dirname, '../index.html') + '?learn=1&seed=4';
(async () => {
  const b = await chromium.launch(); let fails = 0; const errs = [];
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
  for (const vp of [{ width: 390, height: 800 }, { width: 1100, height: 800 }]) {
    const tag = vp.width + 'px: ';
    const p = await (await b.newContext({ viewport: vp })).newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL); await p.waitForTimeout(900);
    await p.evaluate(() => { const g = __game, S = g.S; g.E.A.learnSetChar(S, 'trader'); S.learn.level = 11; S.learn.intro = 11; S.learn.free = true; S.phase = 2; S.player.gold = 90000; ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'rq', 'cq'].forEach(k => S.learn[k] = []); g.go('estate'); g.renderAll(true); });
    await p.waitForTimeout(400);
    const card = () => p.locator('.setup');
    ok(await card().count() === 1 && /جهّز دكانك/.test(await card().innerText()), tag + 'بطاقة «جهّز دكانك» تظهر');
    ok(await p.locator('.setup .stp.now [data-act=bshop]').count() === 1, tag + 'الخطوة الأولى (دكان) عليها زرها');
    const click = async sel => { await p.evaluate(s => document.querySelector(s).click(), sel); await p.waitForTimeout(400); };
    await click('.setup [data-act=bshop]');
    ok(await p.locator('.setup .stp.done').count() >= 1, tag + 'بعد بناء الدكان: الخطوة ١ ✅');
    if (await p.locator('.setup [data-act=sqhire]').count()) await click('.setup [data-act=sqhire]');
    await click('.setup [data-act=sqadd]');
    ok(await p.locator('.itemrow').count() >= 1 && await p.locator('.srep').count() >= 1, tag + 'سلعة مضافة وتحتها تقرير البائع');
    ok(/تقرير البائع/.test(await p.locator('.shopbox').first().innerText()), tag + 'عنوان «تقرير البائع» ظاهر');
    ok(await p.locator('.setup').count() === 0, tag + 'تختفي البطاقة بعد اكتمال الخطوات الأربع (التعبئة الآلية مفعّلة مع الإضافة السريعة)');
    // سعر مرتفع بلا بيع → زر «اجعله»
    await p.evaluate(() => { const S = __game.S, city = [...Object.keys(S.player.props)][0], sh = __game.E.shopsOf(S, city)[0], pr = S.player.props[city], it = sh.items[0]; it.price = 1.9; it.lastSold = 0; pr.store[it.g] = 60; __game.renderAll(true); });
    await p.waitForTimeout(300);
    ok(await p.locator('.srep.high [data-act=srprice]').count() === 1, tag + 'سعر مرتفع: تقرير «غالٍ» وزر اجعله N٪');
    await click('.srep.high [data-act=srprice]');
    ok(await p.locator('.srep.high').count() === 0, tag + 'بعد الإصلاح لا يبقى تقرير «غالٍ»');
  }
  ok(errs.length === 0, 'بلا أخطاء JS ' + errs.join(' | ')); await b.close(); console.log(fails ? fails + ' FAIL' : 'ALL OK'); process.exit(fails ? 1 : 0);
})();
