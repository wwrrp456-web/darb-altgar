'use strict';
// WP-18: رحلة الفصول السبعة في الأكاديمية: ثلاث حالات (بداية، وسط ف٣، بعد التخرج) × عرضان (390 و1100)؛ اللقطات الست في docs/shots/wp18/
const assert = require('node:assert/strict'), path = require('node:path'), fs = require('node:fs'), { chromium } = require('/opt/node-tools/node_modules/playwright');
const OUT = path.join(__dirname, '../docs/shots/wp18'); fs.mkdirSync(OUT, { recursive: true });
const STATES = {
  start: g => { const { S } = g; Object.assign(S.learn, { level: 1, stage: 1 }); },
  mid: g => { const { S, E } = g; Object.assign(S.learn, { stageDone: [1, 2, 3, 4, 5], stage: 6, level: E.STAGES[5].source, up: [1, 2, 3, 4, 5] }); S.learn.mj.seen.aib = { ok: true }; },
  grad: g => { const { S } = g; Object.assign(S.learn, { stageDone: Array.from({ length: 22 }, (_, i) => i + 1), stage: 23, level: 11, up: [1, 2, 3, 4, 5, 6] }); },
};
(async () => {
  const b = await chromium.launch(); const errors = [];
  try {
    for (const [name, W, H] of [['390', 390, 844], ['1100', 1100, 900]]) {
      for (const st of Object.keys(STATES)) {
        const p = await b.newPage({ viewport: { width: W, height: H } }); p.on('pageerror', e => errors.push(e.message)); p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
        await p.goto('file://' + path.join(__dirname, '../index.html') + '?learn=1&seed=37&player=1&sched=0'); await p.waitForFunction(() => !!window.__game);
        await p.evaluate(s => { const g = __game, { S, E } = g; E.A.chooseStart(S, 'sa'); E.A.learnSetChar(S, 'trader'); S.noLock = 1; Object.assign(S.learn, { welcome: 99, datePend: false, zseen: true, ageStages: true }); for (const k of ['stageUp', 'up', 'sq', 'tq', 'cq', 'fq', 'bq', 'csq', 'eq', 'rq']) S.learn[k] = []; g.__st = s; }, st);
        await p.evaluate(({ st, src }) => { const g = __game; (new Function('g', 'return (' + src + ')(g)'))(g); g.go('academy'); g.renderAll(true); }, { st, src: STATES[st].toString() });
        await p.evaluate(() => document.querySelectorAll('#splash').forEach(e => e.remove())); await p.waitForTimeout(300);
        assert.equal(await p.locator('.chj-node').count(), 7, st + ': سبع عقد');
        const cur = await p.locator('.chj-node.current').count(); const exp = await p.evaluate(() => __game.E.chapterJourney(__game.S, window.ContentMap.PIECES).filter(c => c.state === 'current').length);
        assert.equal(cur, exp, st + ': الحالي مميز'); if (st !== 'grad') assert.equal(cur, 1, st + ': حالي واحد');
        if (st === 'mid') { assert.ok((await p.locator('.chj-node.current').innerText()).includes('الدكان والأمانة'), 'الحالي ف٣'); assert.equal(await p.locator('.chj-node.done').count(), 2, 'ف١ وف٢ منجزان'); }
        const first = p.locator('.chj-node').first(); if (!(await first.evaluate(e => e.open))) await first.locator('summary').click();
        assert.ok(/أنجزت \d+ من \d+/.test(await first.innerText()), st + ': عدّ الإنجاز'); assert.ok((await first.locator('.chj-body .kv').count()) >= 3, st + ': قائمة المحتوى');
        const ov = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1); assert.equal(ov, false, st + ' ' + name + ': لا تمرير أفقي');
        assert.equal(await p.locator('.chj-ic img').count(), 7, 'أيقونات الفصول السبع');
        await p.evaluate(() => { document.querySelectorAll('button').forEach(b => { if (/افتح عمّ سالم/.test(b.textContent)) { let x = b; while (x.parentElement && !['fixed', 'absolute'].includes(getComputedStyle(x).position)) x = x.parentElement; x.remove(); } }); document.querySelectorAll('#spot,#spotArrow').forEach(e => e.remove()); document.body.classList.remove('spotting'); });
        const gotIt = p.locator('button', { hasText: 'فهمت' }); if (await gotIt.count() && await gotIt.first().isVisible()) await gotIt.first().click();
        await p.evaluate(() => { document.querySelectorAll('.chj-node[open]').forEach(d => { if (!d.classList.contains('current') && !d.matches(':first-child.current')) d.open = false; }); const h = document.querySelector('.chj').previousElementSibling; window.scrollTo(0, h.getBoundingClientRect().top + scrollY - 150); }); await p.waitForTimeout(150);
        await p.screenshot({ path: path.join(OUT, st + '-' + name + '.png'), fullPage: false });
        if (st === 'start' && name === '390') {
          await p.evaluate(() => { __game.ui.chapters = false; __game.renderAll(true); }); assert.equal(await p.locator('.chj').count(), 0, 'ui.chapters=false: لا رحلة');
          await p.evaluate(() => { delete __game.ui.chapters; __game.renderAll(true); });
        }
        await p.close();
      }
    }
    assert.deepEqual(errors, []); console.log('PASS chapters-ui: سبع عقد، الحالي مميز، المحتوى، بلا تمرير أفقي، ولقطات ست في docs/shots/wp18');
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
