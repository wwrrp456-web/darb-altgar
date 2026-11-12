'use strict';
// 040ح (الواجهة) على 390 و1100: سطر المنافسين ونافذته في «حال أعمالي» بالثروة (نطاق لغير الحاكم ودقيق للحاكم) والقوة والحصة ورئيس التجار،
// بطاقة المنافسين في المكتب، «الردّ» بطاقة «المطلوب» بثلاثة خيارات، سطر «رئيس التجار» في صفحة المدينة، لا تمرير أفقي، لمس ≥ 44
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
const sheet = p => p.evaluate(() => { const s = document.getElementById('dsheet'); return s ? s.textContent.replace(/\s+/g, ' ').trim() : null; });
const wide = p => p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
const RIV = () => { const { S, E } = __game; const id = 'riyadh'; S.day = Math.max(S.day, 130); S.rivals = [];
  const mk = (i, w, str, nm) => ({ id: 800 + i, name: nm, dom: 'goods', idea: 'G05', pers: 'الجريء', bg: 'حرفي صاعد', path: 'الصاعد', rel: 'منافس شريف', city: id, born: S.day - 100, fate: 0, str, w, kn: 0, fx: { kind: 'supply', cities: [id], gs: ['tools'], mul: 0.2, start: S.day - 100, until: S.day + 9999, cont: true } });
  S.rivals.push(mk(1, 180000, 1, 'مازن الحدّاد'), mk(2, 95000, 0.3, 'راشد النسّاج')); S.rivalGen = Object.assign(S.rivalGen || { seed: 5, births: 2, next: S.day + 500 }, { births: 2, next: S.day + 500, chief: { [id]: { id: 801, nm: 'مازن الحدّاد', cand: 0, cd: 0 } } });
  for (const c of S.order) { const b = E.bossOf(S, c); if (b) b.ruler = 'x'; } if (S.cities[id].pros) S.cities[id].pros.last = S.day - 300; S.player.caravans.forEach(c => { c.captain = null; }); __game.go('home'); };
(async () => {
  const b = await chromium.launch();
  for (const w of [390, 1100]) {
    const p = await mk(b, w, '?player=1&seed=5'); await p.evaluate(RIV); await p.waitForTimeout(500);
    const row = p.locator('#screen .hs .hs-row[data-dchip="fold:hs-riv"]'); a.equal(await row.count(), 1, w + ': سطر المنافسين'); const rt = await row.innerText(); a.ok(/ثروته/.test(rt) && /≈/.test(rt), 'السطر يعرض الثروة نطاقاً: ' + rt); a.ok((await row.boundingBox()).height >= 44);
    await row.click(); await p.waitForTimeout(300); let t = await sheet(p); a.ok(t.includes('مازن الحدّاد') && t.includes('★ رئيس التجار') && t.includes('قوة 100٪') && t.includes('قوة 30٪'), 'النافذة: ' + t.slice(0, 300)); a.ok(/الثروة: ≈ [\d,]+ – [\d,]+ ريال/.test(t) && t.includes('معرفتك به: ضعيفة'), 'نطاق + معرفة: ' + t.slice(0, 400)); a.ok(!/180,000/.test(t), 'لا يظهر الرقم الدقيق لغير الحاكم');
    a.ok(/حصته 65٪/.test(t) && /حصته 35٪/.test(t), 'الحصة: ' + t.slice(0, 500)); a.equal(await wide(p), false, w + ': لا تمرير أفقي');
    await p.locator('#dsheet .dx').click(); await p.waitForTimeout(200);
    // الحاكم: رقم دقيق
    await p.evaluate(() => { const { S, E } = __game; E.bossOf(S, 'riyadh').ruler = 'player'; __game.go('home'); }); await p.waitForTimeout(400); await p.locator('#screen .hs .hs-row[data-dchip="fold:hs-riv"]').click(); await p.waitForTimeout(300); t = await sheet(p);
    a.ok(/الثروة: 180,000 ريال/.test(t) && /الثروة: 95,000 ريال/.test(t) && t.includes('معرفتك به: كاملة') && !t.includes('≈'), 'الحاكم يرى الرقم الدقيق: ' + t.slice(0, 400)); await p.locator('#dsheet .dx').click(); await p.waitForTimeout(200);
    await p.evaluate(() => { const { S, E } = __game; E.bossOf(S, 'riyadh').ruler = 'x'; });
    // بطاقة المنافسين في المكتب + الردّ بطاقة «المطلوب»
    await p.evaluate(() => { __game.ui.tab = __game.ui.tab || {}; __game.ui.tab.office = 'goals'; __game.go('office'); }); await p.waitForTimeout(500);
    await p.evaluate(() => __game.dOpen('fold:of-rivals')); await p.waitForTimeout(400);
    const rows = await p.locator('#dsheet .rival-row').count(); a.ok(rows >= 2, 'صفوف المنافسين ' + rows); const first = await p.locator('#dsheet .rival-row').first().innerText(); a.ok(first.includes('رئيس التجار') && /الثروة: ≈/.test(first) && /القوة المقيسة: 100٪/.test(first), 'الصف الأول: ' + first.slice(0, 250));
    await p.locator('#dsheet .rival-reply [data-dchip="hs:rivreply"]').first().click(); await p.waitForTimeout(300); t = await sheet(p); a.ok(t.includes('ورِّد من سوق آخر') && t.includes('عدّل سعرك'), 'خيارات الردّ: ' + t.slice(0, 300));
    const opts = await p.locator('#dsheet [data-dopt]').count(); a.ok(opts >= 3, 'ثلاثة خيارات: ' + opts); for (let i = 0; i < Math.min(3, opts); i++) a.ok((await p.locator('#dsheet [data-dopt]').nth(i).boundingBox()).height >= 44, 'لمس ≥ 44'); a.equal(await wide(p), false);
    await p.locator('#dsheet [data-dopt]', { hasText: 'عدّل سعرك' }).first().click(); await p.waitForTimeout(600); a.equal(await p.evaluate(() => __game.screen), 'estate', 'عدّل سعرك ← دكانك');
    // صفحة المدينة: «رئيس التجار»
    await p.evaluate(() => { __game.go('cities'); }); await p.waitForTimeout(500); await p.evaluate(() => __game.dOpen('fold:cities-' + __game.S.cities.riyadh.country)); await p.waitForTimeout(500);
    const ct = await p.locator('[data-cid="riyadh"] [data-chief]').count(); a.equal(ct >= 1, true, 'سطر رئيس التجار في صفحة المدينة'); a.ok((await p.locator('[data-cid="riyadh"] [data-chief]').first().innerText()).includes('مازن الحدّاد'));
    await p.context().close();
  }
  console.log('OK   حال أعمالي: سطر المنافسين والنافذة بالثروة (نطاق لغير الحاكم، دقيق للحاكم) والقوة المقيسة، بطاقة المكتب، ردّ بخيارات، سطر رئيس التجار في المدينة (390 و1100)');
  await b.close(); a.deepEqual(errors, []); console.log('rival-wealth-ui: ok');
})().catch(e => { console.error(e); process.exit(1); });
