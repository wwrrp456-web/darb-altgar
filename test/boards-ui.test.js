'use strict';
// 020: لوحتا ترتيب الدول والأسواق في «الدول والمدن» على 390 و1100: تبويبان، 5 و18 بطاقة، فتح بطاقة المدينة بالضغط، بلا تمرير أفقي، ومفتاح الرجوع
const assert = require('node:assert/strict'), path = require('node:path'), fs = require('node:fs'), { chromium } = require('/opt/node-tools/node_modules/playwright');
const OUT = path.join(__dirname, '../docs/shots/boards'); fs.mkdirSync(OUT, { recursive: true }); const ok = m => console.log('OK   ' + m);
(async () => {
  const b = await chromium.launch(), errors = [];
  try {
    for (const [w, h] of [[390, 844], [1100, 900]]) {
      const p = await b.newPage({ viewport: { width: w, height: h } }); p.on('pageerror', e => errors.push(e.message)); p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
      await p.goto('file://' + path.join(__dirname, '../index.html') + '?learn=1&seed=37&sched=0'); await p.waitForFunction(() => !!window.__game);
      await p.evaluate(() => { const g = __game, { S, E } = g; E.A.chooseStart(S, 'sa'); E.A.learnSetChar(S, 'trader'); S.noLock = 1; S.player.famDebt = null; S.phase = 3; S.player.gold = 2e6; Object.assign(S.learn, { welcome: 99, datePend: false, zseen: true }); for (const q of ['stageUp', 'up', 'sq', 'tq', 'cq', 'fq', 'bq', 'csq', 'eq', 'rq']) S.learn[q] = [];
        S.projects = { peak: 1e7, paid: { P04: 3 }, until: {}, pick: { P04: 'jeddah' }, done: ['P04'], tier: 3 }; for (let i = 0; i < 62; i++) { E.tick(S, false); S.pause = false; } S.bosses.riyadh.ruler = 'player'; S.bosses.hail.ruler = 'player'; S.bosses.riyadh.p = 100; S.bosses.hail.p = 100; g.setSpeed(0); document.querySelectorAll('#splash').forEach(e => e.remove()); g.go('cities'); g.renderAll(true); });
      await p.waitForTimeout(300);
      const clean = async () => p.evaluate(() => { __game.setSpeed(0); const m = document.getElementById('modal'); if (m && !m.hidden) { m.hidden = true; m.innerHTML = ''; } const l = document.getElementById('lesson'); if (l) l.remove(); document.querySelectorAll('#splash,#spot,#spotArrow').forEach(e => e.remove()); });
      const noScroll = async s => assert.equal(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, w + ' ' + s + ': لا تمرير أفقي');
      await clean(); assert.ok(await p.locator('[data-ct=bc]').count() === 1 && await p.locator('[data-ct=bm]').count() === 1, 'التبويبان');
      await p.evaluate(() => document.querySelector('[data-ct=bc]').click()); await p.waitForTimeout(250); await clean();
      assert.equal(await p.locator('.bdcountry').count(), 5, '5 دول'); const t0 = await p.locator('.bdcountry').first().innerText(); for (const x of ['1#', 'الأقوى', 'الأضعف', 'السكان', 'قيادتك']) assert.ok(t0.includes(x), 'بطاقة الدولة: ' + x); const sa = await p.locator('[data-bdc=sa]').innerText(); assert.ok(/قيادتك: 2 من 6/.test(sa.replace(/\n/g, ' ')), 'قيادتك 2 من 6: ' + sa); const dt = await p.locator('[data-difficulty]').innerText(); assert.ok(dt.includes('صعوبة التوسع') && /×1\.\d\d/.test(dt) && dt.includes('بلا حروب'), 'سطر صعوبة التوسع: ' + dt); await noScroll('الدول');
      await p.screenshot({ path: path.join(OUT, 'countries-' + w + '.png') });
      await p.evaluate(() => document.querySelector('[data-ct=bm]').click()); await p.waitForTimeout(250); await clean();
      assert.equal(await p.locator('.bdmarket').count(), 18, '18 سوقاً'); const tm = await p.locator('[data-bdm=riyadh]').innerText(); for (const x of ['الأقوى', 'السكان', 'الزعيم: أنت', 'مساهمتك']) assert.ok(tm.includes(x), 'بطاقة السوق: ' + x); const tj = await p.locator('[data-bdm=cairo]').innerText(); assert.ok(/الزعيم: .+ · نفوذك \d+٪/.test(tj.replace(/\n/g, ' ')), 'زعيم السوق ونفوذك: ' + tj); await noScroll('الأسواق');
      await p.screenshot({ path: path.join(OUT, 'markets-' + w + '.png') });
      // الضغط يفتح بطاقة المدينة القائمة (016)
      await p.evaluate(() => document.querySelector('[data-bdm=jeddah]').click()); await p.waitForTimeout(350); await clean();
      assert.ok(await p.locator('[data-cid=jeddah] .pros').count() === 1 && await p.locator('[data-cid=jeddah] .pros[open]').count() === 1, 'بطاقة ازدهار جدة مفتوحة'); await noScroll('بطاقة المدينة');
      await p.close();
    }
    const p2 = await b.newPage({ viewport: { width: 390, height: 844 } }); await p2.goto('file://' + path.join(__dirname, '../index.html') + '?learn=1&seed=37&sched=0'); await p2.waitForFunction(() => !!window.__game);
    await p2.evaluate(() => { const g = __game, { S, E } = g; E.A.chooseStart(S, 'sa'); E.A.learnSetChar(S, 'trader'); S.noLock = 1; E.BOARDS.on = false; g.setSpeed(0); document.querySelectorAll('#splash').forEach(e => e.remove()); g.go('cities'); g.renderAll(true); }); await p2.waitForTimeout(250);
    assert.equal(await p2.locator('[data-ct=bc]').count() + await p2.locator('[data-ct=bm]').count(), 0, 'مطفأ: لا تبويبان');
    assert.deepEqual(errors, []); ok('لوحتا الترتيب على 390 و1100: تبويبان و5 دول و18 سوقاً وقيادتك والزعيم والمساهمة، والضغط يفتح بطاقة المدينة، بلا تمرير أفقي، ومفتاح الرجوع'); console.log('\nboards-ui: كلها ناجحة');
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
