'use strict';
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const OUT = path.join(__dirname, '../docs/shots/wp26');
const IDS = ['first_country', 'first_ship', 'market_lead', 'first_million', 'chapter_done', 'retirement'];
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
async function ready(p) {
  await p.clock.install({ time: new Date('2026-10-30T12:00:00Z') });
  await p.clock.pauseAt(new Date('2026-10-30T12:05:00Z'));
  await p.goto('file://' + path.join(__dirname, '../index.html') + '?learn=1&seed=5');
  await p.clock.runFor(1000);
  assert(await p.evaluate(() => !!window.__game?.S));
  await p.evaluate(() => {
    const g = __game, S = g.S, E = g.E; g.setSpeed(0); E.A.chooseStart(S, 'sa'); E.A.learnSetChar(S, 'trader');
    S.noLock = 1; S.noEvents = true; S.noShocks = true; S.phase = 4; S.day = 10; S.player.famDebt.left = 0;
    Object.assign(S.learn, { level: 11, stage: 23, stageDone: Array.from({ length: 22 }, (_, i) => i + 1), stageIntro: 99, intro: 11, welcome: 99, momN: 22, free: true, zseen: true, datePend: false, fxSeen: true, lastMom: -99, rest: null });
    for (const q of ['stageUp','up','sq','tq','cq','fq','bq','csq','eq','rq','sgq','schedHold']) S.learn[q] = [];
    S.life = {}; if (S.story) S.story.cur = null; delete S.road; delete S.learn.cel; delete S.learn.celq;
    E.celebrateProgress(S); document.querySelector('#splash')?.remove(); g.go('home'); g.renderAll(true);
  });
}
async function queue(p, id, arg) {
  await p.evaluate(() => { __game.S.day += 6; });
  await p.evaluate(({ id, arg }) => { const { S, E } = __game; if (!E.celebrate(S, id, arg)) throw Error('لم يُضف ' + id); E.schedRelease(S); __game.renderAll(true); }, { id, arg });
}
async function photo(p, id, width, rows) {
  const layer = p.locator('#celebrateLayer'); assert(await layer.isVisible(), id + ': ظاهر');
  assert.equal(await layer.locator('.cel-scene').getAttribute('src').then(s => s.includes('celebrate/' + id)), true);
  let loaded = false;
  for (let i = 0; i < 60; i++) { loaded = await layer.locator('.cel-scene').evaluate(e => e.complete && e.naturalWidth === 1280 && e.naturalHeight === 540); if (loaded) break; await pause(50); }
  assert(loaded, id + ': الصورة الحقيقية مكتملة');
  const portrait = await layer.locator('.salem-portrait').evaluate(e => ({ width: e.getBoundingClientRect().width, height: e.getBoundingClientRect().height, position: getComputedStyle(e).position, overflow: getComputedStyle(e).overflow }));
  assert.deepEqual(portrait, { width: 48, height: 48, position: 'relative', overflow: 'hidden' }, 'صورة عم سالم صغيرة ومقصوصة داخل البطاقة');
  const text = await layer.locator('.celebrate-line').innerText(); assert(text.trim().split(/\s+/).length <= 10, text);
  assert.equal(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, id + ': لا تمرير أفقي');
  const name = id + '-' + width + '.jpg'; await p.screenshot({ path: path.join(OUT, name), type: 'jpeg', quality: 65, animations: 'disabled' });
  rows.push({ id, width, text, file: name, imageLoaded: loaded, overflow: false });
}
async function dismiss(p, escape = false) {
  if (escape) await p.keyboard.press('Escape'); else await p.locator('#celebrateCard').click();
  await p.clock.runFor(200); assert.equal(await p.locator('#celebrateLayer:visible').count(), 0, 'تخطي المشهد');
}
async function testBasics() {
  fs.mkdirSync(OUT, { recursive: true }); const b = await chromium.launch(), rows = [], errors = [];
  try {
    for (const width of [390, 1100]) {
      const p = await b.newPage({ viewport: { width, height: 844 } }); p.on('pageerror', e => errors.push(e.message));
      await ready(p);
      if (width === 390) {
        await p.evaluate(() => { const { S, E } = __game; S.learn.eq = [{ id: 'broker', dep: 100, pct: 50 }]; E.celebrate(S, 'first_country', 'eg'); E.schedRelease(S); __game.renderAll(true); });
        assert(await p.locator('#lesson').isVisible(), 'قرار السمسار مفتوح'); assert.equal(await p.locator('#celebrateLayer:visible').count(), 0, 'لا احتفال فوق الحدث');
        await p.locator('#lesson [data-act=evch][data-g=no]').click(); await photo(p, 'first_country', width, rows);
        await p.evaluate(() => { const { S, E } = __game; E.celebrate(S, 'retirement'); __game.renderAll(true); });
        await photo(p, 'retirement', width, rows); // يتجاوز المشهد السابق فوراً، لا ينتظر المؤقت.
        await p.locator('#hAvatar').click(); assert(await p.locator('#profile').isVisible()); assert.equal(await p.locator('#celebrateLayer:visible').count(), 0, 'القرار الجديد يزيح المشهد فوراً');
        await p.keyboard.press('Escape'); assert.equal(await p.locator('#celebrateLayer:visible').count(), 0, 'لا إعادة بعد إغلاق الملف الشخصي');
        assert.equal(await p.evaluate(() => __game.E.celebrate(__game.S, 'first_country', 'ir')), false, 'لا عرض ثان للمحفز');
        await p.evaluate(() => { __game.E.CELEBRATE.on = false; __game.renderAll(true); });
        assert.equal(await p.evaluate(() => __game.E.celebrate(__game.S, 'first_ship', 1)), false); assert.equal(await p.locator('#celebrateLayer:visible').count(), 0); await p.evaluate(() => { __game.E.CELEBRATE.on = true; });
      }
      for (const id of IDS) {
        if (width === 390 && ['first_country', 'retirement'].includes(id)) continue;
        if (width === 390 && id === 'first_ship') await p.emulateMedia({ reducedMotion: 'reduce' });
        await queue(p, id, id === 'chapter_done' ? 4 : undefined);
        if (width === 390 && id === 'first_ship') assert.equal(await p.locator('#celebrateCard').evaluate(e => getComputedStyle(e).animationName), 'none', 'تقليل الحركة: صورة ثابتة');
        await photo(p, id, width, rows);
        if (width === 390 && id === 'first_million') { await p.clock.runFor(2840); assert(await p.locator('#celebrateLayer').isVisible(), 'لا يغلق قبل3 ثوان'); await p.clock.runFor(160); assert.equal(await p.locator('#celebrateLayer:visible').count(), 0, 'يختفي بعد3 ثوان'); }
        else await dismiss(p, id === 'chapter_done');
        if (width === 390 && id === 'first_ship') await p.emulateMedia({ reducedMotion: 'no-preference' });
      }
      await p.close();
    }
    assert.equal(rows.length, 12); assert.deepEqual(errors, []); fs.writeFileSync(path.join(OUT, 'QA.json'), JSON.stringify({ screenshots: rows, errors }, null, 2) + '\n');
    console.log('PASS celebrate UI: twelve real screenshots, foreground priority, retirement, touch/Escape,3s, reduced motion and no overflow');
  } finally { await b.close(); }
}
async function testJourney() {
  const run = require('./lib/autopilot-runner');
  await run({ phase: 'graduate', observe: async p => {
    await p.evaluate(() => {
      window.__celBefore = { ...(__game.S.learn.cel?.shown || {}) }; window.__celTrace = [];
      document.addEventListener('celebrate:shown', event => {
        const S = __game.S, panels = [...document.querySelectorAll('[role=dialog],#lesson,#modal,#dlg,#agingPanel,#profile,#rcpt,#alertPanel,.hmenu')];
        const blocked = !!(__game.learnNext() || S.road || S.life?.pending || S.learn.eq?.length || panels.some(e => !e.hidden && e.getClientRects().length && getComputedStyle(e).display !== 'none'));
        __celTrace.push({ ...event.detail, blocked });
      });
    });
  }, inspect: async p => {
    await p.evaluate(() => __game.renderAll(true)); // نهاية المشغل لا ترسم تلقائياً آخر قرار؛ نعرضه ونغلقه بالنقر.
    for (let i = 0; i < 40; i++) {
      const state = await p.evaluate(() => {
        const S = __game.S, c = S.learn.cel || {}, fired = Object.keys(c).filter(k => /^(first_country|first_ship|market_lead|first_million|retirement|chapter_done:[1-7])$/.test(k));
        return { missing: fired.filter(k => c.shown?.[k] == null), active: !!document.querySelector('#celebrateLayer:not([hidden])'), next: __game.learnNext()?.k };
      });
      if (!state.missing.length && !state.active) break;
      if (state.active) { await p.locator('#celebrateCard').click(); await pause(180); continue; }
      if (state.next) {
        const button = p.locator('#lesson [data-act=evch][data-g=no],#lesson [data-act=evch][data-g=later],#lesson [data-act=lclose]:not(:disabled),#lesson [data-act=climateclose]').first();
        assert(await button.isVisible(), 'قرار لا يُتجاوز في تدقيق الاحتفال: ' + state.next); await button.click(); continue;
      }
      const receipt = p.locator('#rcpt:not([hidden]) [data-act=rcptclose]');
      if (await receipt.isVisible()) { await receipt.click(); continue; }
      await p.evaluate(() => { const { S, E } = __game; E.tick(S, false); S.pause = false; __game.renderAll(true); }); await pause(30);
    }
    const data = await p.evaluate(() => { const c = __game.S.learn.cel || {}; return { level: __game.S.learn.level, fired: Object.keys(c).filter(k => /^(first_country|first_ship|market_lead|first_million|retirement|chapter_done:[1-7])$/.test(k)), shown: c.shown || {}, before: __celBefore, trace: __celTrace }; });
    if (data.fired.some(key => data.shown[key] == null)) console.log('celebrate pending audit', JSON.stringify(await p.evaluate(() => ({ next: __game.learnNext(), celq: __game.S.learn.celq, held: __game.S.learn.schedHold, life: __game.S.life, road: __game.S.road, dialogs: [...document.querySelectorAll('[role=dialog],#lesson,#modal,#dlg,#agingPanel,#profile,#rcpt,#alertPanel,.hmenu')].filter(e => !e.hidden && e.getClientRects().length).map(e => e.id), book: __game.S.learn.cel }))));
    assert(data.level >= 11); assert(data.fired.some(k => k.startsWith('chapter_done:')));
    for (const key of data.fired) assert(data.shown[key] != null, 'أُطلق ثم عُرض: ' + key);
    assert(data.trace.every(x => !x.blocked), 'لا مشهد فوق قرار أثناء المسار الفعلي');
    assert.equal(new Set(data.trace.map(x => x.key)).size, data.trace.length, 'كل مشهد مرة واحدة');
    for (const key of Object.keys(data.before)) { assert.equal(data.shown[key], data.before[key]); assert(!data.trace.some(x => x.key === key), 'لا إعادة لمشهد محفوظ'); }
    fs.writeFileSync(path.join(OUT, 'AUTOPLAY.json'), JSON.stringify(data, null, 2) + '\n'); console.log('PASS actual graduate celebration audit: ' + data.fired.join(', '));
  } });
}
module.exports = { testBasics, testJourney };
if (require.main === module) (async () => { await testBasics(); await testJourney(); console.log('\ncelebrate-ui: كلها ناجحة'); })().catch(error => { console.error(error); process.exitCode = 1; });
