'use strict';
// WP-23: واجهة أهداف المواسم على 390px: بطاقة الهدف في الرئيسية لكل موسم من الإحدى عشرة الظاهرة (لقطات في docs/shots/wp23/)، وزخارف الإنجازات، وآخر زخرفة على القافلة، بلا تمرير أفقي، والدينية الستة ظاهرة بعد الاعتماد
const assert = require('node:assert/strict'), path = require('node:path'), fs = require('node:fs'), { chromium } = require('/opt/node-tools/node_modules/playwright');
const OUT = path.join(__dirname, '../docs/shots/wp23'); fs.mkdirSync(OUT, { recursive: true }); const ok = m => console.log('OK   ' + m);
const RELIG = ['shaban', 'ramadan', 'fitr', 'hajj', 'adha', 'rajab'], VISIBLE = ['harvest', 'winter', 'ukaz', 'majanna', 'majaz', ...RELIG];
(async () => {
  const b = await chromium.launch(), errors = [];
  try {
    for (const k of VISIBLE) {
      const p = await b.newPage({ viewport: { width: 390, height: 844 } }); p.on('pageerror', e => errors.push(e.message)); p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
      await p.goto('file://' + path.join(__dirname, '../index.html') + '?learn=1&seed=37&sched=0'); await p.waitForFunction(() => !!window.__game);
      const info = await p.evaluate(k => { const g = __game, { S, E } = g; E.A.chooseStart(S, 'sa'); E.A.learnSetChar(S, 'trader'); S.noLock = 1; Object.assign(S.learn, { welcome: 99, datePend: false, zseen: true, level: 10, intro: 10, stageIntro: 99 }); for (const q of ['stageUp', 'up', 'sq', 'tq', 'cq', 'fq', 'bq', 'csq', 'eq', 'rq']) S.learn[q] = [];
        let d = -1; for (let x = 2; x < 900; x++) if (E.seasonsAt(S, x).includes(k) && E.seasonsAt(S, x - 1).includes(k) && E.seasonsAt(S, x + 1).includes(k)) { d = x; break; } if (d < 0) for (let x = 2; x < 900; x++) if (E.seasonsAt(S, x).includes(k)) { d = x; break; }
        S.day = d; const def = E.seasonGoalDef(S, k); S.seasonGoals = { y: E.dateOf(S).h.y, done: {}, seen: { [k]: d }, cur: [{ k, need: def.need, got: Math.floor(def.need * 0.4), day: d }], deco: { [k === 'winter' ? 'harvest' : 'winter']: d - 1 } };
        document.querySelectorAll('#splash').forEach(e => e.remove()); g.go('home'); g.renderAll(true); return { text: def.text, title: def.title, name: def.name, need: def.need }; }, k);
      await p.waitForTimeout(300);
      const card = p.locator('.sgoal[data-season="' + k + '"]'); assert.equal(await card.count(), 1, k + ': بطاقة الهدف في الرئيسية');
      const t = await card.innerText(); assert.ok(t.includes(info.text) && t.includes(info.title) && /بلا أي مكافأة مالية/.test(t), k + ': نص الهدف واللقب والجائزة التجميلية'); assert.ok(/باقٍ/.test(t) && t.includes(String(Math.floor(info.need * 0.4))), k + ': التقدّم والأيام الباقية');
      assert.ok(await card.locator('img.sg-img').count() === 1, k + ': زخرفة الموسم');
      assert.equal(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, k + ': لا تمرير أفقي');
      { const gotIt = p.locator('button', { hasText: 'فهمت' }); if (await gotIt.count() && await gotIt.first().isVisible()) await gotIt.first().click(); }
      await p.evaluate(() => { document.querySelectorAll('button').forEach(b => { if (/افتح عمّ سالم/.test(b.textContent)) { let x = b; while (x.parentElement && !['fixed', 'absolute'].includes(getComputedStyle(x).position)) x = x.parentElement; x.remove(); } }); document.querySelectorAll('#spot,#spotArrow').forEach(e => e.remove()); const c = document.querySelector('.sgoal'); window.scrollTo(0, c.getBoundingClientRect().top + scrollY - 120); }); await p.waitForTimeout(150);
      await p.screenshot({ path: path.join(OUT, k + '-390.png') });
      if (k === 'winter') {
        // زخارف الإنجازات (الحصاد منالة): تظهر المواسم الإحدى عشرة بعد الاعتماد
        await p.evaluate(() => { __game.S.seasonGoals.deco.harvest = 5; __game.renderAll(true); document.getElementById('hAvatar').click(); }); await p.waitForTimeout(300);
        const det = p.locator('details[data-dk=sdeco_seasons]'); assert.equal(await det.count(), 1, 'قسم زخارف المواسم'); await det.locator('summary').click();
        assert.equal(await det.locator('.sdeco').count(), 11, 'المواسم الإحدى عشرة ظاهرة'); assert.equal(await det.locator('.sdeco.on').count(), 1, 'الحصاد منالة'); const dt = await det.innerText(); assert.ok(dt.includes('تاجر موسم الحصاد'), 'اللقب'); for (const r of RELIG) assert.equal(await det.locator('[data-season="' + r + '"]').count(), 1, 'الديني ظاهر: ' + r);
        // آخر زخرفة على بطاقة القافلة
        await p.keyboard.press('Escape'); await p.evaluate(() => { __game.go('caravan'); __game.renderAll(true); }); await p.waitForTimeout(250);
        const last = p.locator('.sgoal.last'); assert.equal(await last.count(), 1, 'آخر زخرفة على القافلة'); assert.ok((await last.innerText()).includes('تاجر'), 'لقب آخر زخرفة'); assert.equal(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, 'القافلة: لا تمرير أفقي');
      }
      await p.close();
    }
    assert.deepEqual(errors, []); ok('لقطة لكل موسم من الإحدى عشرة الظاهرة على 390، وزخارف الإنجازات وآخر زخرفة، بلا تمرير أفقي'); console.log('\nseason-goals-ui: كلها ناجحة');
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
