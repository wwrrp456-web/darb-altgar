'use strict';
// WP-19أ (D7): طبقتا القراءة (كبير/ناشئ) على 390 و1100: الكبير يرى النص الحالي حرفياً، والناشئ يرى القصير و«اقرأ أكثر» فيه النص الحالي بحرفه، بلا تمرير أفقي. اللقطات في docs/shots/wp19a/
const assert = require('node:assert/strict'), path = require('node:path'), fs = require('node:fs'), { chromium } = require('/opt/node-tools/node_modules/playwright');
const OUT = path.join(__dirname, '../docs/shots/wp19a'); fs.mkdirSync(OUT, { recursive: true }); const ok = m => console.log('OK   ' + m);
// الإيموجي المسجَّل تستبدله اللعبة بأيقونة مرسومة، وقد تدخل مسافات حوله: تُقارن النصوص بلا إيموجي ولا مسافات
const norm = s => s.replace(/[\u{1F300}-\u{1FAFF}\u2600-\u27BF\uFE0F]/gu, '').replace(/\s+/g, '');
(async () => {
  const b = await chromium.launch(), errors = [];
  try {
    for (const [wname, W, H] of [['390', 390, 844], ['1100', 1100, 900]]) for (const reader of ['adult', 'young']) {
      const p = await b.newPage({ viewport: { width: W, height: H } }); p.on('pageerror', e => errors.push(e.message)); p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
      await p.goto('file://' + path.join(__dirname, '../index.html') + '?learn=1&seed=37&cards=1&sched=0'); await p.waitForFunction(() => !!window.__game);
      await p.evaluate(r => { const g = __game, { S, E } = g; E.A.chooseStart(S, 'sa'); E.A.learnSetChar(S, 'trader'); S.noLock = 1; Object.assign(S.learn, { welcome: 99, datePend: false, zseen: true }); for (const k of ['stageUp', 'up', 'sq', 'tq', 'cq', 'fq', 'bq', 'csq', 'eq', 'rq']) S.learn[k] = []; g.ui.reader = r; document.querySelectorAll('#splash').forEach(e => e.remove()); }, reader);
      const D = await p.evaluate(() => { const E = __game.E, C = E.CARDS.CARDS.g_fleet, T = window.Babylon.TABLETS.cure2, L1 = window.Lessons.LEVELS[0]; return { cFull: C.text[1], cShort: C.textShort[1], cFirst: C.text[0], tFull: T.text, tShort: T.textShort, lFull: L1.lesson[1], lShort: L1.lessonShort[1], lPlain: L1.lesson[0] }; });
      assert.ok(D.cShort && D.tShort && D.lShort && !D.lPlain.includes('undefined'), 'حقول short موجودة');
      const check = async (what, full, short, plain) => {
        const box = p.locator('#lesson'); await box.waitFor({ state: 'visible' }); const txt = norm(await box.innerText()), n = await box.locator('.rd-short').count();
        if (reader === 'adult') { assert.equal(n, 0, what + ': الكبير بلا طبقة قصيرة'); assert.ok(txt.includes(norm(full)), what + ': الكبير يرى النص الحالي حرفياً'); assert.equal(await box.locator('details.more').count(), 0); }
        else { assert.ok(n >= 1, what + ': الناشئ يرى القصير'); assert.ok((await box.locator('.rd-short').allInnerTexts()).some(t => norm(t).includes(norm(short))), what + ': نص القصير'); assert.ok((await box.locator('details.more .rd-full').allTextContents()).some(t => norm(t) === norm(full)), what + ': «اقرأ أكثر» فيه النص الحالي بحرفه');
          const d = box.locator('details.more').first(); assert.equal(await d.evaluate(e => e.open), false); await d.locator('summary').click(); assert.ok(await d.locator('.rd-full').isVisible(), what + ': الضغط يكشف النص'); }
        if (plain) assert.ok(txt.includes(norm(plain)), what + ': النص غير المحوَّل يظهر كما هو');
        assert.equal(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, what + ' ' + wname + ': لا تمرير أفقي');
      };
      // بطاقة ميدان
      await p.evaluate(() => { __game.S.learn.cq = ['g_fleet']; __game.renderAll(true); }); await p.waitForTimeout(250); await check('بطاقة', D.cFull, D.cShort, null);
      await p.screenshot({ path: path.join(OUT, reader + '-' + wname + '.png') });
      await p.evaluate(() => { __game.S.learn.cq = []; document.querySelector('#lesson [data-act=lclose]')?.click(); __game.renderAll(true); }); await p.waitForTimeout(150);
      // لوح
      await p.evaluate(() => { __game.S.learn.tab = ['cure2']; __game.S.learn.tq = ['cure2']; __game.renderAll(true); }); await p.waitForTimeout(250); await check('لوح', D.tFull, D.tShort, null);
      await p.evaluate(() => { __game.S.learn.tq = []; document.querySelector('#lesson [data-act=lclose]')?.click(); __game.renderAll(true); }); await p.waitForTimeout(150);
      // درس المستوى 1: فقرة بقصير وفقرة بلا قصير
      await p.evaluate(() => { document.body.insertAdjacentHTML('beforeend', '<button id="tlv" data-act="lview" data-g="1" style="position:fixed;top:0;left:0">v</button>'); document.getElementById('tlv').click(); }); await p.waitForTimeout(250); await check('درس', D.lFull, D.lShort, D.lPlain);
      await p.close();
    }
    assert.deepEqual(errors, []); ok('طبقتا القراءة على 390 و1100: الكبير حرفي، والناشئ قصير + «اقرأ أكثر» بالنص الحالي، بلا تمرير أفقي'); console.log('\nreading-ui: كلها ناجحة');
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
