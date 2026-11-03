'use strict';
// 022: الاحتكار المحرّم على 390px: تنبيه لطيف ثم النص المعتمد حرفياً في المكتب، وسطر «أهل المدينة في ضيق» في بطاقة المدينة، بلا تمرير أفقي، ومفتاح الرجوع
const assert = require('node:assert/strict'), path = require('node:path'), fs = require('node:fs'), { chromium } = require('/opt/node-tools/node_modules/playwright');
const OUT = path.join(__dirname, '../docs/shots/hoarding'); fs.mkdirSync(OUT, { recursive: true }); const ok = m => console.log('OK   ' + m);
const TEXT = fs.readFileSync(path.join(__dirname, '../docs/review/APPROVED_MONOPOLY_2026-11-03.md'), 'utf8').split('\n').map(l => l.trim()).find(l => l.startsWith('«⚠️')).replace(/^«/, '').replace(/»$/, '');
(async () => {
  const b = await chromium.launch(), errors = [];
  try {
    const p = await b.newPage({ viewport: { width: 390, height: 844 } }); p.on('pageerror', e => errors.push(e.message)); p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await p.goto('file://' + path.join(__dirname, '../index.html') + '?learn=1&seed=37&sched=0'); await p.waitForFunction(() => !!window.__game);
    const step = (n) => p.evaluate(n => { const { S, E } = __game; for (let i = 0; i < n; i++) { S.cities.riyadh.stock.wheat = 10; S.player.props.riyadh.store.wheat = 400; E.tick(S, false); S.pause = false; } __game.renderAll(true); }, n);
    await p.evaluate(() => { const g = __game, { S, E } = g; E.A.chooseStart(S, 'sa'); E.A.learnSetChar(S, 'trader'); S.noLock = 1; S.noEvents = true; S.player.famDebt = null; S.phase = 3; S.player.gold = 1e6; Object.assign(S.learn, { welcome: 99, datePend: false, zseen: true }); for (const q of ['stageUp', 'up', 'sq', 'tq', 'cq', 'fq', 'bq', 'csq', 'eq', 'rq']) S.learn[q] = []; E.A.buildShop(S, 'riyadh'); const car = S.player.caravans[0]; car.city = 'riyadh'; car.left = 0; g.setSpeed(0); document.querySelectorAll('#splash').forEach(e => e.remove()); g.go('office'); g.renderAll(true); });
    const clean = async () => p.evaluate(() => { __game.setSpeed(0); const m = document.getElementById('modal'); if (m && !m.hidden) { m.hidden = true; m.innerHTML = ''; } const l = document.getElementById('lesson'); if (l) l.remove(); document.querySelectorAll('#splash,#spot,#spotArrow').forEach(e => e.remove()); });
    const noScroll = async w => assert.equal(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, w + ': لا تمرير أفقي');
    await step(8); await clean(); await p.waitForTimeout(250);
    const warn = p.locator('[data-ofc^="hoard-"]'); assert.equal(await warn.count(), 1, 'بطاقة المكتب: تنبيه لطيف'); let t = await warn.innerText(); assert.ok(/أهل الرياض في ضيق من قمح وعندك منها في مخزنك؛ اطرحها بسعر عادل/.test(t) && !t.includes('الاحتكار المحرّم'), 'تنبيه لطيف بلا حكم: ' + t); await noScroll('تنبيه لطيف');
    await step(8); await clean(); await p.waitForTimeout(250); t = await p.locator('[data-hoardtext]').textContent(); assert.equal(t.replace(/\s+/g, ' ').trim(), TEXT.replace(/\s+/g, ' '), 'النص المعتمد حرفياً في المكتب'); await noScroll('النص المعتمد');
    await p.evaluate(() => document.querySelector('[data-hoardtext]').scrollIntoView({ block: 'center' })); await p.waitForTimeout(150); await clean(); await p.locator('[data-ofc^="hoard-"]').screenshot({ path: path.join(OUT, 'office-390.png') });
    await p.evaluate(() => { __game.go('cities'); __game.renderAll(true); }); await p.waitForTimeout(300); await clean(); await p.evaluate(() => { document.querySelectorAll('.cfold').forEach(d => d.open = true); });
    const line = p.locator('[data-hoardcity=riyadh]'); assert.equal(await line.count(), 1, 'سطر الحال في بطاقة المدينة'); const lt = await line.innerText(); assert.ok(/أهل الرياض في ضيق من قمح \(قوت\) وعندك منها \d+ في مخزنك؛ اطرحها بسعر عادل/.test(lt.replace(/\n/g, ' ')), lt); await noScroll('بطاقة المدينة');
    await line.scrollIntoViewIfNeeded(); await p.evaluate(() => document.querySelector('[data-cid=riyadh]').scrollIntoView({ block: 'start' })); await p.waitForTimeout(150); await clean(); await p.locator('[data-cid=riyadh]').screenshot({ path: path.join(OUT, 'city-390.png') });
    await p.evaluate(() => { __game.E.HOARD.on = false; __game.renderAll(true); }); await p.waitForTimeout(200); assert.equal(await p.locator('[data-hoardcity]').count(), 0, 'مطفأ: لا سطر'); 
    assert.deepEqual(errors, []); ok('الاحتكار المحرّم على 390: تنبيه لطيف ثم النص المعتمد حرفياً في المكتب وسطر المدينة، بلا تمرير أفقي، ومفتاح الرجوع'); console.log('\nhoarding-ui: كلها ناجحة');
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
