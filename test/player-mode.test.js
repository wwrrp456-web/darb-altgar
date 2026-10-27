// وضع اللاعب (WP-01أ): ?player=1 يعرض الغلاف والحكاية وعمّ سالم كما يراها اللاعب الحقيقي: node test/player-mode.test.js
const assert = require('node:assert/strict'), path = require('node:path'), { chromium } = require('/opt/node-tools/node_modules/playwright');
const URL = 'file://' + path.join(__dirname, '../index.html') + '?player=1&seed=7';
const ok = m => console.log('OK   ' + m);
(async () => {
  const b = await chromium.launch(), errors = [];
  try {
    const p = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage(); p.on('pageerror', e => errors.push(e.message));
    await p.goto(URL); await p.waitForTimeout(1800);
    assert.equal(await p.evaluate(() => navigator.webdriver), true, 'المتصفح آلي');
    assert.equal(await p.locator('#splash.cover #coverGo').isVisible(), true); ok('الغلاف يظهر رغم المتصفح الآلي');
    await p.locator('#coverGo').click();
    await p.locator('[data-act=storygo]').waitFor({ timeout: 5000 }); ok('صفحة الحكاية تسبق عمّ سالم');
    assert.equal(await p.locator('#lesson').count() === 0 || !(await p.locator('#lesson').isVisible()), true, 'لا عمّ سالم قبل الضغط على «ابدأ الرحلة»');
    await p.locator('[data-act=storygo]').click(); await p.locator('#lesson').waitFor({ timeout: 5000 }); ok('بعد «ابدأ الرحلة» يتكلم عمّ سالم');
    let chose = false, named = false, started = false;
    for (let i = 0; i < 60 && !(await p.locator('[data-act=datego]').isVisible().catch(() => false)); i++) {
      const inp = p.locator('#lesson input');
      if (await inp.count() && await inp.first().isVisible()) { await inp.first().fill('نواف'); await p.locator('[data-act=lname]').click(); named = true; await p.waitForTimeout(500); continue; }
      const bt = p.locator('#lesson [data-act=lstart],#lesson [data-act=lchar],#lesson [data-act=lnext],#lesson [data-act=lrep]').first();
      if (!await bt.count()) { await p.waitForTimeout(300); continue; }
      const act = await bt.getAttribute('data-act'); if (act === 'lchar') chose = true; if (act === 'lstart') started = true;
      await bt.click(); await p.waitForTimeout(500);
    }
    assert.ok(started && named && chose, 'مرّ على اختيار الدولة والاسم والشخصية'); ok('اختيار الدولة والاسم والشخصية');
    await p.locator('[data-act=datego]').click();
    await p.waitForFunction(() => /المرحلة 1 من 22/.test(document.getElementById('lesson')?.innerText || ''), null, { timeout: 8000 });
    const st = await p.evaluate(() => ({ char: __game.S.learn.char, name: __game.S.player.name }));
    assert.deepEqual(st, { char: 'trader', name: 'نواف' }); ok('ظهرت أول مهمة لعمّ سالم (المرحلة 1 من 22)');
    assert.ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'لا تمرير أفقي'); ok('بلا تمرير أفقي على ٣٩٠');
    // قبل الإضافة كان الوضع الآلي يتخطى هذا كله: بلا player=1 لا غلاف ولا حكاية
    const q = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
    await q.goto(URL.replace('player=1&', '')); await q.waitForTimeout(1500);
    assert.equal(await q.locator('#coverGo').count(), 0, 'بدون player=1 يبقى السلوك الآلي القديم'); ok('بدون player=1 لا يتغير شيء');
    assert.deepEqual(errors, []); console.log('OK player-mode');
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
