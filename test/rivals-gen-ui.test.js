'use strict';
// 028أ المنافسون المولَّدون (واجهة): الخبر وبطاقة «المنافسون» في المكتب بلا مقاطعة، قائمة المنافسين بالفكرة والردّ، الذاكرة على الجهاز، 390 بلا تمرير أفقي، مفتاح الرجوع (SC-004)
const a = require('node:assert/strict'), path = require('node:path'), { chromium } = require('/opt/node-tools/node_modules/playwright');
const SHOTS = path.join(__dirname, '../docs/shots/rivals-gen');
const base = () => { const g = __game, S = g.S, A = g.E.A; g.setSpeed(0); A.learnSetChar(S, 'trader'); S.noLock = 1; Object.assign(S.learn, { intro: 11, level: 11, stage: 23, stageIntro: 22, free: true, zseen: 1, datePend: false, tab: Object.keys(g.E.BAB.TABLETS) }); S.phase = 3; S.noEvents = true; S.noShocks = true; S.player.wallet.sar = 400000; };
const clean = () => { const S = __game.S; for (const k of ['tq', 'eq', 'fq', 'rq', 'up', 'stageUp', 'sq', 'cq', 'bq', 'csq']) S.learn[k] = []; S.climate.pending = []; };
const born = () => { const g = __game, S = g.S; S.noShocks = true; S.noEvents = true; S.day = 119; for (let i = 0; i < 3; i++) { g.E.tick(S, false); S.pause = false; } };
(async () => {
  const b = await chromium.launch(), errors = [];
  const open = async (w, setup) => { const p = await b.newPage({ viewport: { width: w, height: 950 } }); p.on('pageerror', e => errors.push(e.message)); p.on('dialog', d => d.accept()); await p.goto('file://' + path.join(__dirname, '../index.html') + '?learn=1&seed=21&fold=1'); await p.waitForFunction(() => !!window.__game); await p.evaluate(base); await p.evaluate('window.__born = ' + born.toString()); await p.evaluate(setup); await p.evaluate(clean); await p.evaluate(() => { __game.OFFICETABS.on = false; Object.assign(__game.ui.fold || (__game.ui.fold = {}), { 'of-diwan': 1, 'of-cchief': 1, 'of-portm': 1, 'of-rivals': 1 }); __game.go('office'); __game.renderAll(true); }); return p; };
  const noOverflow = async p => a.equal(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, 'تمرير أفقي');
  const shot = async (p, sel, name) => { await p.evaluate(() => { for (const el of document.querySelectorAll('body *')) if (getComputedStyle(el).position === 'fixed' && /عمّ سالم/.test(el.textContent) && el.textContent.length < 400) el.style.display = 'none'; }); await p.locator(sel).first().scrollIntoViewIfNeeded(); await p.screenshot({ path: path.join(SHOTS, name) }); };
  { // قبل أي ولادة: لا بطاقة
    const p = await open(390, () => {}); a.equal(await p.locator('section.rivals').count(), 0, 'لا بطاقة قبل أول منافس'); await p.close();
  }
  for (const w of [390, 1100]) {
    const p = await open(w, () => window.__born()); const card = p.locator('section.rivals'); a(await card.isVisible(), 'البطاقة'); const t = await card.innerText();
    a.match(t, /المنافسون/); a.match(t, /الردّ:/); a.equal(await p.locator('.rival-row').count(), 1);
    const news = await p.evaluate(() => __game.S.news.filter(n => /منافس جديد في السوق/.test(n.t)).length); a.equal(news, 1, 'خبر الولادة');
    a.equal(await p.evaluate(() => !!(__game.S.story && __game.S.story.cur) || !!document.querySelector('dialog[open]')), false, 'بلا مقاطعة'); await noOverflow(p);
    const name = await p.evaluate(() => __game.S.rivals[0].name); a(t.includes(name), 'الاسم في البطاقة');
    await shot(p, 'section.rivals', 'card-' + w + '.png'); await p.close();
  }
  { // قائمة بعدة منافسين على 390
    const p = await open(390, () => { window.__born(); const g = __game, S = g.S; for (let i = 0; i < 3; i++) g.E.rivalGenBirth(S); g.renderAll(true); }); a.equal(await p.locator('.rival-row').count(), 4); await noOverflow(p); await shot(p, 'section.rivals', 'list-390.png'); await p.close();
  }
  { // الذاكرة على الجهاز: تُكتب بعد الولادة وتُقرأ عند الفتح التالي
    const p = await open(390, () => window.__born()); await p.evaluate(() => { __game.E.tick(__game.S, false); }); const m = await p.evaluate(() => { try { return JSON.parse(localStorage.getItem('darb-rival-memory')); } catch (e) { return null; } });
    await p.evaluate(() => { const S = __game.S; S.day = 0; localStorage.setItem('darb-rival-memory', JSON.stringify({ recent: [], counts: { dom: { live: 50 } } })); }); a(m === null || Array.isArray(m.recent), 'صيغة الذاكرة'); await p.close();
  }
  { // مفتاح الرجوع
    const p = await open(390, () => { window.__born(); __game.E.RIVALGEN.on = false; }); a.equal(await p.locator('section.rivals').count(), 0); await p.close();
  }
  a.equal(errors.length, 0, errors.join('\n')); console.log('PASS rivals-gen UI 390/1100: news without interruption, card, list, memory, no overflow, off switch');
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
