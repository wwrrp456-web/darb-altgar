// شارات الرتب الثماني (brand/img/ranks/rank_0..7) تظهر في بطاقة نقاط المعهد بحسب الرتبة، وصورتها تُحمَّل: node test/rank-badges-ui.test.js
const assert = require('node:assert/strict'), path = require('node:path'), { chromium } = require('/opt/node-tools/node_modules/playwright');
const URL = 'file://' + path.join(__dirname, '../index.html') + '?learn=1&seed=37', ok = m => console.log('OK   ' + m);
(async () => {
  const b = await chromium.launch(), errors = [];
  try {
    const p = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage(); p.on('pageerror', e => errors.push(e.message)); await p.goto(URL); await p.waitForFunction(() => !!window.__game);
    await p.evaluate(() => { const { S, E } = __game; E.A.chooseStart(S, 'sa'); E.A.learnSetChar(S, 'trader'); Object.assign(S.learn, { level: 11, stage: 23, intro: 11, welcome: 99, datePend: false, zseen: true, free: true }); for (const k of ['stageUp', 'up', 'sq', 'tq', 'bq', 'csq', 'cq', 'fq', 'eq', 'rq']) S.learn[k] = []; __game.setSpeed(0); });
    const names = ['مبتدئ', 'متمرّن', 'تاجر', 'تاجر ماهر', 'تاجر خبير', 'كبير التجّار', 'شيخ التجّار', 'أمير التجّار'], srcs = new Set();
    for (let r = 0; r < 8; r++) {
      await p.evaluate(r => { __game.E.traderRank = () => r; __game.go('academy'); __game.renderAll(true); }, r); await p.waitForTimeout(250);
      const img = p.locator('#screen .card h3 img.oic').first(); assert.equal(await img.count(), 1, 'لا شارة للرتبة ' + r);
      const info = await img.evaluate((e, r) => ({ src: e.getAttribute('src'), alt: e.alt, mine: e.getAttribute('src') === window.ART['ranks/rank_' + r] }), r);
      assert.ok(info.mine, 'الشارة ليست ART[ranks/rank_' + r + ']'); assert.equal(info.alt, names[r]); await p.waitForFunction(() => [...document.querySelectorAll('#screen h3 img.oic')].every(e => e.complete && e.naturalWidth > 0), null, { timeout: 5000 }); srcs.add(info.src.slice(0, 200));
      assert.ok((await p.locator('#screen').innerText()).includes(names[r]), 'اسم الرتبة ' + names[r] + ' لا يظهر');
    }
    assert.equal(srcs.size, 8, 'ثماني صور مختلفة'); ok('كل رتبة من الثمان تعرض شارتها الخاصة وتُحمَّل (ثماني صور مختلفة) مع اسمها');
    assert.deepEqual(errors, []); console.log('OK rank-badges-ui');
  } catch (e) { console.error(e); process.exitCode = 1; } finally { await b.close(); }
})();
