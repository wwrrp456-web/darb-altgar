'use strict';
// EXEC 04 (بند 4 من فحص 1.0): تركيز قائمة ⋯: عند الفتح إلى أول عنصر فيها، وعند الإغلاق (Escape أو ⋯ أو اختيار السرعة) يعود إلى زر ⋯، ولا يُسرَق التركيز عند النقر خارجها.
const a = require('node:assert/strict'), path = require('node:path'), { chromium } = require('/opt/node-tools/node_modules/playwright');
const act = p => p.evaluate(() => document.activeElement.id || document.activeElement.tagName);
(async () => {
  const b = await chromium.launch(), errors = [];
  try {
    const p = await b.newPage({ viewport: { width: 390, height: 844 } }); p.on('pageerror', e => errors.push(e.message));
    await p.goto('file://' + path.join(__dirname, '../index.html') + '?learn=1&idle=1&seed=5'); await p.waitForFunction(() => !!window.__game);
    await p.evaluate(() => { const g = __game, { S, E } = g; E.A.chooseStart(S, 'sa'); E.A.learnSetChar(S, 'trader'); S.noLock = 1; Object.assign(S.learn, { intro: 11, welcome: 99, level: 11, stage: 23, stageIntro: 99, free: true, zseen: true, datePend: false }); for (const q of ['stageUp', 'up', 'sq', 'tq', 'cq', 'fq', 'bq', 'csq', 'eq', 'rq']) S.learn[q] = []; document.querySelectorAll('#splash,#lesson').forEach(e => e.remove()); g.setSpeed(0); g.go('market'); g.renderAll(true); });
    const inMenu = () => p.evaluate(() => document.querySelector('#hmenuPanel').contains(document.activeElement));
    await p.locator('#hMenu').click(); a.equal(await inMenu(), true, 'عند الفتح التركيز داخل القائمة'); a.notEqual(await act(p), 'hMenu');
    await p.keyboard.press('Escape'); a.equal(await act(p), 'hMenu', 'Escape يعيد التركيز إلى ⋯'); a.equal(await p.locator('#hMenu').getAttribute('aria-expanded'), 'false');
    await p.locator('#hMenu').click(); await p.locator('#hMenu').click(); a.equal(await act(p), 'hMenu', 'النقر على ⋯ للإغلاق يبقي التركيز عليه');
    await p.locator('#hMenu').click(); await p.locator('#hIdleSpeed').selectOption('7'); a.equal(await p.evaluate(() => document.querySelector('#hmenuPanel').classList.contains('show')), false); a.equal(await act(p), 'hMenu', 'بعد اختيار السرعة يعود التركيز إلى ⋯');
    // النقر على عنصر خارج القائمة لا يسرق التركيز
    await p.locator('#hMenu').click(); await p.evaluate(() => { const n = document.querySelector('#nav button'); n.focus(); n.click(); }); a.equal(await p.evaluate(() => document.querySelector('#hmenuPanel').classList.contains('show')), false); a.notEqual(await act(p), 'hMenu', 'لا يُسرق التركيز من العنصر المنقور');
    // لوحة المفاتيح: Tab يبقى داخل القائمة المفتوحة ثم Escape يعيد
    await p.locator('#hMenu').focus(); await p.keyboard.press('Enter'); a.equal(await inMenu(), true); for (let i = 0; i < 6; i++) await p.keyboard.press('Tab'); a.equal(await inMenu(), true, 'Tab لا يتسرب خارج القائمة'); await p.keyboard.press('Escape'); a.equal(await act(p), 'hMenu');
    a.equal(errors.length, 0, errors.join('\n')); console.log('PASS menu-focus: focus enters the menu, returns to ⋯ on Escape/toggle/speed choice, not stolen by outside click');
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exit(1); });
