// WP-09: الكشف التدريجي للتبويبات: م1 ≤ 4، وبطاقة «اكتشفتَ» مرة، وحفظ قديم بلا بطاقات، وui.showLocks يعيد القفل: node test/nav-reveal-ui.test.js
const assert = require('node:assert/strict'), path = require('node:path'), { chromium } = require('/opt/node-tools/node_modules/playwright');
const URL = 'file://' + path.join(__dirname, '../index.html') + '?learn=1&seed=37';
const ok = m => console.log('OK   ' + m);
const setup = (S0) => { const { S, E } = __game; E.A.chooseStart(S, 'sa'); E.A.learnSetChar(S, 'trader'); Object.assign(S.learn, { level: S0.level, stage: S0.level, intro: S0.level, stageIntro: S0.level, welcome: 99, datePend: false, free: false }); S.phase = S0.phase || 1; ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'cq', 'rq', 'stageUp'].forEach(k => S.learn[k] = []); delete S.learn.navSeen; };
const tabs = p => p.locator('#nav button').evaluateAll(bs => bs.map(b => b.dataset.go));
(async () => {
  const b = await chromium.launch(), errors = [];
  try {
    for (const width of [320, 390]) {
      const p = await (await b.newContext({ viewport: { width, height: 800 } })).newPage(); p.on('pageerror', e => errors.push(e.message));
      await p.goto(URL); await p.waitForFunction(() => !!window.__game);
      await p.evaluate(setup, { level: 1 }); await p.evaluate(() => { __game.go('home'); __game.renderAll(true); }); await p.waitForTimeout(300);
      let t = await tabs(p); assert.deepEqual(t.sort(), ['caravan', 'home', 'map', 'market'], width + 'px م1: ' + t); assert.equal(await p.locator('#nav .lk').count(), 0);
      assert.ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)); assert.equal(await p.locator('#rcpt:not([hidden])').count(), 0, 'لا بطاقة للتبويبات الأولى');
      ok(width + 'px م1: ' + t.length + ' تبويبات فقط بلا قفل ولا بطاقة');
      // م2: مكتب التاجر والزعماء، بطاقة لكل منهما مرة واحدة
      await p.evaluate(() => { const { S } = __game; Object.assign(S.learn, { level: 2, stage: 2, intro: 2, stageIntro: 2 }); __game.renderAll(true); }); await p.waitForTimeout(300);
      t = await tabs(p); assert.deepEqual(t.sort(), ['caravan', 'home', 'lords', 'map', 'market', 'office']);
      const titles = [];
      for (let i = 0; i < 3 && await p.locator('#rcpt:not([hidden])').count(); i++) { titles.push(await p.locator('#rcpt .rt').innerText()); await p.locator('#rcpt [data-act=rcptclose]').click(); await p.evaluate(() => __game.renderAll(true)); await p.waitForTimeout(150); }
      assert.equal(titles.length, 2, 'بطاقتان (المكتب والزعماء): ' + titles); assert.ok(titles.every(x => /اكتشفتَ/.test(x))); ok(width + 'px م2: ' + titles.join(' · '));
      await p.evaluate(() => { __game.renderAll(true); }); await p.waitForTimeout(150); assert.equal(await p.locator('#rcpt:not([hidden])').count(), 0, 'لا تتكرر'); ok(width + 'px: البطاقة مرة واحدة');
      // م3 وم4 وم5: الدول من م3؛ والعقارات والإمبراطورية بالطور 2
      for (const [lv, ph, want] of [[3, 1, ['caravan', 'cities', 'home', 'lords', 'map', 'market', 'office']], [5, 1, ['caravan', 'cities', 'home', 'lords', 'map', 'market', 'office']], [5, 2, ['caravan', 'cities', 'empire', 'estate', 'home', 'lords', 'map', 'market', 'office']]]) {
        await p.evaluate(([l, h]) => { const { S } = __game; Object.assign(S.learn, { level: l, stage: l, intro: l, stageIntro: l }); S.phase = h; __game.renderAll(true); }, [lv, ph]); await p.waitForTimeout(200);
        for (let i = 0; i < 4 && await p.locator('#rcpt:not([hidden])').count(); i++) { await p.locator('#rcpt [data-act=rcptclose]').click(); await p.evaluate(() => __game.renderAll(true)); await p.waitForTimeout(100); }
        t = await tabs(p); assert.deepEqual(t.sort(), want, `${width}px م${lv} طور ${ph}: ${t}`);
        await p.screenshot({ path: `/tmp/nav-L${lv}-P${ph}-${width}.png` });
      }
      ok(width + 'px م3 فما فوق: الدول ثم العقارات والإمبراطورية بالطور');
      await p.context().close();
    }
    // حفظ قديم (م5 بلا navSeen): لا بطاقات لما كان ظاهراً
    const p2 = await (await b.newContext({ viewport: { width: 390, height: 800 } })).newPage(); p2.on('pageerror', e => errors.push(e.message));
    await p2.goto(URL); await p2.waitForFunction(() => !!window.__game);
    const old = await p2.evaluate(() => { const { S, E } = __game; E.A.chooseStart(S, 'sa'); E.A.learnSetChar(S, 'trader'); Object.assign(S.learn, { level: 5, stage: 5, intro: 5, stageIntro: 5, welcome: 99, datePend: false }); ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'cq', 'rq', 'stageUp'].forEach(k => S.learn[k] = []); delete S.learn.navSeen; return E.save(S); });
    await p2.goto('about:blank'); await p2.goto('file://' + path.join(__dirname, 'map.json')); await p2.evaluate(t => localStorage.setItem('darb-v3', t), old); await p2.goto(URL); await p2.waitForFunction(() => !!window.__game); await p2.waitForTimeout(800);
    t = await tabs(p2); assert.deepEqual(t.sort(), ['caravan', 'cities', 'home', 'lords', 'map', 'market', 'office']); assert.ok(!/اكتشفتَ/.test(await p2.evaluate(() => document.getElementById('rcpt').innerText)), 'حفظ قديم: لا بطاقة «اكتشفتَ»'); ok('حفظ قديم م5: ' + t.length + ' تبويبات بلا بطاقات «اكتشفتَ»');
    await p2.context().close();
    // ui.showLocks يعيد العرض القديم
    const p3 = await (await b.newContext({ viewport: { width: 390, height: 800 } })).newPage(); await p3.addInitScript(() => localStorage.setItem('darb-ui', JSON.stringify({ showLocks: true })));
    await p3.goto(URL); await p3.waitForFunction(() => !!window.__game); await p3.evaluate(setup, { level: 1 }); await p3.evaluate(() => { __game.go('home'); __game.renderAll(true); }); await p3.waitForTimeout(300);
    assert.equal((await tabs(p3)).length, 9); assert.equal(await p3.locator('#nav .lk').count(), 2); ok('ui.showLocks: ٩ تبويبات وقفلان كما كان');
    assert.deepEqual(errors, []); console.log('OK nav-reveal-ui');
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
