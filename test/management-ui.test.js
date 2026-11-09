'use strict';
// 023 هيكل الإدارة (واجهة): منظومة صغيرة وكبيرة على 390 و1100، بلا تمرير أفقي، والأزرار عند تحقق الشروط فقط، ومفتاح الرجوع.
const a = require('node:assert/strict'), path = require('node:path'), { chromium } = require('/opt/node-tools/node_modules/playwright');
const SHOTS = path.join(__dirname, '../docs/shots/management');
const base = () => { const g = __game, S = g.S, A = g.E.A; g.setSpeed(0); A.learnSetChar(S, 'trader'); S.noLock = 1; Object.assign(S.learn, { intro: 11, level: 11, stage: 23, stageIntro: 22, free: true, zseen: 1, datePend: false, tab: Object.keys(g.E.BAB.TABLETS) }); S.phase = 3; S.noEvents = true; S.noShocks = true; S.player.wallet.sar = 400000; };
const clean = () => { const S = __game.S; for (const k of ['tq', 'eq', 'fq', 'rq', 'up', 'stageUp', 'sq', 'cq', 'bq', 'csq']) S.learn[k] = []; S.climate.pending = []; };
(async () => {
  const b = await chromium.launch(); const errors = [];
  const open = async (w, setup) => { const p = await b.newPage({ viewport: { width: w, height: 950 } }); p.on('pageerror', e => errors.push(e.message)); p.on('dialog', d => d.accept()); await p.goto('file://' + path.join(__dirname, '../index.html') + '?learn=1&seed=21&fold=1'); await p.waitForFunction(() => !!window.__game); await p.evaluate(base); await p.evaluate(setup); await p.evaluate(clean); await p.evaluate(() => { __game.OFFICETABS.on = false; __game.go('office'); __game.renderAll(true); }); return p; };
  const noOverflow = async p => a.equal(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, 'تمرير أفقي');
  // منظومة صغيرة: دكان واحد بلا مدير
  const small = () => { const g = __game, A = g.E.A; A.buildShop(g.S, 'riyadh'); };
  for (const w of [390, 1100]) {
    const p = await open(w, small); const m = p.locator('.mgmt'); a(await m.isVisible()); a.equal(await p.locator('.mgmt-country').count(), 1); a.equal(await p.locator('.mgmt-city').count(), 1);
    const txt = await m.innerText(); a.match(txt, /هيكل الإدارة/); a.match(txt, /بلا مدير/); a.match(txt, /ما ينقصك للرتبة التالية \(مدير ممتلك\)/); a.match(txt, /ممتلك بلا مدير: دكان 1/);
    const ex = await p.evaluate(() => __game.E.mgmtView(__game.S).countries[0].cities[0].next); a.equal(ex.ok, false); a.equal(await p.locator('.mgmt [data-act=team-promote],.mgmt [data-act=steward-promote],.mgmt [data-act=agenthire]').count(), 0, 'لا زر ترقية قبل تحقق الشروط');
    // شرح الرتب قابل للطي
    const det = p.locator('.mgmt details[data-fold=mgmt-ranks]'); a(await det.isVisible()); a.equal(await det.evaluate(e => e.open), false, 'الشرح مطوي افتراضياً'); await det.locator('summary').click(); await p.waitForTimeout(100); a.equal(await p.locator('.mgmt details[data-fold=mgmt-ranks]').evaluate(e => e.open), true); a.match(await p.locator('.mgmt details[data-fold=mgmt-ranks]').evaluate(e => e.textContent), /الأمين المدبّر/);
    await m.scrollIntoViewIfNeeded(); await noOverflow(p); await p.screenshot({ path: path.join(SHOTS, 'small-' + w + '.png') }); await p.close();
  }
  // منظومة كبيرة: أمينان في السعودية ومدير في مصر، والطور 4 فيتحقق شرط الوكيل
  const large = () => { const g = __game, S = g.S, A = g.E.A;
    for (const city of ['riyadh', 'jeddah']) { A.buildShop(S, city); A.buildShop(S, city); A.buildWarehouse(S, city); for (const w of S.player.props[city].staff) { w.days = 120; w.free = 0; } }
    A.buildShop(S, 'cairo'); A.buildFarm(S, 'riyadh');
    for (let i = 0; i < 30; i++) g.E.tick(S, false);
    for (const city of ['riyadh', 'jeddah']) { const pr = S.player.props[city]; A.promoteWorker(S, city, pr.staff.find(w => w.role === 'seller').id, 'shop', pr.shops[0].id); }
    for (let i = 0; i < 90; i++) g.E.tick(S, false);
    for (const city of ['riyadh', 'jeddah']) { A.auditCity(S, city); A.promoteSteward(S, city); }
    S.phase = 4; S.player.wallet.sar = 400000; };
  for (const w of [390, 1100]) {
    const p = await open(w, large); const m = p.locator('.mgmt'); a(await m.isVisible());
    const view = await p.evaluate(() => __game.E.mgmtView(__game.S)); const sa = view.countries.find(c => c.country === 'sa'); a.equal(sa.cities.filter(c => c.rank === 3).length, 2);
    a.equal(await p.locator('.mgmt-city').count(), view.countries.reduce((n, c) => n + c.cities.length, 0)); a.equal(await p.locator('.mgmt-assets li').count(), view.assets, 'كل ممتلك مرة واحدة في الشاشة');
    a.equal(sa.next.ok, true, 'شروط الوكيل متحققة'); const hire = p.locator('.mgmt-country[data-mgmt-country=sa] [data-act=agenthire]'); a.equal(await hire.count(), 1); a.equal(await hire.isVisible(), true);
    a.match(await p.locator('.mgmt-city[data-mgmt-city=riyadh]').innerText(), /أمين المنطقة/);
    if (w === 390) { await hire.click(); a(await p.evaluate(() => !!__game.E.agentOf(__game.S, 'sa')), 'زر التوظيف يستدعي الفعل القائم'); await p.evaluate(() => __game.renderAll(true)); a.equal(await p.locator('.mgmt-country[data-mgmt-country=sa] [data-act=agenthire]').count(), 0); a.match(await p.locator('.mgmt-country[data-mgmt-country=sa]').innerText(), /وكيل الإقليم يدير الدولة/); }
    await m.scrollIntoViewIfNeeded(); await noOverflow(p); await p.screenshot({ path: path.join(SHOTS, 'large-' + w + '.png'), fullPage: false }); await p.close();
  }
  // 023 US5: كل تنبيه في المكتب يحمل «ماذا أفعل؟»، و«المخزن شارف على الامتلاء» بأزرار التفويض أو «عيّن أميناً»
  const fill = () => { const g = __game, S = g.S, pr = S.player.props.riyadh, cap = g.E.storeCap(S, 'riyadh'); pr.store.wheat = Math.ceil(cap * 0.9 / __game.E.GD.wheat.w); };
  { const p = await open(390, () => { __game.E.A.buildShop(__game.S, 'riyadh'); __game.E.A.buildWarehouse(__game.S, 'riyadh'); }); await p.evaluate(fill); await p.evaluate(() => __game.renderAll(true));
        const dom = await p.evaluate(() => [...document.querySelectorAll('.office .ofc')].map(el => [el.dataset.ofc, !!el.querySelector('[data-todo]'), (el.querySelector('[data-todo]') || {}).textContent])); a(dom.length >= 1); a(dom.every(([, ok, t]) => ok && /^ماذا أفعل؟ \S/.test(t)), 'كل بطاقة في المكتب فيها ماذا أفعل: ' + JSON.stringify(dom));
    const card = p.locator('.ofc[data-ofc="storefull:riyadh"]'); a(await card.isVisible()); a.match(await card.innerText(), /ماذا أفعل؟/); a.equal(await card.locator('[data-act=ofhire]').count(), 1, 'بلا أمين: عيّن أميناً'); a.match(await card.locator('[data-act=ofhire]').innerText(), /عيّن أميناً/); a.equal(await card.locator('[data-act=ofsteward]').count(), 0);
    await card.scrollIntoViewIfNeeded(); await noOverflow(p); await p.screenshot({ path: path.join(SHOTS, 'office-todo-390.png') });
    await card.locator('[data-act=ofhire]').click(); a.equal(await p.evaluate(() => __game.screen), 'estate', 'يفتح العقارات'); a.equal(await p.evaluate(() => __game.estCity), 'riyadh'); await p.close(); }
  { const p = await open(390, large); await p.evaluate(fill); await p.evaluate(() => { __game.OFFICETABS.on = false; __game.go('office'); __game.renderAll(true); });
    const card = p.locator('.ofc[data-ofc="storefull:riyadh"]'); a(await card.isVisible()); const sell = card.locator('[data-act=ofsteward][data-i="riyadh|sellStale"]'), rot = card.locator('[data-act=ofsteward][data-i="riyadh|rotate"]'); a.equal(await sell.count(), 1); a.equal(await rot.count(), 1); a.match(await sell.innerText(), /فوّض الأمين ببيع الراكد/); a.match(await rot.innerText(), /عبّئ الدكاكين/); a.equal(await card.locator('[data-act=ofhire]').count(), 0);
    await card.scrollIntoViewIfNeeded(); await p.screenshot({ path: path.join(SHOTS, 'office-todo-steward-390.png') });
    const pol = () => p.evaluate(() => { const m = __game.E.stewardOf(__game.S, 'riyadh'); return JSON.stringify(m.policy); }); const before = await pol(); const snap = () => p.evaluate(() => { const P = __game.S.player; return JSON.stringify([P.wallet, P.props.riyadh.store, P.props.riyadh.shops, P.mgrActions || []]); }); const raw0 = await snap();
    await sell.click(); a.equal(await p.evaluate(() => __game.screen), 'estate'); const form = p.locator('[data-steward-form=riyadh]'); a(await form.locator('[name=sellStale]').isChecked(), 'التفويض مؤشَّر'); a.equal(await form.locator('[name=rotate]').isChecked(), false); a.equal(await pol(), before, 'لا تغيير قبل التأكيد'); a.equal(await snap(), raw0, 'لا تغيير في الرصيد ولا المخزن ولا الدكاكين');
    await form.locator('[data-act=steward-policy]').click(); a.equal(JSON.parse(await pol()).sellStale, true, 'التأكيد يحفظ التفويض');
    await p.evaluate(() => { __game.OFFICETABS.on = false; __game.go('office'); __game.renderAll(true); }); await p.locator('.ofc[data-ofc="storefull:riyadh"] [data-act=ofsteward][data-i="riyadh|rotate"]').click(); const form2 = p.locator('[data-steward-form=riyadh]'); a(await form2.locator('[name=rotate]').isChecked()); a.equal(JSON.parse(await pol()).rotate, false, 'لا تغيير قبل التأكيد'); await noOverflow(p); await p.close(); }
  // مفتاح الرجوع
  { const p = await open(390, small); await p.evaluate(() => { __game.E.MGMT.on = false; __game.renderAll(true); }); a.equal(await p.locator('.mgmt').count(), 0, 'المفتاح يخفي الشاشة'); await p.close(); }
  a.equal(errors.length, 0, errors.join('\n')); console.log('PASS management UI 390/1100 + office todo (US5): small and large system, each asset once, buttons only when conditions met, collapsible rank guide, no overflow, off switch');
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
