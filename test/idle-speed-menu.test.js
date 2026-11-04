'use strict';
// EXEC 01: اختيار «سرعة الوقت أثناء الوقوف» من قائمة ⋯ يغلق القائمة فيمضي الوقت فوراً (لا تبقى الساعة blocked). 390، ?learn=1&idle=1 (وضع player=1 يُظهر الغلاف فيُخفي الترويسة)
const a = require('node:assert/strict'), path = require('node:path'), { chromium } = require('/opt/node-tools/node_modules/playwright');
const base = () => { const g = __game, S = g.S, A = g.E.A; g.setSpeed(0); A.learnSetChar(S, 'trader'); S.noLock = 1; Object.assign(S.learn, { intro: 11, level: 11, stage: 23, stageIntro: 22, free: true, zseen: 1, datePend: false, tab: Object.keys(g.E.BAB.TABLETS) }); S.phase = 3; S.noEvents = true; S.noShocks = true; S.player.wallet.sar = 400000; };
const clean = () => { const S = __game.S; for (const k of ['tq', 'eq', 'fq', 'rq', 'up', 'stageUp', 'sq', 'cq', 'bq', 'csq']) S.learn[k] = []; S.climate.pending = []; };
(async () => {
  const b = await chromium.launch(), errors = [];
  try {
    const p = await b.newPage({ viewport: { width: 390, height: 900 } }); p.on('pageerror', e => errors.push(e.message)); p.on('dialog', d => d.accept());
    await p.goto('file://' + path.join(__dirname, '../index.html') + '?learn=1&idle=1&seed=21&fold=1'); await p.waitForFunction(() => !!window.__game);
    await p.evaluate(base); await p.evaluate(clean); await p.evaluate(() => { __game.setSpeed(1); __game.go('office'); __game.renderAll(true); });
    await p.locator('#hMenu').click(); a.equal(await p.evaluate(() => document.querySelector('#hmenuPanel').classList.contains('show')), true, 'القائمة مفتوحة');
    a.equal(await p.locator('#bPause').getAttribute('data-clock'), 'blocked', 'والوقت متوقف ما دامت القائمة مفتوحة');
    await p.locator('#hIdleSpeed').selectOption('3');
    a.equal(await p.evaluate(() => document.querySelector('#hmenuPanel').classList.contains('show')), false, 'القائمة أُغلقت بعد اختيار السرعة');
    await p.waitForFunction(() => document.querySelector('#bPause').dataset.clock === 'idle', null, { timeout: 3000 }); a.equal(await p.locator('#bPause').getAttribute('data-clock'), 'idle');
    const d0 = await p.evaluate(() => __game.S.day); await p.waitForTimeout(8000); const d1 = await p.evaluate(() => __game.S.day); a(d1 > d0, 'اليوم يتقدم خلال 8 ثوانٍ: ' + d0 + ' → ' + d1);
    a.equal(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, 'تمرير أفقي');
    a.equal(errors.length, 0, errors.join('\n')); console.log('PASS idle-speed-menu 390: menu closes after choosing speed, clock idle (not blocked), day advances');
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exit(1); });
