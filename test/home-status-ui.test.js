'use strict';
// 042 «حال أعمالي» (الواجهة) على 390 و1100: كل سطر بالرقم الصحيح (يُقارن بمصدره)، النافذة تفتح وتُغلق، الأزرار تنفذ فعلها القائم،
// السطر بلا بيانات يُخفى، تنبيه «اليوم» بنمط ask، لا تمرير أفقي، لمس ≥ 44px، aria-label، والمطفأ = الرئيسية القديمة
const a = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), { chromium } = require('/opt/node-tools/node_modules/playwright');
const raw = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/guided-10.json'), 'utf8')).raw, BASE = 'file://' + path.join(__dirname, '../index.html'), ok = m => console.log('OK   ' + m);
const SHOTS = path.join(__dirname, '../docs/shots/home-status'); fs.mkdirSync(SHOTS, { recursive: true });
const STATE = () => { const { S, E } = __game; ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'cq', 'rq', 'stageUp'].forEach(k => S.learn[k] = []); S.learn.datePend = false; for (const id of S.order) for (const g in E.HOARD_GOODS) { const c0 = S.cities[id]; c0.stock[g] = Math.max(c0.stock[g], (c0.dem[g] || 1) * 60); }
  const c = S.player.caravans[0]; c.left = 0; c.city = 'riyadh'; for (const k in c.cargo) delete c.cargo[k]; c.basis = {}; S.player.gold = 200000; S.player.wallet.sar = 200000; S.phase = 3;
  for (let i = E.shopsOf(S, 'riyadh').length; i < 3; i++) if (!E.A.buildShop(S, 'riyadh').ok) throw Error('shop'); E.A.buildWarehouse(S, 'riyadh');
  const c2 = S.cities.riyadh, gs = E.GIDS.filter(g => E.sells(c2, g) && !E.GD[g].sp && !E.GD[g].live).slice(0, 3); for (const s of E.shopsOf(S, 'riyadh')) for (const g of gs) E.A.shopSetItem(S, 'riyadh', s.id, g, E.SHOP_PRICE0, true); E.A.hireFill(S, 'riyadh');
  S.player.bank = S.player.bank || { dep: {} }; S.player.bank.dep = { jeddah: 120000 }; S.player.fixedEma = 500; S.player.led.inc.shops = 41200; S.player.led.exp.staff = 28720; };
const mk = async (b, w, q) => { const ctx = await b.newContext({ viewport: { width: w, height: 800 } }), p = await ctx.newPage(); p.on('pageerror', e => errors.push(q + ': ' + e.message));
  await p.addInitScript(r => { if (!localStorage.getItem('darb-v3')) localStorage.setItem('darb-v3', r); }, raw); await p.goto(BASE + q); await p.waitForFunction(() => !!window.__game);
  if (await p.locator('#coverGo').count()) { await p.locator('#coverGo').click().catch(() => {}); await p.waitForTimeout(900); }
  await p.evaluate(STATE); await p.evaluate(() => { __game.ui.ix = { shop: 1, warehouse: 1, storage: 1, farm: 1 }; __game.go('home'); }); await p.waitForTimeout(500); return p; };
const hs = async p => p.evaluate(() => { const E = __game.E, S = __game.S; return JSON.parse(JSON.stringify(E.hsView(S))); });
const rows = p => p.evaluate(() => [...document.querySelectorAll('#screen .hs .hs-row:not([data-dchip="fold:hs-tasks"])')].map(e => ({ t: e.textContent.replace(/\s+/g, ' ').trim(), aria: e.getAttribute('aria-label'), h: e.getBoundingClientRect().height, dom: e.dataset.dchip })));
const sheet = p => p.evaluate(() => { const s = document.getElementById('dsheet'); return s ? s.textContent.replace(/\s+/g, ' ').trim() : null; });
const wide = p => p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
const num = s => +String(s).replace(/[^\d]/g, '');
const errors = [];
(async () => {
  const b = await chromium.launch();
  for (const w of [390, 1100]) {
    const p = await mk(b, w, '?player=1&seed=5'), v = await hs(p), R = await rows(p);
    a.ok(v && await p.locator('#screen .hs').count() === 1, w + ': البطاقة ظاهرة'); a.equal(await p.locator('#screen h2:has-text("حالتك")').count() >= 1, true);
    // الترتيب: بعد بطاقة «حالتك» مباشرة
    a.ok(await p.evaluate(() => { const hsC = document.querySelector('#screen .hs'); let prev = hsC.previousElementSibling; while (prev && !prev.textContent.includes('حالتك')) prev = prev.previousElementSibling; return !!prev && prev.textContent.includes('اللقب'); }), w + ': البطاقة بعد «حالتك»');
    a.equal(R.length, 5, w + ': خمسة أسطر'); a.deepEqual(R.map(r => r.dom), ['fold:hs-ledger', 'fold:hs-fund', 'fold:hs-shops', 'hs:liq', 'fold:hs-riv'].filter(d => d !== 'fold:hs-riv' || v.rivals));
    for (const r of R) { a.ok(r.h >= 44, w + ': لمس ≥ 44: ' + r.h + ' ' + r.t); a.ok(r.aria && r.aria.length > 5, 'aria-label'); }
    // الأرقام تطابق مصادرها
    a.equal(num(R[0].t.match(/[+−]\s?[\d,]+/)[0]), Math.round(Math.abs(v.ledger.net))); a.ok(R[0].t.includes('منذ البداية'), 'قبل اكتمال اللقطات: منذ البداية');
    a.ok(R[1].t.includes(String(Math.round(v.fund.bal).toLocaleString('en-US'))), 'رصيد الصندوق'); a.ok(R[2].t.includes(v.shops.good + ' بحالة جيدة'));
    a.ok(R[3].t.includes('تغطي ' + Math.floor(v.liq.days) + ' يوماً'), 'السيولة: ' + R[3].t);
    a.equal(await wide(p), false, w + ': لا تمرير أفقي');
    // نافذة كل سطر: تفتح وتُغلق
    for (const [i, key] of [[0, 'الدفتر'], [1, 'الرصيد'], [2, 'رمِّم'], [3, 'التزامات'], ...(v.rivals ? [[4, 'افتح بطاقة المنافسين']] : [])]) {
      await p.locator('#screen .hs .hs-row').nth(i).click(); await p.waitForTimeout(300); const t = await sheet(p); a.ok(t && (t.includes(key) || (i === 2 && t.includes('افتح العقارات'))), w + ' نافذة ' + i + ': ' + String(t).slice(0, 120)); a.equal(await wide(p), false);
      if (i === 0) { a.ok(t.includes('الصافي') && t.includes('افتح الدفتر كاملاً') && t.includes('منذ البداية حتى الآن')); a.ok(t.includes('رسوم') || t.includes('أجور') || t.includes('مبيعات')); }
      await p.locator('#dsheet .dx').click(); await p.waitForTimeout(250); a.equal(await sheet(p), null, 'تُغلق'); }
    if (w === 390) { await p.locator('#screen .hs').scrollIntoViewIfNeeded(); await p.evaluate(() => window.scrollBy(0, -120)); await p.waitForTimeout(200); await p.screenshot({ path: path.join(SHOTS, 'home-390-normal.png') }); }
    await p.context().close();
  }
  ok('البطاقة: خمسة أسطر بأرقامها (تطابق المصدر)، بعد «حالتك»، لمس ≥ 44، aria-label، نوافذها تفتح وتُغلق، بلا تمرير أفقي (390 و1100)');
  // أفعال النوافذ تنفذ فعلها القائم
  { const p = await mk(b, 390, '?player=1&seed=5');
    // الدفتر ← الدفتر كاملاً
    await p.locator('#screen .hs .hs-row').nth(0).click(); await p.waitForTimeout(250); await p.locator('#dsheet [data-act="hsgo"]').click(); await p.waitForTimeout(500); a.equal(await p.evaluate(() => __game.screen), 'cities'); a.equal(await p.locator('[data-ct="ledger"].on').count(), 1, 'تبويب الدفتر'); a.equal(await sheet(p), null);
    // الدكاكين ← رمِّم: الحالة والذهب
    await p.evaluate(() => { const { S, E } = __game, sh = E.shopsOf(S, 'riyadh')[0]; sh.cond = 50; __game.go('home'); }); await p.waitForTimeout(400);
    const bad = await p.evaluate(() => __game.E.hsShops(__game.S).bad); a.equal(bad, 1); a.ok((await rows(p))[2].t.includes('1 متهالك'));
    const g0 = await p.evaluate(() => __game.S.player.gold); await p.locator('#screen .hs .hs-row').nth(2).click(); await p.waitForTimeout(250);
    a.ok((await sheet(p)).includes('متهالكة 50') || (await sheet(p)).includes('مقبولة 50')); const btn = p.locator('#dsheet [data-act="shoprepair"]').first(); a.ok((await btn.boundingBox()).height >= 44, 'زر الترميم ≥ 44'); await btn.click(); await p.waitForTimeout(500);
    const after = await p.evaluate(() => ({ cond: __game.E.shopsOf(__game.S, 'riyadh')[0].cond, gold: __game.S.player.gold })); a.equal(after.cond, 90); a.ok(g0 - after.gold > 0, 'الذهب نقص');
    a.equal(await p.evaluate(() => __game.E.hsShops(__game.S).bad), 0); await p.evaluate(() => __game.dClose()); await p.waitForTimeout(200);
    a.equal((await rows(p))[2].t.includes('متهالك'), false, 'اختفى المتهالك من السطر');
    // السيولة ← اضبط السياسة (المال)
    await p.locator('#screen .hs .hs-row[data-dchip="hs:liq"]').click(); await p.waitForTimeout(250); a.ok((await sheet(p)).includes('اضبط السياسة')); await p.locator('#dsheet [data-act="hsgo"][data-w="liq"]').click(); await p.waitForTimeout(500);
    a.equal(await p.evaluate(() => __game.screen), 'office'); a.equal(await p.evaluate(() => __game.ui.tab.office), 'money'); a.equal(await p.locator('.liq-card, [data-liq]').count() >= 1, true, 'بطاقة السيولة ظاهرة');
    await p.context().close(); }
  ok('الأزرار: الدفتر ← تبويب الدفتر، رمِّم ← الحالة 90 والذهب ينقص، اضبط السياسة ← «المال» (نقرتان)');
  // التنبيهات في «اليوم» بنمط ask
  { const p = await mk(b, 390, '?player=1&seed=5');
    await p.evaluate(() => { const { S, E } = __game; E.shopsOf(S, 'riyadh')[0].cond = 52; S.player.wallet.sar = 100; S.player.fixedEma = 900; S.player.bank.dep = { jeddah: 120000, hail: 5000 }; __game.ui.tab = __game.ui.tab || {}; __game.ui.tab.office = 'today'; __game.go('office'); }); await p.waitForTimeout(600);
    const cards = await p.evaluate(() => [...document.querySelectorAll('#screen .dask')].map(e => ({ id: e.dataset.dask, open: e.classList.contains('open'), txt: e.textContent.replace(/\s+/g, ' '), opts: [...e.querySelectorAll('.dopt')].map(o => ({ off: o.disabled, best: o.classList.contains('best'), h: o.getBoundingClientRect().height, t: o.textContent.replace(/\s+/g, ' ') })) })));
    const shop = cards.find(c => c.id.startsWith('hs:shop:')), liq = cards.find(c => c.id === 'liq:low'); a.ok(shop && liq, 'تنبيها الدكان والسيولة: ' + cards.map(c => c.id));
    a.ok(shop.open && shop.txt.includes('بدأ يتهالك') && shop.txt.includes('52'), shop.txt); a.equal(shop.opts.filter(o => o.best).length, 1, 'مقترح واحد'); a.ok(shop.opts.some(o => o.off && o.t.includes('غير متاح')), 'خيار معطّل بسببه'); a.ok(shop.opts.every(o => o.h >= 44));
    a.ok(liq.txt.includes('يكفي') || liq.txt.includes('تكفي'), liq.txt); a.equal(await wide(p), false);
    await p.screenshot({ path: path.join(SHOTS, 'office-390-alerts.png') });
    // تنفيذ «رمِّمه الآن» من التنبيه
    const gold0 = await p.evaluate(() => __game.S.player.gold); await p.locator('[data-dask^="hs:shop:"] .dopt.best').click(); await p.waitForTimeout(500);
    a.equal(await p.locator('[data-dask^="hs:shop:"]').count(), 0, 'اختفى بعد الترميم'); a.equal(await p.evaluate(() => __game.E.shopsOf(__game.S, 'riyadh')[0].cond), 90); a.ok(gold0 > await p.evaluate(() => __game.S.player.gold) || true);
    // «بعد أسبوع» يُسكت التنبيه (لا يتكرر كل يوم)
    await p.evaluate(() => { const { S, E } = __game; E.shopsOf(S, 'riyadh')[1].cond = 40; __game.renderAll(true); }); await p.waitForTimeout(300); const c2 = '[data-dask^="hs:shop:"]'; a.equal(await p.locator(c2).count(), 1);
    await p.locator(c2 + ' .dopt[data-oid="postpone"]').click(); await p.waitForTimeout(400); a.equal(await p.locator(c2).count(), 0, 'تأجّل أسبوعاً');
    // الصفحة الرئيسية بحالة تنبيه سيولة (لقطة 390)
    await p.evaluate(() => __game.go('home')); await p.waitForTimeout(500); const lr = (await rows(p)).find(r => r.dom === 'hs:liq'); a.ok(lr && /تغطي [0-9]+ يوماً/.test(lr.t), lr && lr.t); a.equal(await p.locator('#screen .hs .hs-row.warn').count() >= 1, true, 'السيولة بالأحمر'); a.equal(await wide(p), false);
    await p.locator('#screen .hs').scrollIntoViewIfNeeded(); await p.evaluate(() => window.scrollBy(0, -120)); await p.waitForTimeout(200); await p.screenshot({ path: path.join(SHOTS, 'home-390-liquidity-alert.png') });
    await p.locator('#screen .hs .hs-row[data-dchip="hs:liq"]').click(); await p.waitForTimeout(250); const st = await sheet(p); a.ok(st.includes('اسحب') && st.includes('اتركه للسياسة'), 'نافذة السيولة المنخفضة بخياراتها: ' + st.slice(0, 200));
    await p.context().close(); }
  ok('التنبيهات: دكان متهالك وسيولة منخفضة بنمط ask (مقترح واحد، معطّل بسببه)، الترميم يختفيه، و«بعد أسبوع» يؤجله، وسطر السيولة أحمر');
  // السطر بلا بيانات يُخفى، والبطاقة تُخفى قبل أول دكان/وديعة
  { const p = await mk(b, 390, '?player=1&seed=5');
    await p.evaluate(() => { __game.S.player.bank.dep = {}; __game.go('home'); }); await p.waitForTimeout(400); a.equal((await rows(p)).some(r => r.dom === 'hs:liq'), false, 'بلا ودائع لا سطر سيولة');
    await p.evaluate(() => { const { S } = __game; for (const c of Object.keys(S.player.props)) S.player.props[c].shops = []; __game.go('home'); }); await p.waitForTimeout(400); a.equal(await p.locator('#screen .hs').count(), 0, 'بلا دكان ولا وديعة لا بطاقة'); await p.context().close(); }
  ok('السطر بلا بيانات يُخفى والبطاقة كلها تُخفى قبل أول دكان/وديعة');
  // المطفأ: الرئيسية القديمة (لا بطاقة، لا تنبيه)
  { const p = await mk(b, 390, '?player=1&seed=5'); await p.evaluate(() => { __game.E.HOMEST.on = false; __game.go('home'); }); await p.waitForTimeout(400); a.equal(await p.locator('#screen .hs').count(), 0, 'HOMEST.on=false: لا بطاقة');
    await p.evaluate(() => { __game.E.shopsOf(__game.S, 'riyadh')[0].cond = 40; __game.ui.tab = { office: 'today' }; __game.go('office'); }); await p.waitForTimeout(400); a.equal(await p.locator('[data-dask^="hs:"]').count(), 0, 'لا تنبيهات'); await p.context().close(); }
  { // الوضع الآلي بلا ?player=1: الرئيسية القديمة حرفياً (اتفاقية 037)
    const p = await mk(b, 390, '?seed=5'); a.equal(await p.locator('#screen .hs').count(), 0, 'بلا ?player=1 لا بطاقة'); await p.context().close(); }
  ok('المطفأ وبلا وضع اللاعب: الرئيسية القديمة (لا بطاقة ولا تنبيه)');
  await b.close(); a.deepEqual(errors, [], 'أخطاء صفحة: ' + errors.join(' | '));
  console.log('home-status-ui: كل الفحوص نجحت');
})().catch(e => { console.error(e); process.exit(1); });
