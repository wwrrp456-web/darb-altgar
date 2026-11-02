'use strict';
// WP-24: واجهة هويات اللعب على 390px: بطاقة الهدف والمزية في الأكاديمية، والمزية في مكان استعمالها لكل شخصية، بلا تمرير أفقي، ومفتاحا الرجوع يخفيانها. اللقطات في docs/shots/wp24/
const assert = require('node:assert/strict'), path = require('node:path'), fs = require('node:fs'), { chromium } = require('/opt/node-tools/node_modules/playwright');
const OUT = path.join(__dirname, '../docs/shots/wp24'); fs.mkdirSync(OUT, { recursive: true }); const ok = m => console.log('OK   ' + m);
const PERK = { trader: ['.ideye', 'عين الطريق'], changer: ['.idfx', 'بوصلة الصرف'], leader: ['.idroad', 'تقدير الطريق'], shopkeeper: ['.idbook', 'دفتر الدكان'], negotiator: ['.idmood', 'قراءة الطبع'] };
(async () => {
  const b = await chromium.launch(), errors = [];
  try {
    for (const ch of Object.keys(PERK)) {
      const p = await b.newPage({ viewport: { width: 390, height: 844 } }); p.on('pageerror', e => errors.push(e.message)); p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
      await p.goto('file://' + path.join(__dirname, '../index.html') + '?learn=1&seed=37&sched=0'); await p.waitForFunction(() => !!window.__game);
      const nm = await p.evaluate(ch => { const g = __game, { S, E } = g; E.A.chooseStart(S, 'sa'); E.A.learnSetChar(S, ch); S.noLock = 1; S.player.famDebt = null; S.phase = 3; S.player.gold = 30000; Object.assign(S.learn, { welcome: 99, datePend: false, zseen: true, level: 11, stage: 23, stageIntro: 22, intro: 11, abroad: true, tab: Object.keys(window.Babylon.TABLETS) }); for (const q of ['stageUp', 'up', 'sq', 'tq', 'cq', 'fq', 'bq', 'csq', 'eq', 'rq']) S.learn[q] = [];
        g.setSpeed(0); document.querySelectorAll('#splash').forEach(e => e.remove()); g.go('academy'); g.renderAll(true); return { goal: E.ID_DEF[ch].goal, perk: E.ID_DEF[ch].perk }; }, ch);
      await p.waitForTimeout(300);
      const clean = async () => { const gotIt = p.locator('button', { hasText: 'فهمت' }); if (await gotIt.count() && await gotIt.first().isVisible()) await gotIt.first().click(); await p.evaluate(() => { document.querySelectorAll('button').forEach(b => { if (/افتح عمّ سالم/.test(b.textContent)) { let x = b; while (x.parentElement && !['fixed', 'absolute'].includes(getComputedStyle(x).position)) x = x.parentElement; x.remove(); } }); document.querySelectorAll('#spot,#spotArrow').forEach(e => e.remove()); }); };
      const noScroll = async w => assert.equal(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, ch + ' ' + w + ': لا تمرير أفقي');
      const card = p.locator('.idcard'); assert.equal(await card.count(), 1, ch + ': بطاقة الهوية'); const t = await card.innerText();
      assert.ok(t.includes(nm.goal.name) && t.includes(nm.goal.text) && t.includes(nm.perk.name) && t.includes(nm.perk.text) && /\+30 نفوذ و\+12 خبرة/.test(t), ch + ': الهدف والمزية والجائزة'); await noScroll('الأكاديمية');
      await clean(); await p.evaluate(() => { const c = document.querySelector('.idcard'); window.scrollTo(0, c.getBoundingClientRect().top + scrollY - 100); }); await p.waitForTimeout(150); await p.screenshot({ path: path.join(OUT, ch + '-card-390.png') });
      // المزية في مكان استعمالها
      await p.evaluate(ch => { const g = __game, { S } = g; const car = S.player.caravans[0];
        if (ch === 'trader') { S.learn.cv = { [car.city]: 1 }; g.go('map'); }
        if (ch === 'changer') { g.go('cities'); }
        if (ch === 'leader') { const to = S.order.find(x => x !== car.city); g.dealGo('wheat', to, 10); }
        if (ch === 'shopkeeper') { const home = __game.E.START_OF[S.home]; __game.E.A.buildShop(S, home); g.go('estate'); }
        if (ch === 'negotiator') { const c = S.cities[car.city], gd = __game.E.GIDS.find(x => __game.E.sells(c, x) && !__game.E.GD[x].sp && c.stock[x] > 40); window.__hg = gd; __game.E.A.haggleStart(S, gd, 'buy', 20); g.go('market'); }
        g.renderAll(true); }, ch);
      await p.waitForTimeout(300);
      if (ch === 'changer') { await p.locator('[data-ct=fx]').click(); await p.waitForTimeout(200); }
      if (ch === 'negotiator') { await p.evaluate(() => { const L = __game.S.learn; for (const q of ['stageUp', 'up', 'sq', 'tq', 'cq', 'fq', 'bq', 'csq', 'eq', 'rq']) L[q] = []; __game.renderAll(true); }); await p.waitForTimeout(200); const gd = await p.evaluate(() => window.__hg); await p.locator('[data-gd="' + gd + '"]').first().click(); await p.waitForTimeout(250); }
      await clean(); const [sel, name] = PERK[ch], el = p.locator(sel).first(); assert.ok(await el.count() >= 1, ch + ': المزية ظاهرة في مكانها (' + sel + ')'); assert.ok((await el.innerText()).includes(name) || ch === 'negotiator' && /قراءة الطبع/.test(await el.innerText()) || ch === 'shopkeeper' && /دكان/.test(await el.innerText()), ch + ': نص المزية');
      if (ch === 'changer') assert.ok(/اتجاه متوقع لا ضمان/.test(await el.innerText()), 'عبارة «اتجاه متوقع لا ضمان»'); if (ch === 'trader') assert.ok(await p.locator('#idEyeSel').count() === 1 && /سعر .* اليوم/.test(await el.innerText()), 'سعر اليوم لسلعة مختارة');
      await noScroll('مكان المزية'); await el.scrollIntoViewIfNeeded(); await p.evaluate(sel => { const e = document.querySelector(sel); window.scrollTo(0, e.getBoundingClientRect().top + scrollY - 160); }, sel); await p.waitForTimeout(150); await p.screenshot({ path: path.join(OUT, ch + '-perk-390.png') });
      // مفتاحا الرجوع: مطفآن ⇒ لا بطاقة ولا مزية
      await p.evaluate(() => { __game.E.IDENTITY.goals = false; __game.E.IDENTITY.perks = false; __game.renderAll(true); }); await p.waitForTimeout(200); for (const s of ['.idcard', '.ideye', '.idfx', '.idroad', '.idbook', '.idmood']) assert.equal(await p.locator(s).count(), 0, ch + ': مفتاح الرجوع يخفي ' + s);
      await p.close();
    }
    assert.deepEqual(errors, []); ok('بطاقة الهوية والمزية في مكانها لكل شخصية من الخمس على 390، بلا تمرير أفقي، ومفتاحا الرجوع يخفيانها'); console.log('\nidentities-ui: كلها ناجحة');
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
