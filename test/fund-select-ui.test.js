'use strict';
// 040ز-ب «ظهور الاختيار» (390 و1100): بعد النقر على البُعد والنسبة يظهر المختار (on + aria-pressed)، الملخص بالمبلغ الصحيح، النافذة السفلية تُعاد رسمها،
// التأكيد يستدعي الفعل بالقيم المختارة، وأزرار السيولة (النسبة الشهرية) تُظلَّل بالقاعدة نفسها
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
const errors = [];
const sheetT = p => p.evaluate(() => { const s = document.getElementById('dsheet'); return s ? s.textContent.replace(/\s+/g, ' ').trim() : null; });
const grp = (p, sel) => p.evaluate(s => [...document.querySelectorAll(s)].map(e => ({ on: e.classList.contains('on'), ap: e.getAttribute('aria-pressed'), t: e.textContent.trim() })), sel);
(async () => {
  const b = await chromium.launch();
  for (const w of [390, 1100]) {
    const p = await mk(b, w, '?player=1&seed=5');
    await p.evaluate(() => { const { S, E } = __game; const f = E.hsFund(S); E.bossOf(S, f.city).ruler = 'player'; S.cities[f.city].fund.bal = 20000; S.cities[f.city].fund.avg = 100; __game.go('home'); }); await p.waitForTimeout(400);
    const info = await p.evaluate(() => { const { S, E } = __game, f = E.hsFund(S); return { city: f.city, avail: E.fundAvail(S, f.city), unit: E.fundView(S, f.city).unit, bal: S.cities[f.city].fund.bal }; });
    a.ok(info.avail >= 1000, 'المتاح ' + info.avail);
    await p.locator('#screen .hs .hs-row[data-dchip="fold:hs-fund"]').click(); await p.waitForTimeout(300);
    const D = '#dsheet [data-fund-spend]';
    // قبل الاختيار
    a.ok((await sheetT(p)).includes('اختر بُعداً ثم نسبة'), w + ': ملخص ما قبل الاختيار'); a.equal(await p.locator(D + ' [data-act="fundspend"]').isDisabled(), true); a.ok((await p.locator(D + ' [data-act="fundspend"]').textContent()).includes('اختر بُعداً'), 'سبب التعطيل');
    a.equal((await grp(p, D + ' [data-act="fundpick"]')).filter(x => x.on).length, 0);
    // البُعد
    await p.locator(D + ' [data-act="fundpick"][data-d="sci"]').click(); await p.waitForTimeout(250);
    let g = await grp(p, '#dsheet [data-act="fundpick"]'); a.equal(g.filter(x => x.on).length, 1, w + ': بُعد واحد on'); a.equal(g.find(x => x.on).ap, 'true'); a.ok(g.filter(x => !x.on).every(x => x.ap === 'false'));
    a.ok((await sheetT(p)).includes('اختر نسبة'), 'سبب: اختر نسبة'); a.ok((await p.locator(D + ' [data-act="fundspend"]').textContent()).includes('اختر نسبة'));
    // النسبة
    await p.locator(D + ' [data-act="fundpct"][data-p="50"]').click(); await p.waitForTimeout(250);
    g = await grp(p, '#dsheet [data-act="fundpct"]'); a.equal(g.filter(x => x.on).length, 1, w + ': نسبة واحدة on'); a.ok(g.find(x => x.on).t.startsWith('50')); a.equal(g.find(x => x.on).ap, 'true');
    const amt = Math.floor(info.avail * 50 / 100), sum = await p.locator('#dsheet [data-fund-sum]').textContent();
    a.ok(sum.includes('اخترتَ') && sum.includes('50٪') && sum.includes(amt.toLocaleString('en-US')) && sum.includes((amt / info.unit).toFixed(1)), w + ': الملخص: ' + sum);
    a.equal(await p.locator(D + ' [data-act="fundspend"]').isDisabled(), false); a.equal(await p.locator(D + ' [data-act="fundspend"]').getAttribute('data-n'), String(amt));
    // لون المختار فعلاً مختلف عن غير المختار
    a.ok(await p.evaluate(() => { const on = document.querySelector('#dsheet [data-act="fundpick"].on'), off = document.querySelector('#dsheet [data-act="fundpick"].ghost'); return getComputedStyle(on).backgroundColor !== getComputedStyle(off).backgroundColor; }), 'تظليل مرئي');
    // التغيير يبقى النافذة مفتوحة
    a.ok(await p.locator('#dsheet').count() === 1, 'النافذة لم تُغلق');
    // التأكيد
    const gold0 = await p.evaluate(() => __game.S.cities[__game.E.hsFund(__game.S).city].fund.bal);
    await p.locator(D + ' [data-act="fundspend"]').click(); await p.waitForTimeout(300);
    const bal1 = await p.evaluate(() => __game.S.cities[__game.E.hsFund(__game.S).city].fund.bal); a.ok(Math.abs(gold0 - bal1 - amt) < 1e-6, w + ': الصندوق نقص ' + (gold0 - bal1) + ' والمطلوب ' + amt);
    await p.context().close();
  }
  console.log('OK   أنفق الآن: البُعد والنسبة والملخص والتعطيل بسببه والتأكيد (390 و1100)');
  // السيولة: نسبة السحب الشهري
  { const p = await mk(b, 390, '?player=1&seed=5'); await p.locator('#screen .hs .hs-row[data-dchip="hs:liq"]').click(); await p.waitForTimeout(300);
    let g = await grp(p, '#dsheet [data-k="monthMax"]'); a.ok(g.length >= 4); a.equal(g.filter(x => x.on).length, 1);
    const target = g.find(x => !x.on).t; await p.locator('#dsheet [data-k="monthMax"]', { hasText: target }).first().click(); await p.waitForTimeout(250);
    g = await grp(p, '#dsheet [data-k="monthMax"]'); a.equal(g.filter(x => x.on).length, 1); a.equal(g.find(x => x.on).t, target, 'المختار الجديد مظلَّل داخل النافذة');
    await p.context().close(); }
  console.log('OK   السيولة: الاختيار الجديد يُظلَّل داخل النافذة');
  await b.close(); a.deepEqual(errors, []); console.log('fund-select-ui: ok');
})().catch(e => { console.error(e); process.exit(1); });
