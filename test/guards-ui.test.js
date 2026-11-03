'use strict';
// 019: رتب الحراس في تجهيز القافلة وسطر «خطر الطريق» في تجهيز الرحلة على 390px، والترقية بالنقر، ومفتاحا الرجوع
const assert = require('node:assert/strict'), path = require('node:path'), fs = require('node:fs'), { chromium } = require('/opt/node-tools/node_modules/playwright');
const OUT = path.join(__dirname, '../docs/shots/guards'); fs.mkdirSync(OUT, { recursive: true }); const ok = m => console.log('OK   ' + m);
(async () => {
  const b = await chromium.launch(), errors = [];
  try {
    const p = await b.newPage({ viewport: { width: 390, height: 844 } }); p.on('pageerror', e => errors.push(e.message)); p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await p.goto('file://' + path.join(__dirname, '../index.html') + '?learn=1&seed=37&sched=0'); await p.waitForFunction(() => !!window.__game);
    await p.evaluate(() => { const g = __game, { S, E } = g; E.A.chooseStart(S, 'sa'); E.A.learnSetChar(S, 'trader'); S.noLock = 1; S.player.famDebt = null; S.phase = 3; S.player.gold = 20000; Object.assign(S.learn, { welcome: 99, datePend: false, zseen: true }); for (const q of ['stageUp', 'up', 'sq', 'tq', 'cq', 'fq', 'bq', 'csq', 'eq', 'rq']) S.learn[q] = [];
      const car = S.player.caravans[0]; car.guards = 4; car.left = 0; car.cargo = { wheat: 3000 }; g.setSpeed(0); document.querySelectorAll('#splash').forEach(e => e.remove()); g.go('caravan'); g.renderAll(true); });
    await p.waitForTimeout(300);
    const clean = async () => p.evaluate(() => { __game.setSpeed(0); const m = document.getElementById('modal'); if (m && !m.hidden && !m.querySelector('.tprep')) { m.hidden = true; m.innerHTML = ''; } const l = document.getElementById('lesson'); if (l) l.remove(); document.querySelectorAll('#splash,#spot,#spotArrow').forEach(e => e.remove()); });
    const noScroll = async w => assert.equal(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, w + ': لا تمرير أفقي');
    await clean(); const card = p.locator('[data-guardranks]'); assert.equal(await card.count(), 1, 'بطاقة رتب الحراس'); let t = await card.innerText();
    for (const w of ['حارس', 'حارس متمرّس', 'رئيس الحرس', 'دفاع 1.5', 'دفاع 2.5', 'دفاع 4', 'قوة الدفاع الآن', 'غنيمة']) assert.ok(t.includes(w), w); await noScroll('الرتب');
    await p.evaluate(() => document.querySelector('[data-guardranks]').scrollIntoView({ block: 'center' })); await p.waitForTimeout(120); await clean(); await card.screenshot({ path: path.join(OUT, 'ranks-390.png') });
    const g0 = await p.evaluate(() => __game.S.player.gold); await p.evaluate(() => document.querySelector('[data-act=gpromote][data-to=vet]').click()); await p.waitForTimeout(250);
    const st = await p.evaluate(() => ({ g: __game.S.player.gold, gr: __game.S.player.caravans[0].gr })); assert.equal(g0 - st.g, 500); assert.equal(st.gr.v, 1); t = await p.locator('[data-guardranks]').innerText(); assert.ok(/حارس متمرّس\s*1/.test(t.replace(/\n/g, ' ')) || t.includes('1 ·'), 'المتمرّس ظاهر'); assert.ok(await p.locator('[data-act=gpromote][data-to=chief]').count() === 1, 'زر رئيس الحرس بعد متمرّس');
    // تجهيز الرحلة: سطر خطر الطريق
    await p.evaluate(() => { const g = __game, { S } = g, car = S.player.caravans[0], to = S.order.find(x => x !== car.city && x !== 'xian'); g.dealGo('wheat', to, 10); }); await p.waitForTimeout(300); await clean();
    const est = p.locator('[data-roadest]'); assert.ok(await est.count() >= 1, 'سطر خطر الطريق'); const et = await est.first().innerText(); assert.ok(/خطر الطريق: (منخفض|متوسط|عالٍ)/.test(et) && /دفاعك \d+ مقابل عصابات بقوة \d+ إلى \d+/.test(et), 'المستوى والدفاع: ' + et); await noScroll('تجهيز الرحلة');
    await est.first().scrollIntoViewIfNeeded(); await p.waitForTimeout(100); await p.screenshot({ path: path.join(OUT, 'trip-390.png') });
    await p.evaluate(() => { __game.E.GUARDS.ranks = false; __game.E.GUARDS.scale = false; __game.go('caravan'); __game.renderAll(true); }); await p.waitForTimeout(200); await clean(); assert.equal(await p.locator('[data-guardranks]').count(), 0, 'مطفأ: لا بطاقة رتب');
    assert.deepEqual(errors, []); ok('رتب الحراس وتقدير الطريق على 390: بطاقة وترقية بالنقر وسطر الخطر في تجهيز الرحلة ومفتاح الرجوع، بلا تمرير أفقي'); console.log('\nguards-ui: كلها ناجحة');
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
