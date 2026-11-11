'use strict';
// 043أ «مجلس الناظر» (واجهة) على 390 و1100: نقرتان من الرئيسية، إضافة مهمة بتظليل الخيار وملخص بالرقم، امتلاء الخانات برسالة سببها،
// التجميد، اسأل الناظر بأجوبة من أرقام فعلية، لا تمرير أفقي، لمس ≥ 44px، والمفتاح مطفأً = لا زر.
const a = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), { chromium } = require('/opt/node-tools/node_modules/playwright');
const raw = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/guided-10.json'), 'utf8')).raw, BASE = 'file://' + path.join(__dirname, '../index.html'), ok = m => console.log('OK   ' + m);
const STATE = () => { const { S, E } = __game; ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'cq', 'rq', 'stageUp'].forEach(k => S.learn[k] = []); S.learn.datePend = false; for (const id of S.order) for (const g in E.HOARD_GOODS) { const c0 = S.cities[id]; c0.stock[g] = Math.max(c0.stock[g], (c0.dem[g] || 1) * 60); }
  const c = S.player.caravans[0]; c.left = 0; c.city = 'riyadh'; for (const k in c.cargo) delete c.cargo[k]; c.basis = {}; S.player.gold = 200000; S.player.wallet.sar = 200000; S.phase = 3;
  for (let i = E.shopsOf(S, 'riyadh').length; i < 3; i++) if (!E.A.buildShop(S, 'riyadh').ok) throw Error('shop'); E.A.buildWarehouse(S, 'riyadh');
  const c2 = S.cities.riyadh, gs = E.GIDS.filter(g => E.sells(c2, g) && !E.GD[g].sp && !E.GD[g].live).slice(0, 3); for (const s of E.shopsOf(S, 'riyadh')) for (const g of gs) E.A.shopSetItem(S, 'riyadh', s.id, g, E.SHOP_PRICE0, true); E.A.hireFill(S, 'riyadh');
  S.player.bank = S.player.bank || { dep: {} }; S.player.bank.dep = { jeddah: 120000 }; S.player.fixedEma = 500; S.player.led.inc.shops = 41200; S.player.led.exp.staff = 28720; S.player.led.exp.upkeep = 6400; };
const HIRE = () => { const { S, E } = __game; S.player.diwan = { since: S.day, box: 0, rules: E.diwanDefaults(), ask: [], log: [], cool: {}, said: {}, fillDay: {}, idle: {}, late: 0, paid: 0, covered: 0 }; };
const errors = [];
const mk = async (b, w, q, hire) => { const ctx = await b.newContext({ viewport: { width: w, height: 800 } }), p = await ctx.newPage(); p.on('pageerror', e => errors.push(q + ': ' + e.message));
  await p.addInitScript(r => { if (!localStorage.getItem('darb-v3')) localStorage.setItem('darb-v3', r); }, raw); await p.goto(BASE + q); await p.waitForFunction(() => !!window.__game);
  if (await p.locator('#coverGo').count()) { await p.locator('#coverGo').click().catch(() => {}); await p.waitForTimeout(900); }
  await p.evaluate(STATE); if (hire) await p.evaluate(HIRE); await p.evaluate(() => { __game.ui.ix = { shop: 1, warehouse: 1, storage: 1, farm: 1 }; __game.go('home'); }); await p.waitForTimeout(500); return p; };
const sheet = p => p.evaluate(() => { const s = document.getElementById('dsheet'); return s ? s.textContent.replace(/\s+/g, ' ').trim() : null; });
const wide = p => p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
const tick = p => p.waitForTimeout(250);
const refresh = async p => { const q = p.locator('#dsheet [data-act="dlq"][data-q="news"]'); await q.click(); await q.click(); await tick(p); }; // إعادة رسم النافذة بنقرتين متعاكستين بعد تغيير من المحرك
(async () => {
  const b = await chromium.launch();
  { // بلا ناظر: لا زر
    const p = await mk(b, 390, '?player=1&seed=5', false); a.equal(await p.locator('#screen .hs').count(), 1); a.equal(await p.locator('.hs-council').count(), 0, 'بلا ناظر لا مجلس'); await p.context().close(); }
  for (const w of [390, 1100]) {
    const p = await mk(b, w, '?player=1&seed=5', true);
    // 1) نقطة الوصول: الرئيسية ← مجلس الناظر بنقرة واحدة في رأس «حال أعمالي»
    a.equal(await p.evaluate(() => __game.screen), 'home'); const btn = p.locator('#screen .hs .hs-council'); a.equal(await btn.count(), 1); a((await btn.boundingBox()).height >= 44, 'لمس ≥ 44');
    await btn.click(); await tick(p); let t = await sheet(p); a(t && t.includes('مجلس الناظر') && t.includes('0 من 8'), w + ': ' + String(t).slice(0, 100)); a.equal(await wide(p), false, w + ': لا تمرير أفقي');
    a.equal(await p.locator('#dsheet select').count(), 0, 'بلا قوائم منسدلة');
    // 2) أضف مهمة: كل خيار يُظلَّل مع ملخص بالرقم
    await p.evaluate(() => { const { S, E } = __game, sh = E.shopsOf(S, 'riyadh'); sh[0].cond = 40; sh[1].cond = 50; }); await refresh(p);
    await p.locator('#dsheet [data-act="dlnew"]').click(); await tick(p);
    const cardOn = async (card) => p.evaluate(c => [...document.querySelectorAll('#dsheet [data-dask="' + c + '"] .dopt.on')].map(e => ({ t: e.textContent.replace(/\s+/g, ' ').trim(), p: e.getAttribute('aria-pressed') })), card);
    let on = await cardOn('dl:kind'); a.equal(on.length, 1); a.equal(on[0].p, 'true'); a(on[0].t.includes('ترميم الدكاكين'));
    const sum = () => p.locator('#dsheet [data-dl-sum]').innerText();
    a.match(await sum(), /ترميم الدكاكين تحت حالة 55 في كل المدن: 2 دكان الآن بنحو [\d,]+ ريال · ميزانية الشهر 5٪ من رصيدك = [\d,]+ ريال · يشغل خانة 1 من 8/, await sum());
    { const g = await p.evaluate(() => __game.S.player.gold), m = (await sum()).match(/= ([\d,]+) ريال/)[1]; a.equal(+m.replace(/,/g, ''), Math.round(g * 0.05), 'السقف = 5٪ من الرصيد الفعلي'); }
    await p.locator('#dsheet [data-dask="dl:f:type"] [data-oid="v-once"]').click(); await tick(p); on = await cardOn('dl:f:type'); a.equal(on.length, 1); a(on[0].t.includes('الآن مرة واحدة'), 'ظُلّل «مرة واحدة»'); a.equal(on[0].p, 'true');
    a.match(await sum(), /تحت حالة 55 في كل المدن: 2 دكان الآن/); a(!(await sum()).includes('ميزانية الشهر'), 'مرة واحدة بلا ميزانية شهرية');
    await p.locator('#dsheet [data-dask="dl:f:below"] [data-oid="v-45"]').click(); await tick(p); on = await cardOn('dl:f:below'); a.equal(on.length, 1); a(on[0].t.includes('تحت 45')); a.match(await sum(), /تحت حالة 45 في كل المدن: 1 دكان الآن/, 'الملخص يتبع الاختيار بالرقم');
    await p.locator('#dsheet [data-dask="dl:f:scope"] [data-oid="v-riyadh"]').click(); await tick(p); on = await cardOn('dl:f:scope'); a.equal(on.length, 1); a(on[0].t.includes('الرياض')); a.match(await sum(), /في الرياض: 1 دكان/);
    a.equal(await wide(p), false);
    // 3) تأكيد: يرمّم فعلاً ويسجّل، والخانة تتحرر
    const g0 = await p.evaluate(() => __game.S.player.gold); await p.locator('#dsheet [data-dask="dl:go"] [data-oid="add"]').click(); await tick(p);
    const after = await p.evaluate(() => { const { S, E } = __game; return { conds: E.shopsOf(S, 'riyadh').slice(0, 2).map(s => s.cond), gold: S.player.gold, used: E.delegUsed(S) }; });
    a.equal(after.conds[0], 90); a.equal(after.conds[1], 50, 'الثاني فوق 45 لم يُمسّ'); a(g0 - after.gold > 0, 'الذهب نقص'); a.equal(after.used, 0, 'أنجزت فتحررت');
    t = await sheet(p); a(t.includes('سجل الناظر') && t.includes('رمّمتُ 1 دكاناً') && t.includes('غير قابل للتراجع'), 'السجل: ' + t.slice(-300)); a.equal(await p.locator('#dsheet [data-dask="dl:kind"]').count(), 0, 'أُغلق المعالج بعد الإضافة');
    // 4) قاعدة دائمة تشغل خانة ويظهر العدّاد
    await p.evaluate(() => { const { S, E } = __game; E.A.delegAdd(S, { kind: 'shopfix', type: 'standing', scope: 'riyadh', limits: { below: 45, pct: 2 }, mode: 'ask' }); }); await refresh(p);
    t = await sheet(p); a(t.includes('1 من 8') && t.includes('قاعدة دائمة'), 'خانة مستعملة'); a(t.includes('+5'), 'الأجر +wageStep');
    // 5) امتلاء الخانات: السبب على الزر
    await p.evaluate(() => { const { S, E } = __game; for (let i = 0; i < 7; i++) E.A.delegAdd(S, { kind: 'shopfix', type: 'standing', scope: 'jeddah' in S.player.props ? 'jeddah' : 'riyadh', limits: { below: 55, pct: 5 }, mode: 'mine' }); }); await refresh(p);
    a.equal(await p.evaluate(() => __game.E.delegUsed(__game.S)), 8); await p.locator('#dsheet [data-act="dlnew"]').click(); await tick(p);
    const go = p.locator('#dsheet [data-dask="dl:go"] [data-oid="add"]'); a.equal(await go.isDisabled(), true); a.match(await p.locator('#dsheet [data-dask="dl:go"]').innerText(), /الخانات ممتلئة \(8\/8\): أنجز مهمة أو ألغِ واحدة/);
    // إلغاء مهمة يحرر خانة
    await p.locator('#dsheet [data-act="dlcancel"]').first().click(); await tick(p); a.equal(await p.evaluate(() => __game.E.delegUsed(__game.S)), 7); a((await sheet(p)).includes('7 من 8'));
    // 6) التجميد: الخيار يُظلَّل وتُعاد الرسم
    const fr = p.locator('#dsheet [data-act="dlfreeze"]'); a.equal(await fr.getAttribute('aria-pressed'), 'false'); await fr.click(); await tick(p);
    a.equal(await p.locator('#dsheet [data-act="dlfreeze"]').getAttribute('aria-pressed'), 'true'); a(await p.locator('#dsheet [data-act="dlfreeze"].on').count() === 1); a.equal(await p.evaluate(() => __game.E.delegView(__game.S).frozen), true); a((await sheet(p)).includes('مجمَّدة'));
    await p.locator('#dsheet [data-act="dlfreeze"]').click(); await tick(p); a.equal(await p.evaluate(() => __game.E.delegView(__game.S).frozen), false);
    // 7) اسأل الناظر: السؤال المختار يُظلَّل وجوابه من أرقام فعلية
    const q = p.locator('#dsheet [data-act="dlq"][data-q="loss"]'); a.equal(await q.getAttribute('aria-pressed'), 'false'); await q.scrollIntoViewIfNeeded(); await q.click(); await tick(p);
    a.equal(await p.locator('#dsheet [data-act="dlq"][data-q="loss"]').getAttribute('aria-pressed'), 'true'); a.equal(await p.locator('#dsheet [data-act="dlq"].on').count(), 1);
    const ans = await p.locator('#dsheet [data-dl-answer="loss"]').innerText(); a(ans.includes('1) أجور عمّال المتاجر: 28,720 ريال'), 'الأكبر أولاً باسمه: ' + ans); const up = await p.evaluate(() => Math.round(__game.S.player.led.exp.upkeep)); a(ans.includes('صيانة: ' + up.toLocaleString('en-US') + ' ريال'), 'الصيانة بقيمتها من الدفتر: ' + ans); a(!ans.split('\n').filter(l => /^\d\)/.test(l)).some(l => l.includes('مشتريات')), 'المشتريات ليست خسارة');
    await p.locator('#dsheet [data-act="dlq"][data-q="suggest"]').click(); await tick(p); a.equal(await p.locator('#dsheet [data-act="dlq"].on').count(), 1); a.match(await p.locator('#dsheet [data-dl-answer]').innerText(), /خاناتك: 7 من 8/);
    await p.locator('#dsheet [data-act="dlq"][data-q="status"]').click(); await tick(p); const st = await p.locator('#dsheet [data-dl-answer]').innerText(); a(st.includes('الصافي'), st);
    await p.locator('#dsheet [data-dl-answer] [data-act="dlgo"]').first().click(); await tick(p); a.equal(await sheet(p), null, 'تصرّف بنفسك يغلق النافذة ويفتح الشاشة'); a.equal(await p.evaluate(() => __game.screen), 'cities');
    a.equal(await wide(p), false); await p.context().close();
  }
  { // المفتاح مطفأً: لا زر ولا نافذة
    const p = await mk(b, 390, '?player=1&seed=5', true); await p.evaluate(() => { __game.E.DELEG.on = false; __game.go('office'); __game.go('home'); }); await tick(p); a.equal(await p.locator('.hs-council').count(), 0); await p.context().close(); }
  ok('مجلس الناظر: نقرة من الرئيسية (رأس حال أعمالي)، إضافة مهمة بتظليل كل خيار وملخص بالرقم، ترميم فعلي وسجل، امتلاء 8/8 بسببه، إلغاء/تجميد/أسئلة، بلا تمرير أفقي ولا قوائم (390 و1100)، والمطفأ بلا زر');
  await b.close(); if (errors.length) { console.error('ERRORS: ' + errors.join('\n')); process.exit(1); }
})().catch(e => { console.error('FAIL', e); process.exit(1); });
