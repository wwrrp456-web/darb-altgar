// الشريط المصغّر المثبّت على الجوال وقائمته المنسدلة: node test/mini-ui.test.js
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path'); const URL = 'file://' + path.join(__dirname, '../index.html') + '?learn=1&seed=4';
(async () => {
  const b = await chromium.launch(); let fails = 0; const errs = [];
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
  const setup = p => p.evaluate(() => { const g = __game, S = g.S; g.E.A.learnSetChar(S, 'trader'); S.learn.intro = 5; S.learn.level = 5; ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'rq'].forEach(k => S.learn[k] = []); g.go('market'); g.renderAll(true); });
  const disp = (p, id) => p.evaluate(i => getComputedStyle(document.getElementById(i)).display, id);
  {
    const p = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL); await p.waitForTimeout(800); await setup(p); await p.waitForTimeout(400);
    ok(await disp(p, 'hmini') === 'none', 'الشريط المصغّر مخفي والشريط الكامل ظاهر');
    await p.evaluate(() => window.scrollTo(0, 700)); await p.waitForTimeout(500);
    ok(await disp(p, 'hmini') === 'flex', 'يظهر مثبّتاً عند التمرير للأسفل');
    ok(await p.evaluate(() => document.getElementById('hmini').getBoundingClientRect().top === 0), 'ملتصق بأعلى الشاشة');
    await p.click('#hmini [data-act=minidrop]'); await p.waitForTimeout(250);
    ok(await disp(p, 'hdrop') === 'block' && await p.locator('#hdrop .dt').count() === 4, 'القائمة المنسدلة تفتح وفيها الموارد الأربعة');
    await p.locator('#hdrop [data-act=mspeed][data-g="2"]').dispatchEvent('click'); await p.waitForTimeout(300);
    ok(await p.evaluate(() => document.querySelector('#hdrop [data-g="2"]').classList.contains('on')), 'أزرار الوقت في القائمة تعمل');
    await p.evaluate(() => __game.setSpeed(0)); await p.waitForTimeout(150);
    await p.mouse.click(3, 700); await p.waitForTimeout(250);
    ok(await disp(p, 'hdrop') === 'none', 'النقر خارجها يغلقها');
    await p.click('#hmini [data-act=minidrop]'); await p.waitForTimeout(150); await p.keyboard.press('Escape'); await p.waitForTimeout(200);
    ok(await disp(p, 'hdrop') === 'none', 'Escape يغلقها');
    ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'بلا تمرير أفقي');
    await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(500);
    ok(await disp(p, 'hmini') === 'none', 'يختفي حين يعود الشريط الكامل');
  }
  {
    const p = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL); await p.waitForTimeout(800); await setup(p); await p.evaluate(() => window.scrollTo(0, 700)); await p.waitForTimeout(500);
    ok(await disp(p, 'hmini') === 'flex', 'على الحاسوب والتاب يظهر الشريط المصغّر عند التمرير أيضاً (الشريط الكامل لا يُثبَّت)');
    ok(await p.evaluate(() => { const n = document.getElementById('nav').getBoundingClientRect(), m = document.getElementById('hmini').getBoundingClientRect(); return n.top >= m.bottom - 3 && n.top < 80; }), 'وشريط التنقل ظاهر تحت الشريط المصغّر');
  }
  ok(errs.length === 0, 'بلا أخطاء JS ' + errs.join('|'));
  await b.close(); console.log(fails ? 'ERRORS: ' + fails : 'كل شيء سليم'); process.exit(fails ? 1 : 0);
})();
